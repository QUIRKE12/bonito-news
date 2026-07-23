"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import RequireRole from "@/components/admin/RequireRole";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { AuditLogEntry } from "@/lib/types";

const ACTION_LABELS: Record<string, string> = {
  "article.create": "Created article",
  "article.update": "Updated article",
  "article.publish": "Published article",
  "article.delete": "Deleted article",
  "comment.moderate": "Moderated comment",
  "comment.delete": "Deleted comment",
  "user.role_change": "Changed user role",
  "user.status_change": "Changed user status",
};

export default function AuditLogPage() {
  const { authedFetch } = useAuthUser();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/audit-log?page=${page}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
        setPageCount(data.pageCount ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [authedFetch, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <RequireRole roles={[]}>
      <div>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-adminNavy">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-500">A record of who changed what, and when.</p>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading…</p>}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <ScrollText size={28} className="mb-3 text-gray-500" />
            <h2 className="text-sm font-bold text-adminNavy">Nothing recorded yet</h2>
            <p className="mt-1.5 max-w-sm text-sm text-gray-500">
              Actions like publishing an article, moderating a comment, or changing a user&apos;s role will
              show up here as staff perform them.
            </p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <>
            <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Actor</th>
                    <th className="px-4 py-2.5 font-medium">Action</th>
                    <th className="px-4 py-2.5 font-medium">Target</th>
                    <th className="px-4 py-2.5 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((e) => (
                    <tr key={e._id}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-adminNavy">{e.actor?.name ?? "Unknown"}</div>
                        <div className="text-xs text-gray-500">{e.actor?.email}</div>
                      </td>
                      <td className="px-4 py-2.5">{ACTION_LABELS[e.action] ?? e.action}</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {e.targetType}
                        {e.meta && typeof e.meta.slug === "string" ? ` · ${e.meta.slug}` : ""}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-gray-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-gray-500">
                  Page {page} of {pageCount}
                </span>
                <button
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </RequireRole>
  );
}
