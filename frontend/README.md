# Amakuru — Phase 1: Foundation

Next.js 15 (App Router) + TypeScript + Tailwind, with Firebase Authentication
wired end-to-end to a MongoDB user profile, matching the "Authentication Flow"
section of the spec exactly:

1. User signs in with Firebase Authentication (client).
2. Firebase returns a secure UID.
3. The app calls `/api/auth/sync` with the Firebase ID token.
4. The server verifies the token with Firebase Admin, then checks MongoDB.
5. If no matching user exists, a new document is created (default role: `Subscriber`).
6. The app-specific profile (role, language, preferences) comes back to the client.

## What's included

| File | Purpose |
|---|---|
| `lib/mongodb.ts` | Cached Mongoose connection (safe for serverless/hot-reload) |
| `lib/firebase/client.ts` | Firebase client SDK — Auth + FCM messaging (lazy-loaded) |
| `lib/firebase/admin.ts` | Firebase Admin SDK — server-side token verification + FCM sending |
| `lib/auth/requireRole.ts` | RBAC middleware for protecting API routes by role |
| `models/User.ts` | Mongoose schema: firebaseUid, role, language, notification prefs, bookmarks, reading history |
| `app/api/auth/sync/route.ts` | The auth-sync endpoint described above |
| `components/AuthModal.tsx` | Real sign-in/sign-up modal (email+password and Google), replacing the prototype's fake JS toggle |
| `app/page.tsx` | Minimal page proving the whole flow works |

## Setup

```bash
npm install
cp .env.example .env.local
# then fill in .env.local with real values:
#   - MongoDB Atlas connection string
#   - Firebase project config (client keys, from Firebase Console > Project Settings)
#   - Firebase Admin service account (Project Settings > Service Accounts > Generate key)
npm run dev
```

Open http://localhost:3000 and click **Sign in** — it will open the modal,
create a Firebase user, and sync a matching MongoDB `User` document.

## Firebase Console setup you'll need to do manually

1. Create a Firebase project.
2. Enable **Authentication** → Email/Password and Google providers.
3. Generate a service account key (for `FIREBASE_ADMIN_*` env vars).
4. (Phase 5) Enable **Cloud Messaging** and generate a VAPID key for push notifications.
5. (Phase 6) Enable **App Check** for production.

## Using the RBAC helper in future routes

```ts
import { requireRole } from "@/lib/auth/requireRole";

export async function POST(req: NextRequest) {
  const result = await requireRole(req, ["Admin", "Editor"]);
  if ("error" in result) return result.error;

  const { user } = result; // typed IUser, role already checked
  // ...proceed
}
```//
Client calls this the same way every time: attach the Firebase ID token as
`Authorization: Bearer <token>` on the request.

## Phase 2 — Data layer & CRUD (added)

All 11 MongoDB collections from the spec now exist as Mongoose models,
each with API routes enforcing the right role checks via `requireRole`.

> **Language note:** multi-language (EN/FR/Kirundi) content is deferred.
> `Article`, `Category`, and `Tag` use plain English strings for now. See
> the comment at the top of `models/Category.ts` for the upgrade path
> when translations are added later.

| Model | Routes | Notes |
|---|---|---|
| `Category` | `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id` | Admin/Editor manage; public read |
| `Tag` | `GET/POST /api/tags`, `DELETE /api/tags/:id` | Author+ can create; Editor+ can delete |
| `Article` | `GET/POST /api/articles`, `GET/PATCH/DELETE /api/articles/:id` | Draft → scheduled → published workflow; Authors can't self-publish or delete; public only sees `published` |
| `Comment` | `GET/POST /api/articles/:id/comments`, `PATCH/DELETE /api/comments/:id` | Threaded via `parentComment`; moderation (`approved/hidden/deleted`) restricted to Moderator+ |
| `Bookmark` | `GET/POST/DELETE /api/bookmarks` | Dedicated collection, unique per user+article |
| `Advertisement` | `GET/POST /api/ads`, `PATCH/DELETE /api/ads/:id`, `POST /api/ads/:id` (impression/click tracking) | Public GET returns only active, in-date-range ads |
| `NewsletterSubscriber` | `POST/GET/DELETE /api/newsletter` | Public subscribe/unsubscribe; Admin/Editor see the list |
| `Notification` | `GET/POST /api/notifications` | Persists the record + estimated reach; **actual FCM sending is still Phase 5** |
| `SiteSettings` | `GET/PATCH /api/settings` | Singleton doc, auto-created on first read |
| `MediaMetadata` | `GET/POST /api/media` | Metadata-only for now; **real Cloudinary upload is Phase 3** |
| `AnalyticsMetadata` | *(no routes yet)* | Lightweight event log; wired up in Phase 6 alongside the analytics dashboard |

### Permission summary

- **Public**: read published articles, approved comments, active ads, site settings, subscribe to newsletter.
- **Subscriber**: + comment, bookmark.
- **Author**: + create/edit own draft articles, create tags.
- **Moderator**: + moderate comments.
- **Editor**: + publish/edit/delete any article, manage categories/ads/notifications/media.
- **Admin**: + manage users/roles, site settings, delete categories/ads.

## Phase 3 — Cloudinary upload + Article/Media Library admin UI (added)

Real file uploads now work end-to-end, and there's a working `/admin`
dashboard for managing articles and media — no more Postman-only CRUD.

**Upload flow** (signed, direct-to-Cloudinary — the server never touches
file bytes):
1. Client asks `POST /api/media/sign` for a short-lived signature.
2. Client uploads the file straight to Cloudinary using that signature.
3. Client registers the returned asset with `POST /api/media` (Phase 2 route, unchanged).

| File | Purpose |
|---|---|
| `lib/cloudinary.ts` | Raw SHA-1 signing + asset destroy, no extra SDK dependency |
| `app/api/media/sign/route.ts` | Issues signed upload params (Admin/Editor/Author) |
| `app/api/media/[id]/route.ts` | `PATCH` (alt text), `DELETE` (Cloudinary destroy + Mongo delete) |
| `lib/hooks/useAuthUser.ts` | Client hook: Firebase auth state + synced profile + `authedFetch()` helper |
| `app/admin/layout.tsx` | Sidebar shell, gated to Admin/Editor/Author |
| `app/admin/media/page.tsx` | Media Library — upload + grid, edit alt text, delete |
| `app/admin/articles/page.tsx` | Article list with status filter, delete |
| `app/admin/articles/new/page.tsx`, `app/admin/articles/[id]/page.tsx` | Create/edit, sharing `components/admin/ArticleForm.tsx` |
| `components/admin/MediaUploader.tsx` | Sign → upload → register, in one click |
| `components/admin/MediaLibraryGrid.tsx` | Reused as both the full library and a "picker" (see below) |
| `components/admin/CoverImagePicker.tsx` | Modal wrapping the grid in picker mode, used by `ArticleForm` |

**Role behavior in the UI:** Authors only see "Save draft" (server already
enforces this — see Phase 2's `Article` routes); Editor/Admin also get
"Save & publish". Only your own uploads can be edited/deleted unless
you're Editor/Admin (mirrors the `Article` ownership pattern).

You'll need real Cloudinary credentials in `.env.local`
(`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` —
already in `.env.example`) for uploads to work.

## Next phases (not in this scaffold yet)

- **Phase 4**: Comment thread UI + moderation queue, Bookmarks UI.
- **Phase 5**: Real FCM push sending (composer already exists in the admin
  prototype and now has a real backing record — needs to call
  `adminMessaging.send()` from `lib/firebase/admin.ts`).
- **Phase 6**: Firebase Analytics events + full analytics dashboard (using `AnalyticsMetadata`).
- **Phase 7**: Firebase App Check, rate limiting, CSRF/XSS headers, audit logs.
