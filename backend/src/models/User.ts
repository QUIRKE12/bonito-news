import { Schema, model, models, type Document, type Model } from "mongoose";

export type UserRole = "Admin" | "Editor" | "Author" | "Moderator" | "Subscriber";
export type SupportedLanguage = "en" | "fr" | "rn";

export interface IUser extends Document {
  firebaseUid: string; // links to Firebase Authentication
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  language: SupportedLanguage;
  notificationPreferences: {
    enabled: boolean;
    categories: string[]; // e.g. ["Politics", "Business"]
    breakingNewsOnly: boolean;
  };
  fcmTokens: string[]; // device tokens for push notifications
  bookmarks: Schema.Types.ObjectId[];
  readingHistory: {
    article: Schema.Types.ObjectId;
    viewedAt: Date;
  }[];
  status: "active" | "invited" | "deactivated";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ["Admin", "Editor", "Author", "Moderator", "Subscriber"],
      default: "Subscriber",
      required: true,
    },
    language: {
      type: String,
      enum: ["en", "fr", "rn"],
      default: "en",
    },
    notificationPreferences: {
      enabled: { type: Boolean, default: true },
      categories: { type: [String], default: [] },
      breakingNewsOnly: { type: Boolean, default: false },
    },
    fcmTokens: { type: [String], default: [] },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Article" }],
    readingHistory: [
      {
        article: { type: Schema.Types.ObjectId, ref: "Article" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["active", "invited", "deactivated"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Avoid model recompilation errors during Next.js hot reload
export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
