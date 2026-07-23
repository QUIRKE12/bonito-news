import { AuditLog, type AuditAction } from "../models/AuditLog";

interface RecordAuditLogInput {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit write. Deliberately never throws into the caller —
 * a failed audit write shouldn't fail the underlying request (publishing
 * an article shouldn't 500 because the audit collection had a hiccup).
 * Call this from route handlers right after the mutation succeeds, e.g.:
 *
 *   await recordAuditLog({
 *     actorId: String(req.user!._id),
 *     action: "article.publish",
 *     targetType: "Article",
 *     targetId: String(article._id),
 *     meta: { slug: article.slug },
 *   });
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    await AuditLog.create({
      actor: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      meta: input.meta,
    });
  } catch (err) {
    console.error("[audit-log] failed to record entry:", input.action, err);
  }
}
