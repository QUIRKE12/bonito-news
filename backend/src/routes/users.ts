import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { requireRole, type AuthedRequest } from "../middleware/auth";
import { recordAuditLog } from "../services/auditLog";

const router = Router();

const RoleUpdateInput = z.object({
  role: z.enum(["Admin", "Editor", "Author", "Moderator", "Subscriber"]),
});

const StatusUpdateInput = z.object({
  status: z.enum(["active", "invited", "deactivated"]),
});

// GET /api/users — Admin only. Lists everyone who has ever signed in
// (via /api/auth/sync), so an Admin can promote a subscriber to
// Editor/Author, or bring on a new facilitator once they've signed in once.
router.get("/", requireRole("Admin"), async (_req: Request, res: Response) => {
  const users = await User.find({})
    .select("email name avatarUrl role status createdAt")
    .sort({ createdAt: -1 });
  res.json({ users });
});

// PATCH /api/users/:id/role — Admin only. Changes someone's role
// (e.g. Subscriber -> Editor) once they've already signed in at least
// once and therefore already exist as a Mongo user document.
router.patch("/:id/role", requireRole("Admin"), async (req: AuthedRequest, res: Response) => {
  const parsed = RoleUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid role", details: parsed.error.flatten() });
  }
  const before = await User.findById(req.params.id).select("role");
  if (!before) return res.status(404).json({ error: "User not found" });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: parsed.data.role },
    { new: true }
  ).select("email name avatarUrl role status createdAt");
  if (!user) return res.status(404).json({ error: "User not found" });

  recordAuditLog({
    actorId: String(req.user!._id),
    action: "user.role_change",
    targetType: "User",
    targetId: req.params.id,
    meta: { from: before.role, to: parsed.data.role },
  });

  res.json({ user });
});

// PATCH /api/users/:id/status — Admin only. Deactivate/reactivate an
// account without deleting it (e.g. a facilitator who's left).
router.patch("/:id/status", requireRole("Admin"), async (req: AuthedRequest, res: Response) => {
  const parsed = StatusUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid status", details: parsed.error.flatten() });
  }
  const before = await User.findById(req.params.id).select("status");
  if (!before) return res.status(404).json({ error: "User not found" });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: parsed.data.status },
    { new: true }
  ).select("email name avatarUrl role status createdAt");
  if (!user) return res.status(404).json({ error: "User not found" });

  recordAuditLog({
    actorId: String(req.user!._id),
    action: "user.status_change",
    targetType: "User",
    targetId: req.params.id,
    meta: { from: before.status, to: parsed.data.status },
  });

  res.json({ user });
});

export default router;
