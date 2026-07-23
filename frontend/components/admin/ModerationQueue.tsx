// NEW — Phase 4
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

type QueueComment = {
  _id: string;
  content: string;
  status: "approved" | "hidden" | "deleted";
  createdAt: string;
  author: { name: string; email: string };
  article: { title: string; slug: string };
};

const TABS = ["approved", "hidden", "deleted", "all"] as const;

export default function ModerationQueue() {
  const { authedFetch } = useAuthUser();
  const [tab, setTab] = useState<(typeof TABS)[number]>("approved");
  const [comments, setComments] = useState<QueueComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/comments?status=${tab}`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [tab, authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approved" | "hidden" | "delete") {
    setBusyId(id);
    try {
      if (action === "delete") {
        await authedFetch(`/api/comments/${id}`, { method: "DELETE" });
      } else {
        await authedFetch(`/api/comments/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: action }),
        });
      }
      setComments((prev) => prev.filter((c) => c._id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-adminOrange text-adminNavy" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {loading && <p className="text-sm text-slate-400">Loading queue…</p>}
        {!loading && comments.length === 0 && (
          <p className="py-6 text-sm text-slate-400">Nothing in the {tab} queue.</p>
        )}
        {comments.map((c) => (
          <div key={c._id} className="py-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                <span className="font-medium text-slate-800">{c.author.name}</span> on{" "}
                <span className="text-slate-700">{c.article.title}</span>
              </span>
              <time>{new Date(c.createdAt).toLocaleString()}</time>
            </div>
            <p className="mt-1 text-slate-800">{c.content}</p>
            <div className="mt-2 flex gap-3 text-sm">
              {tab !== "approved" && (
                <button
                  onClick={() => act(c._id, "approved")}
                  disabled={busyId === c._id}
                  className="text-green-700 hover:text-green-900"
                >
                  Approve
                </button>
              )}
              {tab !== "hidden" && (
                <button
                  onClick={() => act(c._id, "hidden")}
                  disabled={busyId === c._id}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Hide
                </button>
              )}
              <button
                onClick={() => act(c._id, "delete")}
                disabled={busyId === c._id}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
