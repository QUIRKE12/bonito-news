// NEW — Phase 5. Updated — Phase 7: sends via sendWithRetry, isUnregistered
// now lives in ./push-retry (see PHASE7_NOTES.md for why).
import { User } from "../models/User";
import { isUnregistered, sendWithRetry } from "./push-retry";

type PushPayload = {
  title: string;
  body: string;
  url?: string; // where to navigate on click, e.g. "/articles/some-slug"
};

/**
 * Sends a push notification to every registered device for one user.
 * Prunes tokens that Firebase reports as no-longer-valid (uninstalled app,
 * revoked permission, expired token) so the DB doesn't accumulate dead tokens.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const user = await User.findById(userId).select("fcmTokens").lean();
  const tokens: string[] = (user as any)?.fcmTokens ?? [];
  if (tokens.length === 0) return;

  const responses = await sendWithRetry(tokens, payload);

  const deadTokens = responses
    .map((r, i) => (!r.success && isUnregistered(r.error?.code) ? tokens[i] : null))
    .filter((t): t is string => Boolean(t));

  if (deadTokens.length > 0) {
    await User.updateOne({ _id: userId }, { $pull: { fcmTokens: { $in: deadTokens } } });
  }
}
