// NEW — Phase 5
// Must live at the site root (public/firebase-messaging-sw.js), NOT under app/,
// so it's servable at /firebase-messaging-sw.js — FCM requires that exact path.
//
// Uses the compat SDK deliberately: service workers can't use ES module
// imports the way lib/firebase/client.ts does, so this stays self-contained
// with importScripts instead of sharing that module.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// ASSUMPTION: same config values as lib/firebase/client.ts. Service workers
// can't read process.env, so these are hardcoded — Firebase client config is
// not a secret (it's already visible in every page's bundle), but confirm
// these match your actual project before deploying.
firebase.initializeApp({
  apiKey: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  messagingSenderId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "Amakuru", {
    body: body ?? "",
    icon: icon ?? "/icon-192.png",
    data: payload.data ?? {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
