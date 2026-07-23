"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { LangKey } from "@/lib/i18n/translations";

const SECTIONS: { href: string; key: LangKey }[] = [
  { href: "/category/politics", key: "politics" },
  { href: "/category/business", key: "business" },
  { href: "/category/culture", key: "culture" },
  { href: "/category/sport", key: "sport" },
];

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-papyrus px-4 pb-6 pt-9 sm:px-6">
      <div className="mb-7 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-2.5 font-display text-2xl italic text-ink">Amakuru</div>
          <p className="max-w-[32ch] text-[13px] leading-relaxed text-muted">{t("footerTagline")}</p>
        </div>
        <div>
          <h4 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-ink">{t("footerSections")}</h4>
          <ul className="flex flex-col gap-2">
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="text-[13px] text-charcoal hover:text-amber-deep">
                  {t(s.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-ink">{t("footerCompany")}</h4>
          <ul className="flex flex-col gap-2">
            <li><span className="text-[13px] text-charcoal">{t("footerAbout")}</span></li>
            <li><span className="text-[13px] text-charcoal">{t("footerEthics")}</span></li>
            <li><span className="text-[13px] text-charcoal">{t("footerCareers")}</span></li>
            <li><span className="text-[13px] text-charcoal">{t("footerContact")}</span></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-ink">{t("footerAccount")}</h4>
          <ul className="flex flex-col gap-2">
            <li><Link href="/bookmarks" className="text-[13px] text-charcoal hover:text-amber-deep">{t("bookmarks")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 font-mono text-[11px] text-muted">
        <span>© {new Date().getFullYear()} {t("footerCopyright")}</span>
      </div>
    </footer>
  );
}
