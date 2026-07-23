import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";

const CATEGORY_COLOR: Record<string, string> = {
  politics: "text-amber-deep",
  business: "text-teal",
  culture: "text-[#8B5FBF]",
  sport: "text-[#C9302C]",
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diffMs / 3_600_000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default function ArticleCard({ article }: { article: ArticleSummary }) {
  const catSlug = article.category?.slug || "";
  const catColor = CATEGORY_COLOR[catSlug] || "text-teal";

  return (
    <Link href={`/articles/${article.slug}`} className="group block">
      <article>
        <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-sm bg-papyrus">
          {article.coverImage?.secureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage.secureUrl}
              alt={article.coverImage.altText || article.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          )}
        </div>
        <span className={`mb-1.5 block font-mono text-[10px] uppercase tracking-wide ${catColor}`}>
          {article.category?.name || "Amakuru"}
        </span>
        <h3 className="mb-2 text-[16px] font-semibold leading-snug text-ink group-hover:text-amber-deep">
          {article.title}
        </h3>
        <span className="font-mono text-[11px] text-muted">
          {timeAgo(article.publishedAt || article.createdAt)} · {article.readTimeMinutes} min read
        </span>
      </article>
    </Link>
  );
}
