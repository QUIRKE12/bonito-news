"use client";

import ArticleForm from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">New article</h1>
      <ArticleForm />
    </div>
  );
}
