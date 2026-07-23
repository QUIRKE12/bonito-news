"use client";

import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { canAccess } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import { ShieldAlert } from "lucide-react";

/**
 * Gates a single admin page behind a role check, on top of the coarse
 * "are you staff at all" check AdminLayout already does. Hiding the nav
 * link isn't enough on its own — someone can still type the URL — so any
 * page that isn't Admin-only-by-default should wrap its content in this.
 *
 * Admin always passes, automatically, via canAccess().
 */
export default function RequireRole({
  roles,
  children,
}: {
  /** Non-Admin roles allowed to view this page. Empty = Admin only. */
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuthUser();

  if (loading) {
    return <p className="p-5 text-sm text-gray-500">Loading…</p>;
  }

  if (!canAccess(profile?.role, roles)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <ShieldAlert size={28} className="mb-3 text-gray-500" />
        <h2 className="text-sm font-bold text-adminNavy">Not authorized</h2>
        <p className="mt-1.5 max-w-sm text-sm text-gray-500">
          Your role (<strong>{profile?.role}</strong>) doesn&apos;t have access to this page. Ask an Admin if you
          need it.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
