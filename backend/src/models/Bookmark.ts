import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IBookmark extends Document {
  user: Schema.Types.ObjectId;
  article: Schema.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A user can only bookmark a given article once
BookmarkSchema.index({ user: 1, article: 1 }, { unique: true });

export const Bookmark: Model<IBookmark> =
  models.Bookmark || model<IBookmark>("Bookmark", BookmarkSchema);
