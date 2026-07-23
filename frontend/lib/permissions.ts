/**
 * Single source of truth for "which staff role can see/do what" in the
 * admin dashboard. Mirrors the requireRole(...) calls already enforced by
 * the backend (see backend/src/routes/*.ts) so the UI never offers a link
 * the API would reject, and never hides one the API would allow.
 *
 * Admin is intentionally never listed in `roles` below — canAccess() and
 * getVisibleNavItems() always grant Admin every permission automatically,
 * so a new admin-only page just needs `roles: []` and nothing else.
 */
import type { UserRole } from "@/lib/types";
import type { LangKey } from "@/lib/i18n/translations";

export interface AdminNavItem {
  href: string;
  key: LangKey;
  /** Non-Admin roles allowed here. Leave empty for Admin-only pages. */
  roles: UserRole[];
}

/**
 * Every role that may sign in to /admin at all. Subscriber is excluded —
 * that role has no dashboard use. Moderator is included: moderators only
 * see comment moderation, but they do belong in the dashboard.
 */
export const STAFF_ROLES: UserRole[] = ["Admin", "Editor", "Author", "Moderator"];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/articles", key: "adminArticles", roles: ["Editor", "Author"] },
  { href: "/admin/media", key: "adminMedia", roles: ["Editor", "Author"] },
  { href: "/admin/moderation", key: "adminModeration", roles: ["Editor", "Moderator"] },
  { href: "/admin/categories", key: "adminCategories", roles: ["Editor"] },
  { href: "/admin/ads", key: "adminAds", roles: ["Editor"] },
  { href: "/admin/newsletter", key: "adminNewsletter", roles: ["Editor"] },
  { href: "/admin/notifications", key: "adminNotifications", roles: ["Editor"] },
  { href: "/admin/analytics", key: "adminAnalytics", roles: [] },
  { href: "/admin/audit-log", key: "adminAuditLog", roles: [] },
  { href: "/admin/settings", key: "adminSettings", roles: [] },
  { href: "/admin/users", key: "adminUsersRoles", roles: [] },
];

/** Admin always passes, no matter what `roles` says. */
export function canAccess(role: UserRole | undefined | null, roles: UserRole[]): boolean {
  if (!role) return false;
  if (role === "Admin") return true;
  return roles.includes(role);
}

/** Nav items a given role should see — Admin gets the full list for free. */
export function getVisibleNavItems(role: UserRole | undefined | null): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => canAccess(role, item.roles));
}
