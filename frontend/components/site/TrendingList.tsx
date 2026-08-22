import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

/**
 * Igihe-style left column: a stacked vertical list of stories, each with a
 * small square thumbnail, category label, headline, and view count. Used
 * alongside TrendingGrid to replace the old horizontally-scrolling rows.
 */
export default function TrendingList({ articles }: { articles: ArticleSummary[] }) {
  return (
    <div className="divide-y divide-ink/10">
      {articles.map((a) => (
        <Link key={a._id} href={`/articles/${a.slug}`} className="group flex gap-3 py-3.5 first:pt-0">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-papyrus sm:h-20 sm:w-20">
            {a.coverImage?.secureUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.coverImage.secureUrl}
                alt={a.coverImage.altText || a.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-amber-deep">
              {a.category?.name || "Amakuru"}
            </span>
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink group-hover:text-amber-deep sm:text-[15px]">
              {a.title}
            </h3>
            <span className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth={2}>
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {formatViews(a.views)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
