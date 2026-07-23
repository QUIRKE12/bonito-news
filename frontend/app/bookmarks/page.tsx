"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import SiteChrome from "@/components/site/SiteChrome";
import ArticleCard from "@/components/site/ArticleCard";
import type { ArticleSummary } from "@/lib/types";

type Bookmark = {
  _id: string;
  article: ArticleSummary;
};

export default function BookmarksPage() {
  const { profile: user, authedFetch, loading: authLoading } = useAuthUser();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const res = await authedFetch("/api/bookmarks");
      const data = await res.json();
      setBookmarks(data.bookmarks ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, authedFetch]);

  return (
    <SiteChrome>
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <div className="mb-7 border-b-[3px] border-ink pb-4">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">Your library</span>
          <h1 className="font-display text-[34px] font-semibold text-ink">Saved Articles</h1>
        </div>

        {!authLoading && !user && (
          <p className="py-16 text-center font-mono text-sm text-muted">Sign in to see the articles you've saved.</p>
        )}

        {loading && user && <p className="py-16 text-center font-mono text-sm text-muted">Loading…</p>}

        {!loading && user && bookmarks.length === 0 && (
          <p className="py-16 text-center font-mono text-sm text-muted">
            Nothing saved yet. Tap "Save" on any article to find it here later.
          </p>
        )}

        {!loading && bookmarks.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((b) => (
              <ArticleCard key={b._id} article={b.article} />
            ))}
          </div>
        )}
      </div>
    </SiteChrome>
  );
}
