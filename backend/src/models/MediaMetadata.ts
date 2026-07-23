import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IMediaMetadata extends Document {
  publicId: string; // Cloudinary public_id
  url: string;
  secureUrl: string;
  type: "image" | "video";
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  altText?: string;
  uploadedBy: Schema.Types.ObjectId; // ref User
  createdAt: Date;
  updatedAt: Date;
}

const MediaMetadataSchema = new Schema<IMediaMetadata>(
  {
    publicId: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    format: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number, required: true },
    altText: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const MediaMetadata: Model<IMediaMetadata> =
  models.MediaMetadata || model<IMediaMetadata>("MediaMetadata", MediaMetadataSchema);
