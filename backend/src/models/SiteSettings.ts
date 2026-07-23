import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * Singleton document — there should only ever be one SiteSettings row.
 * Fetch it with `SiteSettings.findOne({})` and create-if-missing, rather
 * than treating this like a normal collection.
 */
export interface ISiteSettings extends Document {
  siteName: string;
  tagline?: string;
  logoUrl?: string;
  contactEmail?: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  adsEnabled: boolean;
  commentsEnabled: boolean;
  maintenanceMode: boolean;
  updatedBy?: Schema.Types.ObjectId; // ref User
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: { type: String, default: "Amakuru" },
    tagline: { type: String },
    logoUrl: { type: String },
    contactEmail: { type: String },
    socialLinks: {
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String },
    },
    adsEnabled: { type: Boolean, default: true },
    commentsEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  models.SiteSettings || model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
