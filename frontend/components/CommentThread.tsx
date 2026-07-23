// NEW — Phase 4
// Drop this into the public article page: <CommentThread articleId={article._id} />
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { apiUrl } from "@/lib/api";
import CommentItem, { CommentNode } from "./CommentItem";

function buildTree(flat: Omit<CommentNode, "replies">[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  flat.forEach((c) => byId.set(c._id, { ...c, replies: [] }));

  const roots: CommentNode[] = [];
  flat.forEach((c: any) => {
    const node = byId.get(c._id)!;
    if (c.parentComment && byId.has(c.parentComment)) {
      byId.get(c.parentComment)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function CommentThread({ articleId }: { articleId: string }) {
  const { profile: user, authedFetch } = useAuthUser();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/articles/${articleId}/comments`));
      const data = await res.json();
      setComments(buildTree(data.comments ?? data));
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await authedFetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment("");
      await load();
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">
        Comments {comments.length > 0 && <span className="text-slate-400">({comments.length})</span>}
      </h2>

      {user ? (
        <div className="mt-3 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Join the discussion…"
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={submit}
            disabled={posting || !newComment.trim()}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Post
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Sign in to join the discussion.</p>
      )}

      <div className="mt-4 divide-y divide-slate-100">
        {loading && <p className="text-sm text-slate-400">Loading comments…</p>}
        {!loading && comments.length === 0 && (
          <p className="py-4 text-sm text-slate-400">No comments yet — be the first to say something.</p>
        )}
        {comments.map((c) => (
          <CommentItem key={c._id} comment={c} articleId={articleId} onChanged={load} />
        ))}
      </div>
    </section>
  );
}
