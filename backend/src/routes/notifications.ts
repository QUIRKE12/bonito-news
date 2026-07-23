import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { requireRole, authenticate, type AuthedRequest } from "../middleware/auth";

const router = Router();

const NotificationInput = z.object({
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  audience: z.enum(["all", "category-subscribers", "breaking-news-only"]).default("all"),
  categoryFilter: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

// GET /api/notifications — Admin/Editor only: history for the admin panel
router.get("/", requireRole("Admin", "Editor"), async (_req: Request, res: Response) => {
  const notifications = await Notification.find({}).populate("createdBy", "name").sort({ createdAt: -1 });
  res.json({ notifications });
});

/**
 * POST /api/notifications — Admin/Editor only.
 * Creates the notification record and computes an estimated reach.
 * NOTE: this persists the record ("draft"/"scheduled") for the composer
 * UI; it does not itself trigger a push send. Use dispatchNotification /
 * dispatchNotificationBatch (services/) to actually deliver.
 */
router.post("/", requireRole("Admin", "Editor"), async (req: AuthedRequest, res: Response) => {
  const parsed = NotificationInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid notification data", details: parsed.error.flatten() });
  }
  const data = parsed.data;

  const reachQuery: Record<string, any> = { "notificationPreferences.enabled": true };
  if (data.audience === "breaking-news-only") {
    reachQuery["notificationPreferences.breakingNewsOnly"] = true;
  }
  const estimatedReach = await User.countDocuments(reachQuery);

  const notification = await Notification.create({
    title: data.title,
    message: data.message,
    audience: data.audience,
    categoryFilter: data.categoryFilter,
    scheduledFor: data.scheduledFor,
    status: data.scheduledFor ? "scheduled" : "draft",
    createdBy: req.user!._id,
    deliveryStats: { estimatedReach, delivered: 0, failed: 0 },
  });

  res.status(201).json({ notification });
});

// POST /api/notifications/register-token — any signed-in user, adds a device token
router.post("/register-token", authenticate, async (req: AuthedRequest, res: Response) => {
  const { token } = req.body ?? {};
  if (!token) return res.status(400).json({ error: "token is required" });

  await User.updateOne({ _id: req.user!._id }, { $addToSet: { fcmTokens: token } });
  res.json({ ok: true });
});

// DELETE /api/notifications/register-token — removes a device token (sign-out / permission revoke)
router.delete("/register-token", authenticate, async (req: AuthedRequest, res: Response) => {
  const { token } = req.body ?? {};
  if (!token) return res.status(400).json({ error: "token is required" });

  await User.updateOne({ _id: req.user!._id }, { $pull: { fcmTokens: token } });
  res.json({ ok: true });
});

export default router;
