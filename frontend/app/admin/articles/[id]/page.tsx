"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import ArticleForm, { type ArticleFormValues } from "@/components/admin/ArticleForm";
import RequireRole from "@/components/admin/RequireRole";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { authedFetch } = useAuthUser();
  const [initial, setInitial] = useState<ArticleFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await authedFetch(`/api/articles/${id}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const a = data.article;
      setInitial({
        _id: a._id,
        slug: a.slug,
        title: a.title,
        dek: a.dek,
        body: a.body,
        category: a.category?._id || a.category,
        tags: (a.tags || []).map((t: any) => t._id || t),
        coverImage: a.coverImage,
        status: a.status,
        scheduledFor: a.scheduledFor,
        isBreaking: a.isBreaking,
        isFeatured: a.isFeatured,
      });
      setLoading(false);
    })();
  }, [authedFetch, id]);

  return (
    <RequireRole roles={["Editor", "Author"]}>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : notFound || !initial ? (
        <p className="text-sm text-red-600">Article not found.</p>
      ) : (
        <div>
          <h1 className="mb-6 font-display text-2xl font-semibold text-adminNavy">Edit article</h1>
          <ArticleForm initial={initial} />
        </div>
      )}
    </RequireRole>
  );
}
