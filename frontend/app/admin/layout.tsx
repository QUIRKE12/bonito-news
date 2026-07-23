"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { STAFF_ROLES, getVisibleNavItems } from "@/lib/permissions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, firebaseUser } = useAuthUser();
  const { t } = useLanguage();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        {t("adminLoading")}
      </div>
    );
  }

  if (!firebaseUser || !profile) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-adminNavy">{t("adminSignInRequiredTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("adminSignInRequiredBody")}</p>
        <Link href="/" className="mt-4 inline-block rounded bg-adminOrange px-4 py-2 text-sm font-semibold text-adminNavy">
          {t("adminGoToHomepage")}
        </Link>
      </div>
    );
  }

  if (!STAFF_ROLES.includes(profile.role)) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-adminNavy">{t("adminNotAuthorizedTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account role (<strong>{profile.role}</strong>) {t("adminNotAuthorizedBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 shrink-0 bg-adminNavy p-4">
        <div className="mb-6 px-2">
          <div className="font-display text-lg font-semibold text-white">
            Amakuru <span className="text-adminOrange">•</span>
          </div>
          <div className="text-xs text-white/50">{t("adminDashboard")}</div>
        </div>
        <nav className="flex flex-col gap-1">
          {/* Admin sees every item here automatically (getVisibleNavItems
              grants Admin all access); other roles only see the pages
              their role is permitted to use, per lib/permissions.ts. */}
          {getVisibleNavItems(profile.role).map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-adminOrange text-adminNavy font-semibold"
                    : "text-white/70 hover:bg-adminNavyLight hover:text-white"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-white/10 px-2 pt-4 text-xs text-white/50">
          {t("adminSignedInAs")}
          <div className="mt-1 font-medium text-white">{profile.name}</div>
          <div className="text-adminOrange">{profile.role}</div>
          <button
            onClick={() => signOut(auth)}
            className="mt-3 w-full rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-adminOrange hover:border-adminOrange hover:text-adminNavy"
          >
            {t("adminSignOut")}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
