/**
 * The backend used to be Next.js API routes living at the same origin
 * (so `fetch("/api/...")` just worked). Now that the API is a separate
 * Express server, every one of those relative paths needs to resolve
 * against the backend's URL instead — this helper is the one place that
 * knows where the backend lives.
 *
 * Set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:4000 in
 * dev, your deployed API's URL in production).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path; // already absolute (e.g. a Cloudinary upload URL) — leave it alone
  return `${API_BASE_URL}${path}`;
}
