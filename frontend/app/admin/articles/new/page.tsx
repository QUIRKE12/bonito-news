"use client";

import ArticleForm from "@/components/admin/ArticleForm";
import RequireRole from "@/components/admin/RequireRole";

export default function NewArticlePage() {
  return (
    <RequireRole roles={["Editor", "Author"]}>
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-adminNavy">New article</h1>
      <ArticleForm />
    </div>
    </RequireRole>
  );
}
