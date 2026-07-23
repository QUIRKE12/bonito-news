"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import RequireRole from "@/components/admin/RequireRole";

interface ArticleRow {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "scheduled" | "published";
  category?: { name: string };
  author?: { name: string };
  publishedAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-amber/20 text-amber-deep",
  published: "bg-adminOrange-soft text-adminOrange-dark",
};

export default function AdminArticlesPage() {
  const { authedFetch } = useAuthUser();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}&limit=50` : "?limit=50";
    const res = await authedFetch(`/api/articles${qs}`);
    if (res.ok) {
      const data = await res.json();
      setArticles(data.articles);
    }
    setLoading(false);
  }, [authedFetch, statusFilter]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    await authedFetch(`/api/articles/${id}`, { method: "DELETE" });
    refetch();
  }

  return (
    <RequireRole roles={["Editor", "Author"]}>
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-adminNavy">Articles</h1>
          <p className="text-sm text-gray-500">Drafts, scheduled, and published content.</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded bg-adminOrange px-4 py-2 text-sm font-semibold text-adminNavy hover:bg-adminOrange-dark"
        >
          + New article
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {["", "draft", "scheduled", "published"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${
              statusFilter === s ? "border-adminOrange bg-adminOrange-soft text-adminOrange-dark" : "border-gray-200 text-gray-500"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-500">No articles yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">Title</th>
              <th>Category</th>
              <th>Author</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a._id} className="border-b border-gray-200">
                <td className="py-2 font-medium text-adminNavy">{a.title}</td>
                <td className="text-gray-500">{a.category?.name || "—"}</td>
                <td className="text-gray-500">{a.author?.name || "—"}</td>
                <td>
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="space-x-3 py-2 text-right">
                  <Link href={`/admin/articles/${a._id}`} className="text-adminOrange-dark hover:underline">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(a._id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </RequireRole>
  );
}
