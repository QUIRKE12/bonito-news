import { Schema, model, models, type Document, type Model } from "mongoose";

export type ArticleStatus = "draft" | "scheduled" | "published";

/**
 * NOTE: Multi-language content is deferred for now. `title`/`dek`/`body`
 * are plain strings (single language) today. When translations are
 * added later, the cleanest upgrade path is turning each of these into
 * an object like { en, fr, rn } — the rest of the schema, indexes, and
 * API routes below don't need to change.
 */
export interface IArticle extends Document {
  slug: string;
  title: string;
  dek: string; // short summary/deck shown under the headline
  body: string; // full article HTML/markdown
  category: Schema.Types.ObjectId; // ref Category
  tags: Schema.Types.ObjectId[]; // ref Tag
  author: Schema.Types.ObjectId; // ref User
  coverImage?: Schema.Types.ObjectId; // ref MediaMetadata
  status: ArticleStatus;
  publishedAt?: Date;
  scheduledFor?: Date;
  readTimeMinutes: number;
  views: number;
  likes: number;
  shareCount: number;
  isBreaking: boolean;
  isFeatured: boolean; // hero slot on homepage
  seoTitle?: string; // falls back to `title` on the frontend when empty
  seoDescription?: string; // falls back to `dek` on the frontend when empty
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    dek: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coverImage: { type: Schema.Types.ObjectId, ref: "MediaMetadata" },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },
    readTimeMinutes: { type: Number, default: 3 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    isBreaking: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 160 },
  },
  { timestamps: true }
);

// Common query patterns: latest published articles per category, homepage feed
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ category: 1, status: 1, publishedAt: -1 });

export const Article: Model<IArticle> =
  models.Article || model<IArticle>("Article", ArticleSchema);
