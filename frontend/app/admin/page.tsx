"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { Download, Plus, MessagesSquare } from "lucide-react";

interface ArticleRow {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "scheduled" | "published";
  category?: { name: string };
  author?: { name: string };
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-amber/20 text-amber-deep",
  published: "bg-adminOrange-soft text-adminOrange-dark",
};

export default function AdminDashboardPage() {
  const { profile, authedFetch } = useAuthUser();

  const [published, setPublished] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<number | null>(null);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [pendingComments, setPendingComments] = useState<number | null>(null);
  const [recent, setRecent] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "category-subscribers" | "breaking-news-only">("all");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [publishedRes, draftRes, scheduledRes, commentsRes] = await Promise.all([
      authedFetch("/api/articles?status=published&limit=8"),
      authedFetch("/api/articles?status=draft&limit=1"),
      authedFetch("/api/articles?status=scheduled&limit=1"),
      authedFetch("/api/comments?status=pending&limit=1"),
    ]);

    if (publishedRes.ok) {
      const data = await publishedRes.json();
      setPublished(data.pagination?.total ?? 0);
      setRecent(data.articles ?? []);
    }
    if (draftRes.ok) {
      const data = await draftRes.json();
      setDrafts(data.pagination?.total ?? 0);
    }
    if (scheduledRes.ok) {
      const data = await scheduledRes.json();
      setScheduled(data.pagination?.total ?? 0);
    }
    if (commentsRes.ok) {
      const data = await commentsRes.json();
      setPendingComments(data.total ?? 0);
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
    setSendResult(null);
    const res = await authedFetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ title, message, audience }),
    });
    if (res.ok) {
      const data = await res.json();
      const reach = data.notification?.deliveryStats?.estimatedReach ?? 0;
      setSendResult(`Saved — estimated reach ${reach.toLocaleString()} devices.`);
      setTitle("");
      setMessage("");
    } else {
      setSendResult("Couldn't save the notification. Check the fields and try again.");
    }
    setSending(false);
  }

  const now = new Date();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-adminNavy">
            Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}
            {profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s how Amakuru is performing —{" "}
            {now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-adminNavy hover:border-adminOrange hover:text-adminOrange-dark"
          >
            <Download size={14} /> View all articles
          </Link>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded bg-adminOrange px-3.5 py-2 text-sm font-semibold text-adminNavy hover:bg-adminOrange-dark"
          >
            <Plus size={14} /> New article
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Published articles" value={published} dotColor="bg-adminOrange" />
        <KpiCard label="Drafts" value={drafts} dotColor="bg-amber" />
        <KpiCard label="Scheduled" value={scheduled} dotColor="bg-[#175CD3]" />
        <KpiCard
          label="Pending comments"
          value={pendingComments}
          dotColor="bg-[#B42318]"
          href="/admin/moderation"
        />
      </div>

      {/* Recent articles */}
      <div className="mb-5 overflow-hidden rounded-[10px] border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-adminNavy">Recent articles</h2>
            <div className="text-xs text-gray-500">Latest published across all categories</div>
          </div>
          <Link href="/admin/articles" className="text-xs font-semibold text-adminOrange-dark hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-gray-500">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No published articles yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2.5">Article</th>
                <th className="px-5 py-2.5">Category</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => (
                <tr key={a._id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-adminNavy">{a.title}</div>
                    <div className="text-xs text-gray-500">
                      {a.author?.name ?? "Unknown"} · {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{a.category?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/articles/${a._id}`} className="text-xs font-semibold text-adminOrange-dark hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notification composer */}
      <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-bold text-adminNavy">Send notification</h2>
          <div className="text-xs text-gray-500">Push to subscribed devices, in the languages readers chose</div>
        </div>
        <form onSubmit={handleSend} className="grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-4">
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
              <label className="mb-1.5 block text-xs font-bold text-adminNavy">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Short summary shown in the push notification"
                rows={3}
                className="w-full resize-y rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] text-adminNavy outline-none focus:border-adminOrange"
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
              className="inline-flex items-center gap-2 rounded bg-adminOrange px-4 py-2.5 text-sm font-bold text-adminNavy hover:bg-adminOrange-dark disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send notification"}
            </button>
            {sendResult && <p className="text-xs text-gray-500">{sendResult}</p>}
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <MessagesSquare size={13} /> Delivery preview
            </div>
            <div className="text-sm font-bold text-adminNavy">Amakuru</div>
            <p className="mt-1 text-[13px] text-gray-500">
              {message.trim() ? message : "Short summary shown in the push notification…"}
            </p>
            <div className="mt-3 font-mono text-[11px] text-gray-500">now · amakuru.rw</div>
          </div>
        </form>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  dotColor,
  href,
}: {
  label: string;
  value: number | null;
  dotColor: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      </div>
      <div className="font-mono text-[26px] font-extrabold text-adminNavy">{value === null ? "—" : value.toLocaleString()}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
