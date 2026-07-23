import type { Request, Response } from "express";
import { Router } from "express";
import { AuditLog } from "../models/AuditLog";
import { requireRole } from "../middleware/auth";

const router = Router();

/**
 * GET /api/audit-log?page=1&limit=25&action=article.publish
 * Admin only. Newest first. `action` filter is optional and matches the
 * AuditAction strings used by recordAuditLog() (e.g. "article.publish",
 * "comment.moderate", "user.role_change").
 */
router.get("/", requireRole("Admin"), async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
  const action = req.query.action as string | undefined;

  const filter: Record<string, unknown> = {};
  if (action) filter.action = action;

  const [entries, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actor", "name email avatarUrl")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    entries,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  });
});

export default router;
