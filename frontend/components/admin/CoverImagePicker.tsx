"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import MediaUploader from "@/components/admin/MediaUploader";
import MediaLibraryGrid, { type MediaItem } from "@/components/admin/MediaLibraryGrid";

interface CoverImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}

export default function CoverImagePicker({ open, onClose, onSelect }: CoverImagePickerProps) {
  const { authedFetch } = useAuthUser();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const res = await authedFetch("/api/media");
    if (res.ok) {
      const data = await res.json();
      setItems(data.media.filter((m: MediaItem) => m.type === "image"));
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-adminNavy">Choose a cover image</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-adminNavy">
            Close
          </button>
        </div>

        <div className="mb-4">
          <MediaUploader onUploaded={refetch} />
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <MediaLibraryGrid
            items={items}
            onChanged={refetch}
            mode="pick"
            onPick={(item) => {
              onSelect(item);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}
