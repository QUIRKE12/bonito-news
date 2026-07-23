// NEW — Phase 4
// Drop this into the article page or article cards:
// <BookmarkButton articleId={article._id} initialBookmarked={article.isBookmarked} />
"use client";

import { useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

export default function BookmarkButton({
  articleId,
  initialBookmarked = false,
}: {
  articleId: string;
  initialBookmarked?: boolean;
}) {
  const { profile: user, authedFetch } = useAuthUser();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function toggle() {
    setBusy(true);
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    try {
      if (next) {
        await authedFetch("/api/bookmarks", {
          method: "POST",
          body: JSON.stringify({ article: articleId }),
        });
      } else {
        await authedFetch(`/api/bookmarks?article=${articleId}`, { method: "DELETE" });
      }
    } catch {
      setBookmarked(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Save for later"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        bookmarked
          ? "border-amber-400 bg-amber-50 text-amber-700"
          : "border-slate-300 text-slate-600 hover:border-slate-400"
      } disabled:opacity-50`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      </svg>
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}
