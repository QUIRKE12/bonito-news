import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * NOTE: Multi-language (EN/FR/Kirundi) content is deferred for now.
 * `name`/`description` are plain strings today. When translations are
 * added later, the simplest upgrade path is either:
 *   (a) turn `name` into { en, fr, rn } like the original draft, or
 *   (b) keep this collection language-neutral and add a separate
 *       CategoryTranslation collection keyed by category + locale.
 * Either works without touching the rest of the schema.
 */
export interface ICategory extends Document {
  slug: string;
  name: string;
  description?: string;
  colorDot: string; // hex, matches the prototype's category dot color
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    colorDot: { type: String, default: "#1F7A6C" },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  models.Category || model<ICategory>("Category", CategorySchema);
