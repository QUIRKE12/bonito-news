"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import type { ArticleSummary, CategorySummary } from "@/lib/types";
import SiteChrome from "@/components/site/SiteChrome";
import ArticleCard from "@/components/site/ArticleCard";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const [category, setCategory] = useState<CategorySummary | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const catRes = await fetch(apiUrl(`/api/categories/${params.slug}`));
        if (catRes.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const catData = await catRes.json();
        if (cancelled) return;
        setCategory(catData.category);

        const artRes = await fetch(apiUrl(`/api/articles?category=${catData.category._id}&page=${page}&limit=12`));
        const artData = await artRes.json();
        if (cancelled) return;
        setArticles(artData.articles || []);
        setTotalPages(artData.pagination?.totalPages || 1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (params.slug) load();
    return () => {
      cancelled = true;
    };
  }, [params.slug, page]);

  if (notFound) {
    return (
      <SiteChrome>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Category not found</h1>
          <Link href="/" className="mt-4 inline-block rounded bg-teal px-4 py-2 text-sm font-semibold text-white">
            Back to homepage
          </Link>
        </div>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <div className="mb-7 border-b-[3px] border-ink pb-4">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">Section</span>
          <h1 className="font-display text-[34px] font-semibold text-ink">
            {loading && !category ? "Loading…" : category?.name}
          </h1>
          {category?.description && <p className="mt-1 max-w-[60ch] text-sm text-muted">{category.description}</p>}
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-sm text-muted">Loading articles…</div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center font-mono text-sm text-muted">No articles in this section yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a._id} article={a} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3 font-mono text-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border border-line px-3 py-1.5 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded border border-line px-3 py-1.5 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </SiteChrome>
  );
}
