"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { apiUrl } from "@/lib/api";
import CoverImagePicker from "@/components/admin/CoverImagePicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { MediaItem } from "@/components/admin/MediaLibraryGrid";

interface Category {
  _id: string;
  name: string;
  slug: string;
}
interface Tag {
  _id: string;
  name: string;
  slug: string;
}

export interface ArticleFormValues {
  _id?: string;
  slug: string;
  title: string;
  dek: string;
  body: string;
  category: string;
  tags: string[];
  coverImage?: string;
  status: "draft" | "scheduled" | "published";
  scheduledFor?: string;
  isBreaking: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

const EMPTY_FORM: ArticleFormValues = {
  slug: "",
  title: "",
  dek: "",
  body: "",
  category: "",
  tags: [],
  coverImage: undefined,
  status: "draft",
  isBreaking: false,
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ArticleFormProps {
  initial?: ArticleFormValues;
}

export default function ArticleForm({ initial }: ArticleFormProps) {
  const router = useRouter();
  const { authedFetch, profile } = useAuthUser();
  const [values, setValues] = useState<ArticleFormValues>(initial || EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [coverPreview, setCoverPreview] = useState<MediaItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!values._id;
  const isStaff = profile ? ["Admin", "Editor"].includes(profile.role) : false;

  useEffect(() => {
    fetch(apiUrl("/api/categories"))
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
    fetch(apiUrl("/api/tags"))
      .then((r) => r.json())
      .then((d) => setTags(d.tags || []));
  }, []);

  function updateTitle(title: string) {
    setValues((v) => ({
      ...v,
      title,
      slug: slugTouched ? v.slug : slugify(title),
    }));
  }

  function toggleTag(id: string) {
    setValues((v) => ({
      ...v,
      tags: v.tags.includes(id) ? v.tags.filter((t) => t !== id) : [...v.tags, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent, targetStatus?: ArticleFormValues["status"]) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { ...values, status: targetStatus || values.status };

    try {
      const res = await authedFetch(
        isEditing ? `/api/articles/${values._id}` : "/api/articles",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save article");
        return;
      }
      router.push("/admin/articles");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="max-w-3xl space-y-5">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-adminNavy">Title</label>
        <input
          required
          value={values.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-adminNavy">Slug</label>
        <input
          required
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setValues((v) => ({ ...v, slug: e.target.value }));
          }}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm font-mono"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-adminNavy">Dek (short summary)</label>
        <textarea
          required
          rows={2}
          value={values.dek}
          onChange={(e) => setValues((v) => ({ ...v, dek: e.target.value }))}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-adminNavy">Body</label>
        <RichTextEditor
          value={values.body}
          onChange={(html) => setValues((v) => ({ ...v, body: html }))}
          placeholder="Write the article…"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-adminNavy">
            SEO title <span className="text-gray-400">({(values.seoTitle || "").length}/70)</span>
          </label>
          <input
            maxLength={70}
            value={values.seoTitle || ""}
            onChange={(e) => setValues((v) => ({ ...v, seoTitle: e.target.value }))}
            placeholder={values.title || "Falls back to Title"}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-adminNavy">
            SEO description <span className="text-gray-400">({(values.seoDescription || "").length}/160)</span>
          </label>
          <textarea
            rows={2}
            maxLength={160}
            value={values.seoDescription || ""}
            onChange={(e) => setValues((v) => ({ ...v, seoDescription: e.target.value }))}
            placeholder={values.dek || "Falls back to Dek"}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-adminNavy">Category</label>
          <select
            required
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-adminNavy">Cover image</label>
          <div className="flex items-center gap-2">
            {coverPreview ? (
              <img
                src={coverPreview.secureUrl}
                className="h-10 w-16 rounded object-cover"
                alt=""
              />
            ) : values.coverImage ? (
              <span className="text-xs text-gray-500">Cover image set</span>
            ) : (
              <span className="text-xs text-gray-500">None</span>
            )}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
            >
              Choose…
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-adminNavy">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              type="button"
              key={t._id}
              onClick={() => toggleTag(t._id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                values.tags.includes(t._id)
                  ? "border-adminOrange bg-adminOrange-soft text-adminOrange-dark"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isBreaking}
            onChange={(e) => setValues((v) => ({ ...v, isBreaking: e.target.checked }))}
          />
          Breaking news
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => setValues((v) => ({ ...v, isFeatured: e.target.checked }))}
          />
          Featured (homepage hero)
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-gray-200 pt-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-adminNavy">Schedule for</label>
          <input
            type="datetime-local"
            value={values.scheduledFor ? values.scheduledFor.slice(0, 16) : ""}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              }))
            }
            className="rounded border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave blank to save as a draft or publish immediately below.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded border border-adminNavy px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Save draft
        </button>

        {isStaff && (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, "published")}
              className="rounded bg-adminOrange px-4 py-2 text-sm font-semibold text-adminNavy hover:bg-adminOrange-dark disabled:opacity-50"
            >
              Save &amp; publish
            </button>
            <button
              type="button"
              disabled={saving || !values.scheduledFor}
              onClick={(e) => handleSubmit(e, "scheduled")}
              title={!values.scheduledFor ? "Pick a date/time above first" : undefined}
              className="rounded border border-adminOrange px-4 py-2 text-sm font-semibold text-adminOrange-dark disabled:opacity-40"
            >
              Schedule
            </button>
          </>
        )}

        {!isStaff && (
          <span className="text-xs text-gray-500">
            Authors submit as drafts — an Editor or Admin publishes.
          </span>
        )}
      </div>

      <CoverImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          setCoverPreview(item);
          setValues((v) => ({ ...v, coverImage: item._id }));
        }}
      />
    </form>
  );
}
