/**
 * Small, framework-free copies of the type unions the frontend needs from
 * the backend's Mongoose models (models/User.ts etc. now live only in
 * amakuru-backend — the frontend has no business depending on Mongoose).
 * Keep these in sync with the backend's models by hand; they're plain
 * string unions so drift is easy to catch (TS will flag mismatched values
 * anywhere they're used).
 */
export type UserRole = "Admin" | "Editor" | "Author" | "Moderator" | "Subscriber";
export type SupportedLanguage = "en" | "fr" | "rn";

export interface CategorySummary {
  _id: string;
  slug: string;
  name: string;
  colorDot: string;
  description?: string;
}

export interface CoverImage {
  _id: string;
  url: string;
  secureUrl: string;
  altText?: string;
}

export interface ArticleSummary {
  _id: string;
  slug: string;
  title: string;
  dek: string;
  category?: CategorySummary;
  coverImage?: CoverImage;
  author?: { name: string; avatarUrl?: string };
  readTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  isBreaking: boolean;
  isFeatured: boolean;
  views: number;
}

export interface ArticleDetail extends ArticleSummary {
  body: string;
  tags?: { _id: string; name: string; slug: string }[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface AuditLogEntry {
  _id: string;
  actor: { name: string; email: string; avatarUrl?: string };
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}
