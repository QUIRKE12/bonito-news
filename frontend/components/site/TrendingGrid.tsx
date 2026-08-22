import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diffMs / 3_600_000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

/**
 * Igihe-style right column / category block: a 3-across grid of tiles,
 * each an image, headline, and timestamp. Used alongside TrendingList on
 * the homepage's "Latest" section, and standalone under each category's
 * SectionHead in place of the old horizontally-scrolling rows.
 */
export default function TrendingGrid({ articles }: { articles: ArticleSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
      {articles.map((a) => (
        <Link key={a._id} href={`/articles/${a.slug}`} className="group block">
          <div className="mb-2.5 aspect-[4/3] w-full overflow-hidden rounded-sm bg-papyrus">
            {a.coverImage?.secureUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.coverImage.secureUrl}
                alt={a.coverImage.altText || a.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            )}
          </div>
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink group-hover:text-amber-deep">
            {a.title}
          </h3>
          <span className="mt-1 block font-mono text-[11px] text-muted">
            {timeAgo(a.publishedAt || a.createdAt)}
          </span>
        </Link>
      ))}
    </div>
  );
}
