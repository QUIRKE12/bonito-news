/**
 * Phase 6 — batch push sending.
 * Phase 7 — now routes each 500-token batch through sendWithRetry (see
 * push-retry.ts) instead of calling sendEachForMulticast directly, so
 * transient FCM failures get retried with backoff before counting as
 * failed. Dead-token pruning below is unchanged.
 *
 * Companion to `sendPushToUser` in lib/firebase/push.ts — paste this
 * function in alongside it, or keep it here and import both. Mirrors
 * sendPushToUser's token shape (notification + data.url + webpush
 * fcmOptions.link) and dead-token pruning exactly, just fanned out across
 * many users instead of one.
 *
 * Phase 7 update: `isUnregistered` now comes from push-retry.ts instead of
 * push.ts (see that file's header comment for why — avoids a circular
 * import now that push.ts also depends on push-retry.ts for sendWithRetry).
 * No edit to push.ts is needed for this import anymore; see PHASE7_NOTES.md
 * for the one edit push.ts does still need.
 */

import { User } from "../models/User";
import { isUnregistered, sendWithRetry } from "./push-retry";

// FCM caps sendEachForMulticast at 500 registration tokens per call.
const FCM_BATCH_SIZE = 500;

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface TokenOwner {
  token: string;
  userId: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Sends one push payload to many users at once.
 *
 * - Looks up all target users' fcmTokens in a single query.
 * - Batches tokens into groups of <=500 per FCM's multicast limit.
 * - Each batch is sent via sendWithRetry, which retries transient
 *   per-token failures (server hiccups, timeouts, rate limits) with
 *   backoff before they count as failed.
 * - Prunes any token FCM reports as no-longer-registered, from the
 *   correct user's document (mirrors the dead-token pruning in Phase 5's
 *   single-user sender, just fanned out across users). Dead tokens are
 *   never retried — see push-retry.ts.
 *
 * Returns counts so callers (e.g. an admin "send to all subscribers"
 * action) can report success/failure without inspecting FCM internals.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; prunedTokens: number }> {
  if (userIds.length === 0) {
    return { sent: 0, failed: 0, prunedTokens: 0 };
  }

  const users = await User.find(
    { _id: { $in: userIds } },
    { fcmTokens: 1 }
  ).lean();

  const tokenOwners: TokenOwner[] = [];
  for (const user of users) {
    for (const token of user.fcmTokens ?? []) {
      tokenOwners.push({ token, userId: String(user._id) });
    }
  }

  if (tokenOwners.length === 0) {
    return { sent: 0, failed: 0, prunedTokens: 0 };
  }

  let sent = 0;
  let failed = 0;
  const tokensToPruneByUser = new Map<string, string[]>();

  const batches = chunk(tokenOwners, FCM_BATCH_SIZE);

  for (const batch of batches) {
    const tokens = batch.map((t) => t.token);

    const results = await sendWithRetry(tokens, payload);

    results.forEach((result, i) => {
      if (result.success) {
        sent += 1;
        return;
      }
      failed += 1;

      if (isUnregistered(result.error?.code)) {
        const owner = batch[i];
        const existing = tokensToPruneByUser.get(owner.userId) ?? [];
        existing.push(owner.token);
        tokensToPruneByUser.set(owner.userId, existing);
      }
    });
  }

  let prunedTokens = 0;
  for (const [userId, deadTokens] of tokensToPruneByUser.entries()) {
    await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: { $in: deadTokens } } }
    );
    prunedTokens += deadTokens.length;
  }

  return { sent, failed, prunedTokens };
}
