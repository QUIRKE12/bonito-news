"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import RequireRole from "@/components/admin/RequireRole";

interface NotificationRow {
  _id: string;
  title: string;
  message: string;
  audience: string;
  status: "draft" | "scheduled" | "sent" | string;
  createdBy?: { name?: string };
  createdAt: string;
  deliveryStats?: { estimatedReach: number; delivered: number; failed: number };
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-amber/20 text-amber-deep",
  sent: "bg-adminOrange-soft text-adminOrange-dark",
};

export default function NotificationsPage() {
  const { authedFetch } = useAuthUser();
  const [history, setHistory] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "category-subscribers" | "breaking-news-only">("all");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authedFetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setHistory(data.notifications ?? []);
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    const res = await authedFetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ title, message, audience }),
    });
    if (res.ok) {
      setTitle("");
      setMessage("");
      load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't save the notification.");
    }
    setSending(false);
  }

  return (
    <RequireRole roles={["Editor"]}>
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-adminNavy">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">Compose push notifications and review what&apos;s gone out.</p>
      </div>

      <div className="mb-5 overflow-hidden rounded-[10px] border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-bold text-adminNavy">New notification</h2>
        </div>
        <form onSubmit={handleSend} className="grid gap-4 p-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-adminNavy">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Breaking: election commission announcement"
              className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] text-adminNavy outline-none focus:border-adminOrange"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-adminNavy">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as typeof audience)}
              className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] text-adminNavy outline-none focus:border-adminOrange"
            >
              <option value="all">All users</option>
              <option value="category-subscribers">Category subscribers</option>
              <option value="breaking-news-only">Breaking news only</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="h-fit rounded bg-adminOrange px-4 py-2.5 text-sm font-bold text-adminNavy hover:bg-adminOrange-dark disabled:opacity-60"
          >
            {sending ? "Saving…" : "Save & send"}
          </button>
          <div className="md:col-span-3">
            <label className="mb-1.5 block text-xs font-bold text-adminNavy">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Short summary shown in the push notification"
              rows={2}
              className="w-full resize-y rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] text-adminNavy outline-none focus:border-adminOrange"
            />
          </div>
          {error && <p className="text-xs text-red-600 md:col-span-3">{error}</p>}
        </form>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-bold text-adminNavy">History</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-gray-500">Loading…</p>
        ) : history.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No notifications sent yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2.5">Notification</th>
                <th className="px-5 py-2.5">Audience</th>
                <th className="px-5 py-2.5">Reach</th>
                <th className="px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((n) => (
                <tr key={n._id} className="border-t border-gray-200">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-adminNavy">{n.title}</div>
                    <div className="text-xs text-gray-500">
                      {n.message} — {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{n.audience.replace(/-/g, " ")}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {n.deliveryStats?.estimatedReach?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[n.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </RequireRole>
  );
}
