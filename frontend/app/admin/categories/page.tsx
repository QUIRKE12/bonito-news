"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import RequireRole from "@/components/admin/RequireRole";
import { Plus, Trash2 } from "lucide-react";

interface Category {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  colorDot?: string;
}

interface Tag {
  _id: string;
  slug: string;
  name: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CategoriesPage() {
  const { authedFetch } = useAuthUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, tagRes] = await Promise.all([authedFetch("/api/categories"), authedFetch("/api/tags")]);
    if (catRes.ok) setCategories((await catRes.json()).categories ?? []);
    if (tagRes.ok) setTags((await tagRes.json()).tags ?? []);
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setError(null);
    const res = await authedFetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: newCategoryName.trim(), slug: slugify(newCategoryName) }),
    });
    if (res.ok) {
      setNewCategoryName("");
      load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't create category.");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Articles using it will keep the reference until reassigned.")) return;
    await authedFetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setError(null);
    const res = await authedFetch("/api/tags", {
      method: "POST",
      body: JSON.stringify({ name: newTagName.trim(), slug: slugify(newTagName) }),
    });
    if (res.ok) {
      setNewTagName("");
      load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't create tag.");
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag?")) return;
    await authedFetch(`/api/tags/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <RequireRole roles={["Editor"]}>
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-adminNavy">Categories &amp; Tags</h1>
        <p className="mt-1 text-sm text-gray-500">Organize articles into sections and topic tags.</p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Categories */}
        <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-bold text-adminNavy">Categories</h2>
          </div>
          <form onSubmit={addCategory} className="flex gap-2 border-b border-gray-200 p-4">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Politics"
              className="flex-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-adminNavy outline-none focus:border-adminOrange"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-adminOrange px-3 py-2 text-sm font-bold text-adminNavy hover:bg-adminOrange-dark"
            >
              <Plus size={14} /> Add
            </button>
          </form>
          {loading ? (
            <p className="p-5 text-sm text-gray-500">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No categories yet.</p>
          ) : (
            <div>
              {categories.map((c) => (
                <div key={c._id} className="flex items-center justify-between border-b border-gray-200 px-5 py-3 last:border-b-0">
                  <div>
                    <div className="text-sm font-semibold text-adminNavy">{c.name}</div>
                    <div className="font-mono text-xs text-gray-500">/{c.slug}</div>
                  </div>
                  <button onClick={() => deleteCategory(c._id)} className="text-gray-500 hover:text-red-600" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-bold text-adminNavy">Tags</h2>
          </div>
          <form onSubmit={addTag} className="flex gap-2 border-b border-gray-200 p-4">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. elections-2026"
              className="flex-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-adminNavy outline-none focus:border-adminOrange"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-adminOrange px-3 py-2 text-sm font-bold text-adminNavy hover:bg-adminOrange-dark"
            >
              <Plus size={14} /> Add
            </button>
          </form>
          {loading ? (
            <p className="p-5 text-sm text-gray-500">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 p-4">
              {tags.map((tg) => (
                <span
                  key={tg._id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-adminNavy"
                >
                  {tg.name}
                  <button onClick={() => deleteTag(tg._id)} className="text-gray-500 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </RequireRole>
  );
}
