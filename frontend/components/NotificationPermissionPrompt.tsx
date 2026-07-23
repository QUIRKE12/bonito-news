// NEW — Phase 5
// Drop this in somewhere a signed-in user will see it once — e.g. the site
// layout (rendered conditionally) or a notifications settings section.
"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { requestPushPermission, onForegroundPush } from "@/lib/firebase/messaging";

export default function NotificationPermissionPrompt() {
  const { profile: user, authedFetch } = useAuthUser();
  const [status, setStatus] = useState<"idle" | "asking" | "granted" | "denied" | "unsupported" | "dismissed" | "error">("idle");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      setStatus("granted");
    }
  }, []);

  useEffect(() => {
    if (status !== "granted") return;
    const unsubscribe = onForegroundPush((title, body) => {
      // Minimal in-tab surfacing; swap for a toast component if you have one.
      console.log(`[push] ${title}: ${body}`);
    });
    return () => {
      unsubscribe.then((fn) => fn());
    };
  }, [status]);

  async function enable() {
    setStatus("asking");
    const result = await requestPushPermission();
    if (result.status === "granted") {
      await authedFetch("/api/notifications/register-token", {
        method: "POST",
        body: JSON.stringify({ token: result.token }),
      });
      setStatus("granted");
    } else {
      setStatus(result.status);
    }
  }

  if (!user || status === "granted" || status === "dismissed") return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <span className="text-slate-700">
        {status === "denied"
          ? "Notifications are blocked — enable them in your browser settings to get replies and updates."
          : status === "unsupported"
          ? "Push notifications aren't supported in this browser."
          : "Get notified about replies to your comments and news updates."}
      </span>
      {status !== "denied" && status !== "unsupported" && (
        <button
          onClick={enable}
          disabled={status === "asking"}
          className="shrink-0 rounded bg-slate-900 px-3 py-1.5 text-white disabled:opacity-40"
        >
          {status === "asking" ? "Requesting…" : "Enable"}
        </button>
      )}
      <button onClick={() => setStatus("dismissed")} className="shrink-0 text-slate-400 hover:text-slate-600">
        ✕
      </button>
    </div>
  );
}
