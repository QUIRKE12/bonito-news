"use client";

import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function BreakingTicker({ articles }: { articles: ArticleSummary[] }) {
  const { t } = useLanguage();
  if (articles.length === 0) return null;
  // Duplicate the list so the marquee loops seamlessly.
  const loop = [...articles, ...articles];

  return (
    <div className="flex items-center overflow-hidden bg-amber">
      <span className="flex-shrink-0 whitespace-nowrap bg-amber-deep px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-white">
        {t("breakingLabel")}
      </span>
      <div className="flex animate-[ticker_32s_linear_infinite] whitespace-nowrap motion-reduce:animate-none">
        {loop.map((a, i) => (
          <Link key={`${a._id}-${i}`} href={`/articles/${a.slug}`} className="py-2.5 pr-10 text-[13px] font-medium text-white">
            {a.title}
          </Link>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
