"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import type { ArticleSummary } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import SiteChrome from "@/components/site/SiteChrome";
import BreakingTicker from "@/components/site/BreakingTicker";
import SectionHead from "@/components/site/SectionHead";
import ArticleCard from "@/components/site/ArticleCard";
import NewsletterBox from "@/components/site/NewsletterBox";

/**
 * The public homepage. This used to be a stray copy of the admin
 * dashboard (app/admin/page.tsx) — that content already lives correctly
 * under /admin; this file now renders what a reader actually sees at "/":
 * a hero story, a breaking-news ticker, and a grid of the latest published
 * articles, using the same SiteChrome/ArticleCard components the category
 * and article pages already use.
 */
export default function HomePage() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/articles?limit=24"));
        const data = await res.json();
        if (!cancelled) setArticles(data.articles || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const breaking = articles.filter((a) => a.isBreaking);
  const featured = articles.find((a) => a.isFeatured) || articles[0];
  const rest = articles.filter((a) => a._id !== featured?._id).slice(0, 12);

  return (
    <SiteChrome>
      <BreakingTicker articles={breaking} />

      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
        {loading ? (
          <div className="py-24 text-center font-mono text-sm text-muted">Loading…</div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-mono text-sm text-muted">No published articles yet.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/articles/${featured.slug}`} className="group mb-12 block">
                <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-papyrus">
                    {featured.coverImage?.secureUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.coverImage.secureUrl}
                        alt={featured.coverImage.altText || featured.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <div>
                    <span className="mb-2 block font-mono text-[11px] uppercase tracking-wide text-amber-deep">
                      {featured.category?.name || "Amakuru"}
                    </span>
                    <h1 className="mb-3 font-display text-3xl font-semibold leading-tight text-ink group-hover:text-amber-deep sm:text-4xl">
                      {featured.title}
                    </h1>
                    <p className="text-[15px] leading-relaxed text-muted">{featured.dek}</p>
                  </div>
                </div>
              </Link>
            )}

            <SectionHead label={t("home")} />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <ArticleCard key={a._id} article={a} />
              ))}
            </div>
          </>
        )}
      </div>

      <NewsletterBox />
    </SiteChrome>
  );
}
