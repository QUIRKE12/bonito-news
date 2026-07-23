"use client";

import { createContext, useContext } from "react";
import type { LangKey } from "./translations";
import type { SupportedLanguage } from "@/lib/types";

export interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: LangKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
