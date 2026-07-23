import { Schema, model, models, type Document, type Model } from "mongoose";

export type AdPlacement = "hero-side" | "in-feed" | "sidebar" | "footer";

export interface IAdvertisement extends Document {
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: AdPlacement;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    targetUrl: { type: String, required: true },
    placement: {
      type: String,
      enum: ["hero-side", "in-feed", "sidebar", "footer"],
      required: true,
    },
    active: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Advertisement: Model<IAdvertisement> =
  models.Advertisement || model<IAdvertisement>("Advertisement", AdvertisementSchema);
