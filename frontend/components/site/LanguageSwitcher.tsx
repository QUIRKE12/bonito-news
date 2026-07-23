"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { SupportedLanguage } from "@/lib/types";

const LANGUAGES: { code: SupportedLanguage; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "rn", label: "Ikirundi", short: "RN" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(code: SupportedLanguage) {
    setLanguage(code);
    setOpen(false);
    // NOTE: this switches all site chrome text (nav, buttons, tagline) via
    // LanguageProvider's t(). Article content itself is still single-language
    // until the backend's title/dek/body fields grow { en, fr, rn } variants
    // (see the comment in backend/src/models/Article.ts).
  }

  const current = LANGUAGES.find((l) => l.code === language)!;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded border border-ink px-2.5 py-1.5 text-[13px] font-semibold text-ink hover:bg-ink hover:text-white"
      >
        <Globe size={16} strokeWidth={1.75} />
        {current.short}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded border border-line bg-white py-1 shadow-sm">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-papyrus ${
                l.code === language ? "font-semibold text-ink" : "text-charcoal"
              }`}
            >
              {l.label}
              {l.code === language && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
