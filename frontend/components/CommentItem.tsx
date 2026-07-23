// NEW — Phase 4
"use client";

import { useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

export type CommentNode = {
  _id: string;
  content: string;
  status: "approved" | "hidden" | "deleted";
  createdAt: string;
  author: { _id: string; name: string; avatarUrl?: string };
  replies: CommentNode[];
};

type Props = {
  comment: CommentNode;
  articleId: string;
  depth?: number;
  onChanged: () => void;
};

const STATUS_STYLES: Record<CommentNode["status"], string> = {
  approved: "",
  hidden: "border-l-2 border-amber-400 pl-3 opacity-60",
  deleted: "border-l-2 border-slate-300 pl-3 opacity-40",
};

export default function CommentItem({ comment, articleId, depth = 0, onChanged }: Props) {
  const { profile, authedFetch } = useAuthUser();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const canModerate = profile?.role === "Admin" || profile?.role === "Editor" || profile?.role === "Moderator";
  const isOwnComment = profile?.id === comment.author._id;

  async function submitReply() {
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      await authedFetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: replyText.trim(), parentComment: comment._id }),
      });
      setReplyText("");
      setReplying(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(status: CommentNode["status"]) {
    setBusy(true);
    try {
      await authedFetch(`/api/comments/${comment._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this comment? Replies will remain but this text will be removed.")) return;
    setBusy(true);
    try {
      await authedFetch(`/api/comments/${comment._id}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (comment.status === "deleted" && !canModerate) return null;

  return (
    <div className={`py-3 ${STATUS_STYLES[comment.status]}`} style={{ marginLeft: depth * 24 }}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-slate-800">{comment.author.name}</span>
        <span>·</span>
        <time>{new Date(comment.createdAt).toLocaleDateString()}</time>
        {comment.status !== "approved" && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{comment.status}</span>
        )}
      </div>

      <p className="mt-1 text-slate-800">{comment.content}</p>

      <div className="mt-1 flex flex-wrap gap-3 text-sm">
        <button onClick={() => setReplying((v) => !v)} className="text-slate-500 hover:text-slate-800">
          Reply
        </button>
        {(isOwnComment || canModerate) && (
          <button onClick={remove} disabled={busy} className="text-red-600 hover:text-red-800">
            Delete
          </button>
        )}
        {canModerate && comment.status !== "approved" && (
          <button onClick={() => updateStatus("approved")} disabled={busy} className="text-green-700 hover:text-green-900">
            Approve
          </button>
        )}
        {canModerate && comment.status !== "hidden" && (
          <button onClick={() => updateStatus("hidden")} disabled={busy} className="text-slate-500 hover:text-slate-800">
            Hide
          </button>
        )}
      </div>

      {replying && (
        <div className="mt-2 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={submitReply}
            disabled={busy || !replyText.trim()}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Post
          </button>
        </div>
      )}

      {comment.replies.map((reply) => (
        <CommentItem key={reply._id} comment={reply} articleId={articleId} depth={depth + 1} onChanged={onChanged} />
      ))}
    </div>
  );
}
