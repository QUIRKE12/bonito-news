"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NewsletterBox() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(apiUrl("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col justify-center bg-ink px-6 py-9 text-[#EDE9DD] sm:px-8">
      <h2 className="mb-2.5 font-display text-2xl font-semibold text-white">{t("newsletterHeading")}</h2>
      <p className="mb-5 text-sm leading-relaxed text-[#B9B4A2]">{t("newsletterSub")}</p>
      {status === "done" ? (
        <p className="font-mono text-sm text-amber">{t("newsletterSubscribed")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex border border-[#414D75]">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            aria-label="Email address"
            className="flex-1 bg-transparent px-3.5 py-3 text-sm text-white placeholder:text-[#7A7EA0] focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-amber px-5 text-[13px] font-bold text-white hover:bg-amber-deep disabled:opacity-60"
          >
            {status === "sending" ? t("newsletterSubscribing") : t("newsletterSubscribe")}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2 font-mono text-xs text-red-300">{t("newsletterError")}</p>
      )}
      <span className="mt-4 font-mono text-[11px] text-[#7A7EA0]">{t("newsletterFootnote")}</span>
    </div>
  );
}
