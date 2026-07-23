"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import AuthModal from "@/components/AuthModal";
import LanguageSwitcher from "@/components/site/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { LangKey } from "@/lib/i18n/translations";

const NAV_LINKS: { href: string; key: LangKey }[] = [
  { href: "/", key: "home" },
  { href: "/category/politics", key: "politics" },
  { href: "/category/business", key: "business" },
  { href: "/category/culture", key: "culture" },
  { href: "/category/sport", key: "sport" },
];

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function SiteHeader() {
  const { profile, firebaseUser, loading } = useAuthUser();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isSignedIn = !loading && !!firebaseUser;

  return (
    <>
      <div className="flex items-center justify-between bg-ink px-4 py-1.5 text-[12.5px] text-[#EDE9DD] sm:px-6">
        <span className="font-mono opacity-80">{today}</span>
        <span className="hidden font-mono text-[11px] text-[#B9B4A2] sm:inline">
          {t("tagline")}
        </span>
      </div>

      <header className="relative flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="36" height="36" viewBox="0 0 136 140" aria-hidden="true" className="shrink-0">
            <defs>
              <linearGradient id="amakuru-logo-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E24B4A" />
                <stop offset="20%" stopColor="#EF9F27" />
                <stop offset="40%" stopColor="#639922" />
                <stop offset="60%" stopColor="#1D9E75" />
                <stop offset="80%" stopColor="#378ADD" />
                <stop offset="100%" stopColor="#7F77DD" />
              </linearGradient>
            </defs>
            <rect x="20" y="22" width="96" height="96" rx="48" fill="url(#amakuru-logo-rainbow)" />
            <path d="M 42 96 L 68 40 L 94 96" fill="none" stroke="#F4F1EA" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 52 76 L 84 76" stroke="#F4F1EA" strokeWidth="6" strokeLinecap="round" />
            <circle cx="94" cy="96" r="5.5" fill="#C4632B" />
          </svg>
          <span className="font-display text-[32px] italic font-semibold sm:text-[38px]">Amakuru</span>
        </Link>

        <div className="hidden items-center sm:flex">
          <LanguageSwitcher />
        </div>

        <nav
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute left-0 right-0 top-full z-20 flex-col gap-0 border-t border-line border-b-[3px] border-b-ink bg-white px-4 py-2 sm:static sm:z-auto sm:flex sm:flex-row sm:items-center sm:gap-7 sm:border-0 sm:bg-transparent sm:p-0`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="w-full border-b border-line py-2.5 text-sm font-semibold text-charcoal hover:text-amber-deep sm:w-auto sm:border-0 sm:border-b-2 sm:border-transparent sm:py-0 sm:pb-1 sm:hover:border-amber"
            >
              {t(link.key)}
            </Link>
          ))}

          <div className="w-full border-b border-line py-2.5 sm:hidden">
            <LanguageSwitcher />
          </div>

          {isSignedIn ? (
            <Link
              href="/bookmarks"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center gap-2 rounded-full bg-papyrus py-1.5 pl-1.5 pr-3 text-[13px] font-semibold text-ink sm:mt-0"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal font-display text-[11px] font-semibold text-white">
                {initials(profile?.name || firebaseUser?.displayName)}
              </span>
              {profile?.name || firebaseUser?.displayName || t("account")}
            </Link>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                setAuthOpen(true);
              }}
              className="mt-2 rounded border border-ink px-4 py-2 text-[13px] font-semibold text-ink hover:bg-ink hover:text-white sm:mt-0"
            >
              {t("signIn")}
            </button>
          )}
        </nav>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="rounded border border-ink px-3 py-2 font-mono text-[13px] font-bold text-ink sm:hidden"
        >
          {menuOpen ? t("closeMenu") : t("menu")}
        </button>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={() => setAuthOpen(false)} />
    </>
  );
}
