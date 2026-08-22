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

type DispatchArgs = {
  userId: string; // recipient
  type: string; // e.g. "comment_reply" | "comment_approved" | "comment_rejected"
  title: string;
  body: string;
  url?: string;
  meta?: Record<string, unknown>;
};

// Push delivery (Firebase Cloud Messaging) was removed — this project no
// longer depends on Firebase for anything. Notifications are in-app only
// (notification bell / feed), backed by the Notification model below.
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
}
