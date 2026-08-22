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
}

// Push delivery (Firebase Cloud Messaging) was removed — this project no
// longer depends on Firebase for anything. Notifications are in-app only
// (notification bell / feed), backed by the Notification model below.
//
// Creates one Notification document per user. Use this in place of looping
// `dispatchNotification` per user (e.g. "article published, notify all
// subscribers").
export async function dispatchNotificationBatch({
  userIds,
  type,
  title,
  body,
  url,
  meta,
}: DispatchBatchInput): Promise<DispatchBatchResult> {
  if (userIds.length === 0) {
    return { created: 0 };
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

  return { created: inserted.length };
}
