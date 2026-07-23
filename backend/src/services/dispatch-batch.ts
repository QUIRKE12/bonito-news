/**
 * Phase 6 — batch notification dispatch.
 *
 * Batch analog of dispatchNotification in this same file
 * (lib/notifications/dispatch.ts): one Notification.insertMany(...)
 * instead of looping .create(), plus one call to the batch push sender.
 * Same "push failure shouldn't break the DB write" behavior as the
 * single-user version.
 */

import { Notification } from "../models/Notification";
import { sendPushToUsers, type PushPayload } from "./push-batch";

export interface DispatchBatchInput {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  url?: string;
  meta?: Record<string, unknown>;
}

export interface DispatchBatchResult {
  created: number;
  push: { sent: number; failed: number; prunedTokens: number };
}

/**
 * Creates one Notification document per user and sends a single batched
 * push across all of them. Use this in place of looping
 * `dispatchNotification` per user (e.g. "article published, notify all
 * subscribers").
 */
export async function dispatchNotificationBatch({
  userIds,
  type,
  title,
  body,
  url,
  meta,
}: DispatchBatchInput): Promise<DispatchBatchResult> {
  if (userIds.length === 0) {
    return { created: 0, push: { sent: 0, failed: 0, prunedTokens: 0 } };
  }

  const docs = userIds.map((userId) => ({
    user: userId,
    type,
    title,
    body,
    url,
    meta,
    read: false,
  }));

  const inserted = await Notification.insertMany(docs);

  // Push failures shouldn't break the calling request, same as the
  // single-user dispatchNotification.
  let pushResult = { sent: 0, failed: 0, prunedTokens: 0 };
  try {
    const payload: PushPayload = { title, body, url };
    pushResult = await sendPushToUsers(userIds, payload);
  } catch (err) {
    console.error(`[dispatchNotificationBatch] push failed for ${userIds.length} users:`, err);
  }

  return { created: inserted.length, push: pushResult };
}
