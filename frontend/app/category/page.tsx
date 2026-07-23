"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
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
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Categories &amp; Tags</h1>
        <p className="mt-1 text-sm text-muted">Organize articles into sections and topic tags.</p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Categories */}
        <div className="overflow-hidden rounded-[10px] border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Categories</h2>
          </div>
          <form onSubmit={addCategory} className="flex gap-2 border-b border-line p-4">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Politics"
              className="flex-1 rounded border border-line bg-papyrus/20 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-teal px-3 py-2 text-sm font-bold text-white hover:bg-brand-dark"
            >
              <Plus size={14} /> Add
            </button>
          </form>
          {loading ? (
            <p className="p-5 text-sm text-muted">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="p-5 text-sm text-muted">No categories yet.</p>
          ) : (
            <div>
              {categories.map((c) => (
                <div key={c._id} className="flex items-center justify-between border-b border-line px-5 py-3 last:border-b-0">
                  <div>
                    <div className="text-sm font-semibold text-ink">{c.name}</div>
                    <div className="font-mono text-xs text-muted">/{c.slug}</div>
                  </div>
                  <button onClick={() => deleteCategory(c._id)} className="text-muted hover:text-red-600" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="overflow-hidden rounded-[10px] border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Tags</h2>
          </div>
          <form onSubmit={addTag} className="flex gap-2 border-b border-line p-4">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. elections-2026"
              className="flex-1 rounded border border-line bg-papyrus/20 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-teal px-3 py-2 text-sm font-bold text-white hover:bg-brand-dark"
            >
              <Plus size={14} /> Add
            </button>
          </form>
          {loading ? (
            <p className="p-5 text-sm text-muted">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="p-5 text-sm text-muted">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 p-4">
              {tags.map((tg) => (
                <span
                  key={tg._id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-papyrus/20 px-3 py-1 text-xs font-semibold text-ink"
                >
                  {tg.name}
                  <button onClick={() => deleteTag(tg._id)} className="text-muted hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
