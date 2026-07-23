"use client";

import { useRef, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

interface MediaUploaderProps {
  onUploaded: () => void; // parent refetches the media list
}

interface SignatureResponse {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

export default function MediaUploader({ onUploaded }: MediaUploaderProps) {
  const { authedFetch } = useAuthUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        setProgress(`Uploading ${file.name}…`);

        // 1. Get a signed upload target from our server.
        const signRes = await authedFetch("/api/media/sign", { method: "POST" });
        if (!signRes.ok) throw new Error("Could not get an upload signature");
        const sig: SignatureResponse = await signRes.json();

        // 2. Upload the file straight to Cloudinary — our server never
        //    touches the bytes.
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);

        const uploadRes = await fetch(sig.uploadUrl, { method: "POST", body: form });
        if (!uploadRes.ok) throw new Error(`Cloudinary upload failed for ${file.name}`);
        const asset = await uploadRes.json();

        // 3. Register the resulting metadata with our own backend (Phase 2 route).
        const registerRes = await authedFetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: asset.public_id,
            url: asset.url,
            secureUrl: asset.secure_url,
            type: asset.resource_type === "video" ? "video" : "image",
            format: asset.format,
            width: asset.width,
            height: asset.height,
            bytes: asset.bytes,
          }),
        });
        if (!registerRes.ok) throw new Error(`Could not save metadata for ${file.name}`);
      }

      onUploaded();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded bg-adminOrange px-4 py-2 text-sm font-semibold text-adminNavy hover:bg-adminOrange-dark disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload media"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {progress && <span className="text-sm text-gray-500">{progress}</span>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
