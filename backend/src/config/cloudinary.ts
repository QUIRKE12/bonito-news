import crypto from "crypto";

/**
 * Minimal Cloudinary integration using signed direct uploads.
 * We deliberately avoid the `cloudinary` npm SDK — everything here is a
 * thin wrapper around Cloudinary's plain HTTP API, signed with the same
 * SHA-1 signing scheme the SDK uses under the hood. This keeps the
 * dependency footprint small and the signing logic easy to audit.
 *
 * Flow:
 *   1. Client asks our server for a signature (POST /api/media/sign).
 *   2. Client uploads the file directly to Cloudinary using that
 *      signature (server never touches the file bytes).
 *   3. Client registers the resulting asset metadata with our server
 *      (POST /api/media), which is what Phase 2 already implemented.
 */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * Cloudinary's signing algorithm: take every param except `file`,
 * `cloud_name`, `resource_type`, and `api_key`, sort keys alphabetically,
 * join as `key=value` pairs with `&`, append the API secret, then SHA-1.
 */
export function signParams(params: Record<string, string | number>): string {
  const apiSecret = getEnv("CLOUDINARY_API_SECRET");
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

/**
 * Builds everything a client needs to upload directly to Cloudinary:
 * a timestamp + signature scoped to a fixed folder, plus the public
 * config (api key / cloud name / upload URL). Never returns the API
 * secret itself.
 */
export function createUploadSignature(folder = "amakuru"): UploadSignature {
  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = signParams({ folder, timestamp });

  return {
    timestamp,
    signature,
    apiKey,
    cloudName,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}

/**
 * Deletes an asset from Cloudinary by public_id. Used when an admin
 * removes something from the Media Library so we don't orphan files
 * in Cloudinary storage.
 */
export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp });

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary destroy failed (${res.status}): ${text}`);
  }
}
