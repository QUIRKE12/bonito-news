"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SectionHeadProps {
  label: string;
  dotColor?: string;
  seeAllHref?: string;
}

export default function SectionHead({ label, dotColor = "#2F6F5E", seeAllHref }: SectionHeadProps) {
  const { t } = useLanguage();
  return (
    <div className="mb-6 flex items-center justify-between border-b-2 border-ink pb-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <h2 className="font-display text-xl font-semibold capitalize text-ink sm:text-2xl">
          {label}
        </h2>
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="font-mono text-[11px] uppercase tracking-wide text-muted hover:text-amber-deep"
        >
          {t("seeAll")}
        </Link>
      )}
    </div>
  );
}
