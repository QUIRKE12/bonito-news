import { Schema, model, models, type Document, type Model } from "mongoose";

export type NotificationStatus = "draft" | "scheduled" | "sent" | "failed";

/**
 * Language targeting is deferred (see note in models/Category.ts) —
 * everything sends in English for now. The `languages` field still
 * exists so the admin UI's language chips have somewhere to write to,
 * but the sender (Phase 5) will only actually use "en" until
 * translations are implemented.
 */
export interface INotification extends Document {
  title: string;
  message: string;
  audience: "all" | "category-subscribers" | "breaking-news-only";
  categoryFilter?: Schema.Types.ObjectId; // ref Category, used when audience = "category-subscribers"
  languages: string[]; // e.g. ["en"] for now
  scheduledFor?: Date;
  sentAt?: Date;
  status: NotificationStatus;
  createdBy: Schema.Types.ObjectId; // ref User (Admin/Editor who sent it)
  deliveryStats: {
    estimatedReach: number;
    delivered: number;
    failed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 500 },
    audience: {
      type: String,
      enum: ["all", "category-subscribers", "breaking-news-only"],
      default: "all",
    },
    categoryFilter: { type: Schema.Types.ObjectId, ref: "Category" },
    languages: { type: [String], default: ["en"] },
    scheduledFor: { type: Date },
    sentAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deliveryStats: {
      estimatedReach: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> =
  models.Notification || model<INotification>("Notification", NotificationSchema);
