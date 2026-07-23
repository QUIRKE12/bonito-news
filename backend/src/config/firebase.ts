import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

/**
 * Server-only Firebase Admin instance. Moved as-is from
 * lib/firebase/admin.ts — nothing here was Next.js-specific.
 */
function createFirebaseAdminApp(): App {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
    throw new Error("Missing Firebase Admin credentials. Check FIREBASE_ADMIN_* env vars.");
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const adminApp: App = getApps().length ? getApps()[0] : createFirebaseAdminApp();

export const adminAuth: Auth = getAuth(adminApp);
export const adminMessaging: Messaging = getMessaging(adminApp);

// push-retry.ts (copied into services/) expects a `firebaseAdmin.messaging()`
// shape — this thin shim keeps that file byte-for-byte unchanged.
export const firebaseAdmin = { messaging: () => adminMessaging };

export async function verifyIdToken(token: string) {
  return adminAuth.verifyIdToken(token);
}
