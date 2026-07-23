import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * Lightweight event log for the metrics that live in MongoDB alongside
 * Firebase Analytics (which handles the heavier session/engagement
 * tracking in Phase 6). This collection backs simple admin-dashboard
 * queries like "most-read articles this week" without needing to call
 * out to Firebase for every dashboard render.
 */
export type AnalyticsEventType = "pageview" | "share" | "like";

export interface IAnalyticsMetadata extends Document {
  type: AnalyticsEventType;
  article?: Schema.Types.ObjectId; // ref Article
  user?: Schema.Types.ObjectId; // ref User, optional (anonymous views allowed)
  country?: string;
  device?: "mobile" | "desktop" | "tablet";
  browser?: string;
  referrer?: string;
  occurredAt: Date;
}

const AnalyticsMetadataSchema = new Schema<IAnalyticsMetadata>(
  {
    type: { type: String, enum: ["pageview", "share", "like"], required: true },
    article: { type: Schema.Types.ObjectId, ref: "Article", index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    country: { type: String },
    device: { type: String, enum: ["mobile", "desktop", "tablet"] },
    browser: { type: String },
    referrer: { type: String },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AnalyticsMetadataSchema.index({ article: 1, type: 1, occurredAt: -1 });

export const AnalyticsMetadata: Model<IAnalyticsMetadata> =
  models.AnalyticsMetadata ||
  model<IAnalyticsMetadata>("AnalyticsMetadata", AnalyticsMetadataSchema);
