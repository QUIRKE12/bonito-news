"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import RequireRole from "@/components/admin/RequireRole";

interface SiteSettings {
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  contactEmail?: string;
  socialLinks?: { twitter?: string; facebook?: string; instagram?: string };
  adsEnabled?: boolean;
  commentsEnabled?: boolean;
  maintenanceMode?: boolean;
}

export default function SettingsPage() {
  const { authedFetch } = useAuthUser();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authedFetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings ?? {});
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await authedFetch("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <RequireRole roles={[]}>
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-adminNavy">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Site-wide configuration. Admin only.</p>
      </div>

      <form onSubmit={save} className="space-y-5 rounded-[10px] border border-gray-200 bg-white p-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-adminNavy">Site name</label>
          <input
            value={settings.siteName ?? ""}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] text-adminNavy outline-none focus:border-adminOrange"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-adminNavy">Tagline</label>
          <input
            value={settings.tagline ?? ""}
            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] text-adminNavy outline-none focus:border-adminOrange"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-adminNavy">Contact email</label>
          <input
            type="email"
            value={settings.contactEmail ?? ""}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] text-adminNavy outline-none focus:border-adminOrange"
          />
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-4">
          <ToggleRow
            label="Ads enabled"
            checked={!!settings.adsEnabled}
            onChange={(v) => setSettings({ ...settings, adsEnabled: v })}
          />
          <ToggleRow
            label="Comments enabled"
            checked={!!settings.commentsEnabled}
            onChange={(v) => setSettings({ ...settings, commentsEnabled: v })}
          />
          <ToggleRow
            label="Maintenance mode"
            checked={!!settings.maintenanceMode}
            onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-adminOrange px-4 py-2.5 text-sm font-bold text-adminNavy hover:bg-adminOrange-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          {saved && <span className="text-xs font-semibold text-adminOrange-dark">Saved.</span>}
        </div>
      </form>
    </div>
    </RequireRole>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm font-medium text-adminNavy">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-teal"
      />
    </label>
  );
}
