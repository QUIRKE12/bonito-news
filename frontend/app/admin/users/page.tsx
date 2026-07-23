"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import RequireRole from "@/components/admin/RequireRole";

type UserRole = "Admin" | "Editor" | "Author" | "Moderator" | "Subscriber";
type UserStatus = "active" | "invited" | "deactivated";

interface StaffUser {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

const ROLES: UserRole[] = ["Admin", "Editor", "Author", "Moderator", "Subscriber"];

export default function UsersPage() {
  const { authedFetch, profile } = useAuthUser();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = profile?.role === "Admin";

  useEffect(() => {
    if (!isAdmin) return;
    authedFetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  async function updateRole(id: string, role: UserRole) {
    setSavingId(id);
    setError(null);
    try {
      const res = await authedFetch(`/api/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update role");
        return;
      }
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: data.user.role } : u)));
    } finally {
      setSavingId(null);
    }
  }

  async function updateStatus(id: string, status: UserStatus) {
    setSavingId(id);
    setError(null);
    try {
      const res = await authedFetch(`/api/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status");
        return;
      }
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: data.user.status } : u)));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <RequireRole roles={[]}>
    <div>
      <h1 className="font-display text-2xl font-semibold text-adminNavy">Users &amp; Roles</h1>
      <p className="mt-1 text-sm text-gray-500">
        Promote a facilitator to Editor or Author once they&apos;ve signed in at least once —
        new accounts start as <strong>Subscriber</strong> until you upgrade them here.
      </p>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      ) : users.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          No one has signed in yet. Ask your facilitator to sign in on the site first — once
          they do, they&apos;ll show up here as a Subscriber, ready to promote.
        </p>
      ) : (
        <table className="mt-6 w-full max-w-3xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-200/60">
                <td className="py-2 pr-4 font-medium text-adminNavy">{u.name}</td>
                <td className="py-2 pr-4 text-gray-500">{u.email}</td>
                <td className="py-2 pr-4">
                  <select
                    value={u.role}
                    disabled={savingId === u._id}
                    onChange={(e) => updateRole(u._id, e.target.value as UserRole)}
                    className="rounded border border-gray-200 px-2 py-1 text-sm disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={u.status}
                    disabled={savingId === u._id}
                    onChange={(e) => updateStatus(u._id, e.target.value as UserStatus)}
                    className="rounded border border-gray-200 px-2 py-1 text-sm disabled:opacity-50"
                  >
                    <option value="active">active</option>
                    <option value="invited">invited</option>
                    <option value="deactivated">deactivated</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </RequireRole>
  );
}
