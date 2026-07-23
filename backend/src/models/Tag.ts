import { Schema, model, models, type Document, type Model } from "mongoose";

// Language support deferred — see note in models/Category.ts
export interface ITag extends Document {
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Tag: Model<ITag> = models.Tag || model<ITag>("Tag", TagSchema);
