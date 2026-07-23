"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import RequireRole from "@/components/admin/RequireRole";
import MediaUploader from "@/components/admin/MediaUploader";
import MediaLibraryGrid, { type MediaItem } from "@/components/admin/MediaLibraryGrid";

export default function MediaLibraryPage() {
  const { authedFetch } = useAuthUser();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const res = await authedFetch("/api/media");
    if (res.ok) {
      const data = await res.json();
      setItems(data.media);
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <RequireRole roles={["Editor", "Author"]}>
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-adminNavy">Media Library</h1>
          <p className="text-sm text-gray-500">Images and video used across articles.</p>
        </div>
        <MediaUploader onUploaded={refetch} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <MediaLibraryGrid items={items} onChanged={refetch} mode="manage" />
      )}
    </div>
    </RequireRole>
  );
}
