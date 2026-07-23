import { Schema, model, models, type Document, type Model } from "mongoose";

export interface INewsletterSubscriber extends Document {
  email: string;
  name?: string;
  active: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
}

const NewsletterSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    active: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date },
  },
  { timestamps: false }
);

export const NewsletterSubscriber: Model<INewsletterSubscriber> =
  models.NewsletterSubscriber ||
  model<INewsletterSubscriber>("NewsletterSubscriber", NewsletterSchema);
