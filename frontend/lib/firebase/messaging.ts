// NEW — Phase 5
"use client";

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { firebaseApp } from "./client"; // ASSUMPTION: lib/firebase/client.ts exports the initialized app

// ASSUMPTION: you'll generate a VAPID key pair in the Firebase console
// (Project Settings → Cloud Messaging → Web Push certificates) and add it as
// NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.example / .env.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushPermissionResult =
  | { status: "granted"; token: string }
  | { status: "denied" | "unsupported" | "error"; token: null; message?: string };

/**
 * Requests notification permission, registers the FCM service worker, and
 * returns a device token to send to the backend. Call this from a user
 * gesture (e.g. a button click) — browsers require that for the permission
 * prompt.
 */
export async function requestPushPermission(): Promise<PushPermissionResult> {
  if (typeof window === "undefined" || !(await isSupported())) {
    return { status: "unsupported", token: null, message: "Push isn't supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: "denied", token: null };
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return { status: "granted", token };
  } catch (err) {
    return { status: "error", token: null, message: (err as Error).message };
  }
}

/**
 * Listens for foreground push messages (the browser tab is open and focused).
 * Background messages are handled by the service worker instead. Call this
 * once, e.g. in a top-level layout effect, after permission has been granted.
 */
export async function onForegroundPush(callback: (title: string, body: string) => void) {
  if (typeof window === "undefined" || !(await isSupported())) return () => {};
  const messaging = getMessaging(firebaseApp);
  return onMessage(messaging, (payload) => {
    callback(payload.notification?.title ?? "Amakuru", payload.notification?.body ?? "");
  });
}
