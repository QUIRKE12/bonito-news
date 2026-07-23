/**
 * Phase 7 — retry/backoff on push send failures.
 *
 * Shared by sendPushToUser (push.ts) and sendPushToUsers (push-batch.ts) —
 * both currently call `firebaseAdmin.messaging().sendEachForMulticast(...)`
 * directly and treat every non-`isUnregistered` failure as final. This
 * wraps that call so transient failures (FCM hiccups, timeouts, rate
 * limits) get retried with backoff, while dead-token failures still flow
 * straight through to each caller's existing pruning logic untouched.
 *
 * Deliberately NOT retrying `isUnregistered` tokens — a token FCM says
 * doesn't exist won't start existing on attempt 2, so retrying those would
 * just burn attempts and delay the real (retryable) sends in the same
 * batch.
 *
 * NOTE: `isUnregistered` now lives here rather than in push.ts. push.ts
 * needs to import `sendWithRetry` from this file, so keeping
 * `isUnregistered` in push.ts (as Phase 6 set it up) would make push.ts
 * and push-retry.ts import from each other — a circular dependency.
 * Centralizing both error-classification helpers here avoids that; push.ts
 * and push-batch.ts both now import `isUnregistered` from this file
 * instead. See the Phase 7 notes for the resulting one-line edit to
 * push.ts.
 */

import { firebaseAdmin } from "../config/firebase";

const MAX_ATTEMPTS = 4; // 1 initial send + up to 3 retries
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8_000;

// FCM error codes documented as transient/server-side — safe to retry.
// https://firebase.google.com/docs/cloud-messaging/send-message#admin-sdk-error-reference
const RETRYABLE_CODES = new Set([
  "messaging/internal-error",
  "messaging/server-unavailable",
  "messaging/timeout",
  "messaging/quota-exceeded",
  "messaging/message-rate-exceeded",
  "messaging/unknown-error",
]);

export function isRetryable(code?: string): boolean {
  return !!code && RETRYABLE_CODES.has(code);
}

// Moved from push.ts (Phase 5) — same dead-token check, just relocated so
// this file has no dependency back on push.ts.
export function isUnregistered(code?: string): boolean {
  return code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
}

function delayForAttempt(attempt: number): number {
  // Exponential backoff (500ms, 1s, 2s, ...) capped at MAX_DELAY_MS, with
  // +/-20% jitter so a burst of failures doesn't all retry in lockstep.
  const exp = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const jitter = exp * 0.2 * (Math.random() * 2 - 1);
  return Math.round(exp + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryPushPayload {
  title: string;
  body: string;
  url?: string;
}

// Loosely typed to match the untyped `response.responses[i]` shape already
// used in push.ts / push-batch.ts (no firebase-admin type import there
// either — keeping this consistent rather than introducing a new
// dependency on typings that may not match your installed version).
export interface SendResult {
  success: boolean;
  error?: { code?: string };
}

/**
 * Sends one payload to `tokens` via sendEachForMulticast, retrying only the
 * subset of tokens that failed with a retryable (transient) error code —
 * up to MAX_ATTEMPTS total rounds, with exponential backoff between them.
 *
 * Returns one result per token, in the same order as the input `tokens`
 * array — the same shape callers already get back from a single
 * sendEachForMulticast call, so existing `isUnregistered`-based pruning in
 * push.ts and push-batch.ts needs no changes.
 */
export async function sendWithRetry(
  tokens: string[],
  payload: RetryPushPayload
): Promise<SendResult[]> {
  const results: SendResult[] = new Array(tokens.length);
  let pending = tokens.map((token, index) => ({ token, index }));
  let attempt = 0;

  while (pending.length > 0 && attempt < MAX_ATTEMPTS) {
    if (attempt > 0) {
      await sleep(delayForAttempt(attempt - 1));
    }

    const response = await firebaseAdmin.messaging().sendEachForMulticast({
      tokens: pending.map((p) => p.token),
      notification: { title: payload.title, body: payload.body },
      data: payload.url ? { url: payload.url } : undefined,
      webpush: payload.url ? { fcmOptions: { link: payload.url } } : undefined,
    });

    const stillPending: typeof pending = [];
    response.responses.forEach((result, i) => {
      const { index } = pending[i];
      results[index] = result;

      // Retry only transient failures. isUnregistered failures (and any
      // other non-retryable error) are final on this attempt and fall
      // through to the caller's own pruning/failure counting untouched.
      if (!result.success && !isUnregistered(result.error?.code) && isRetryable(result.error?.code)) {
        stillPending.push(pending[i]);
      }
    });

    pending = stillPending;
    attempt += 1;
  }

  return results;
}
