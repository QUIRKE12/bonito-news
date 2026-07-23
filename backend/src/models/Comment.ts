import { Schema, model, models, type Document, type Model } from "mongoose";

export type CommentStatus = "pending" | "approved" | "hidden" | "deleted";

export interface IComment extends Document {
  article: Schema.Types.ObjectId; // ref Article
  author: Schema.Types.ObjectId; // ref User
  parentComment?: Schema.Types.ObjectId; // ref Comment, for threaded replies
  content: string;
  status: CommentStatus;
  likes: number;
  moderatedBy?: Schema.Types.ObjectId; // ref User (Moderator/Admin who actioned it)
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    content: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "approved", "hidden", "deleted"],
      default: "approved", // flip to "pending" if you want pre-moderation later
      index: true,
    },
    likes: { type: Number, default: 0 },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
  },
  { timestamps: true }
);

CommentSchema.index({ article: 1, status: 1, createdAt: -1 });

export const Comment: Model<IComment> =
  models.Comment || model<IComment>("Comment", CommentSchema);
