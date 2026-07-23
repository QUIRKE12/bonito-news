"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import type { ArticleDetail } from "@/lib/types";
import SiteChrome from "@/components/site/SiteChrome";
import BookmarkButton from "@/components/BookmarkButton";
import CommentThread from "@/components/CommentThread";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(apiUrl(`/api/articles/${params.slug}`));
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) setArticle(data.article);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (params.slug) load();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <SiteChrome>
        <div className="flex min-h-[50vh] items-center justify-center font-mono text-sm text-muted">
          Loading article…
        </div>
      </SiteChrome>
    );
  }

  if (notFound || !article) {
    return (
      <SiteChrome>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Article not found</h1>
          <p className="mt-2 text-sm text-muted">It may have been unpublished or moved.</p>
          <Link href="/" className="mt-4 inline-block rounded bg-teal px-4 py-2 text-sm font-semibold text-white">
            Back to homepage
          </Link>
        </div>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {article.category && (
          <Link
            href={`/category/${article.category.slug}`}
            className="mb-3 inline-block font-mono text-xs uppercase tracking-wide text-amber-deep"
          >
            {article.category.name}
          </Link>
        )}

        <h1 className="mb-4 font-display text-[32px] font-semibold leading-tight text-ink sm:text-[42px]">
          {article.title}
        </h1>

        <p className="mb-5 text-lg leading-relaxed text-charcoal">{article.dek}</p>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 font-mono text-xs text-muted">
          <span>
            {article.author?.name && <>By <span className="font-semibold text-ink">{article.author.name}</span> · </>}
            {formatDate(article.publishedAt || article.createdAt)} · {article.readTimeMinutes} min read
          </span>
          <BookmarkButton articleId={article._id} />
        </div>

        {article.coverImage?.secureUrl && (
          <div className="mb-8 aspect-[16/9] w-full overflow-hidden rounded-sm bg-papyrus">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage.secureUrl}
              alt={article.coverImage.altText || article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="max-w-none whitespace-pre-wrap font-serif text-[17px] leading-relaxed text-charcoal">
          {article.body}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <span key={t._id} className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted">
                #{t.name}
              </span>
            ))}
          </div>
        )}

        <CommentThread articleId={article._id} />
      </article>
    </SiteChrome>
  );
}
