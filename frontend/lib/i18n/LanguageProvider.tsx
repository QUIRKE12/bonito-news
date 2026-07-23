"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LanguageContext } from "./LanguageContext";
import { translations, type LangKey } from "./translations";
import type { SupportedLanguage } from "@/lib/types";

const STORAGE_KEY = "amakuru_lang";

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("rn");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && saved in translations) setLanguageState(saved);
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000`;
  };

  const t = (key: LangKey) =>
    translations[language]?.[key] ?? translations.en?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
