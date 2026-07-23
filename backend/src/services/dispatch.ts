// NEW — Phase 5
// Central place to trigger a notification. Call this instead of writing
// directly to the Notification model, so every notification consistently
// gets both the in-app record (for the notification bell / feed) and the
// real push send that was missing before Phase 5.
//
// Example call sites to wire this into (in your existing route handlers):
//   - api/articles/[id]/comments/route.ts (POST): when a reply is posted,
//     dispatch to the parent comment's author.
//   - api/comments/[id]/route.ts (PATCH): when a comment is approved/rejected,
//     dispatch to the comment's author.
//   - api/newsletter/route.ts or a publish action: dispatch to subscribers
//     when a new article goes live (batch — see sendPushToUser's multicast
//     usage as a starting point if you want a sendPushToUsers() variant).

import { Notification } from "../models/Notification";
import { sendPushToUser } from "./push";

type DispatchArgs = {
  userId: string; // recipient
  type: string; // e.g. "comment_reply" | "comment_approved" | "comment_rejected"
  title: string;
  body: string;
  url?: string;
  meta?: Record<string, unknown>;
};

export async function dispatchNotification({ userId, type, title, body, url, meta }: DispatchArgs) {
  await Notification.create({
    user: userId,
    type,
    title,
    body,
    url,
    meta,
    read: false,
  });

  // Push failures shouldn't break the calling request (e.g. don't fail a
  // comment-approval PATCH just because a push send hiccuped).
  try {
    await sendPushToUser(userId, { title, body, url });
  } catch (err) {
    console.error(`[dispatchNotification] push failed for user ${userId}:`, err);
  }
}
