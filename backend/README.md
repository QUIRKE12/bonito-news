# amakuru-backend

Standalone Express/TypeScript API, split out of the Next.js app's `app/api/*`
routes. Same MongoDB, same Firebase project, same Cloudinary account — just
running as its own process instead of Next.js API routes.

## Setup

```bash
npm install
cp .env.example .env   # fill in MongoDB URI, Firebase Admin creds, Cloudinary keys
npm run dev             # starts on :4000 (or $PORT), watches for changes
```

`npm run build && npm start` for a production build.

## Structure

```
src/
  server.ts           Express app, mounts all routers, connects DB, listens
  config/
    db.ts             connectToDatabase() — mongoose connection
    firebase.ts        Firebase Admin init, verifyIdToken()
    cloudinary.ts      signed-upload helper (unchanged from the Next.js lib)
  middleware/
    auth.ts            authenticate / optionalAuthenticate / requireRole(...roles)
  models/               all 12 Mongoose models, unchanged
  routes/               one file per resource — see below
  services/
    push.ts, push-batch.ts, push-retry.ts     FCM sends (unchanged logic)
    dispatch.ts, dispatch-batch.ts             in-app notification + push
```

## Route map

Every route keeps the same path, method, and auth rules it had as a Next.js
route handler — this is a lift-and-shift, not a redesign.

| Path | File |
|---|---|
| `/api/ads`, `/api/ads/:id`, `/api/ads/:id/track` | `routes/ads.ts` |
| `/api/articles`, `/api/articles/:id` | `routes/articles.ts` |
| `/api/auth/sync` | `routes/auth.ts` |
| `/api/bookmarks` | `routes/bookmarks.ts` |
| `/api/categories`, `/api/categories/:id` | `routes/categories.ts` |
| `/api/articles/:id/comments`, `/api/comments`, `/api/comments/:id` | `routes/comments.ts` |
| `/api/media`, `/api/media/:id`, `/api/media/sign` | `routes/media.ts` |
| `/api/newsletter` | `routes/newsletter.ts` |
| `/api/notifications`, `/api/notifications/register-token` | `routes/notifications.ts` |
| `/api/settings` | `routes/settings.ts` |
| `/api/tags`, `/api/tags/:id` | `routes/tags.ts` |

## What changed in the conversion (besides Next.js → Express plumbing)

- **`comments.ts` moderation queue** and **`notifications.ts` register-token
  route** were broken in the original Next.js drop — they used default
  imports (`import mongodb from ...`, `import Comment from ...`) that don't
  match this codebase's actual named exports, and called `requireRole` with
  a `{ok, message, status}` return shape that the real `requireRole` never
  had. Neither file would have run as originally written. Both are fixed
  here to use the real `connectToDatabase`/named model exports and the real
  `authenticate`/`requireRole` middleware.
- **Comment moderation model**: the moderation queue now defaults to
  `?status=approved` (not `pending`), matching the fact that `POST
  /api/articles/:id/comments` creates comments as `"approved"` immediately
  — i.e. this is a post-then-moderate flow. See the comment at the top of
  that handler in `routes/comments.ts` if you want to switch to
  pre-moderation instead (create as `"pending"`, filter public reads to
  `approved` only).
- **Notification wiring**: comment replies and moderation actions
  (approve/hide) now call `dispatchNotification` — this existed as a
  service before but was never actually called from any route.
- `POST /api/ads/:id` (create-or-track-event based on presence of `:id`)
  split into `POST /api/ads` (create) and `POST /api/ads/:id/track` (record
  impression/click) — Express doesn't overload a path by whether params are
  present the way the Next.js file-based router implicitly did.

## Auth

Unchanged: clients send `Authorization: Bearer <firebase-id-token>`. No
cookies or sessions involved, so nothing about auth needed to change moving
off Next.js.

## Still open

- The comment pre-moderation vs. post-moderation decision above is worth
  confirming explicitly rather than leaving the default.
- No rate limiting / CSRF / audit logging yet (tracked as a gap since the
  original tech-stack doc).
