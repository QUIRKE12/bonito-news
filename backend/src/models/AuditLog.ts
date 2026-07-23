import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * One row per staff action worth being able to answer "who did this, and
 * when" about later: publishing/deleting an article, moderating a
 * comment, changing a user's role or status, etc. Deliberately generic
 * (action + targetType + targetId + a free-form `meta` bag) rather than
 * one collection per resource, so new actions don't need a schema change —
 * just call recordAuditLog() from services/auditLog.ts with a new
 * `action` string.
 */
export type AuditAction =
  | "article.create"
  | "article.update"
  | "article.publish"
  | "article.delete"
  | "comment.moderate"
  | "comment.delete"
  | "user.role_change"
  | "user.status_change";

export interface IAuditLog extends Document {
  actor: Schema.Types.ObjectId; // ref User — who performed the action
  action: AuditAction;
  targetType: string; // "Article" | "Comment" | "User" ...
  targetId: Schema.Types.ObjectId;
  meta?: Record<string, unknown>; // e.g. { from: "draft", to: "published" }
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Audit-log page reads newest-first; this is the only query pattern it has.
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
