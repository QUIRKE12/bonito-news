import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Advertisement } from "../models/Advertisement";
import { requireRole, optionalAuthenticate, type AuthedRequest } from "../middleware/auth";

const router = Router();

const AdInput = z.object({
  title: z.string().min(1).max(120),
  imageUrl: z.string().url(),
  targetUrl: z.string().url(),
  placement: z.enum(["hero-side", "in-feed", "sidebar", "footer"]),
  active: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const AdUpdateInput = AdInput.partial();

// GET /api/ads — public, only active + within date range.
// Pass ?all=true with Admin/Editor auth to get every ad for the admin panel.
router.get("/", optionalAuthenticate, async (req: AuthedRequest, res) => {
  const showAll = req.query.all === "true";

  if (showAll) {
    const isStaff = req.user && ["Admin", "Editor"].includes(req.user.role);
    if (!isStaff) {
      return res.status(403).json({ error: "Requires one of: Admin, Editor" });
    }
    const ads = await Advertisement.find({}).sort({ createdAt: -1 });
    return res.json({ ads });
  }

  const now = new Date();
  const ads = await Advertisement.find({
    active: true,
    $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }],
    $and: [{ $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] }],
  });
  res.json({ ads });
});

// POST /api/ads — Admin/Editor only
router.post("/", requireRole("Admin", "Editor"), async (req: Request, res: Response) => {
  const parsed = AdInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid ad data", details: parsed.error.flatten() });
  }
  const ad = await Advertisement.create(parsed.data);
  res.status(201).json({ ad });
});

// PATCH /api/ads/:id — Admin/Editor only
router.patch("/:id", requireRole("Admin", "Editor"), async (req: Request, res: Response) => {
  const parsed = AdUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid ad data", details: parsed.error.flatten() });
  }
  const ad = await Advertisement.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!ad) return res.status(404).json({ error: "Ad not found" });
  res.json({ ad });
});

// DELETE /api/ads/:id — Admin only
router.delete("/:id", requireRole("Admin"), async (req: Request, res: Response) => {
  const deleted = await Advertisement.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Ad not found" });
  res.json({ success: true });
});

// POST /api/ads/:id/track — records an impression or click.
// (Was POST /api/ads/:id in Next.js, where the base route path doubled as
// both "create" and "track event" depending on presence of :id. Split into
// its own path here since Express can't overload a route purely by params.)
router.post("/:id/track", async (req: Request, res: Response) => {
  const { event } = req.body ?? {};
  if (!["impression", "click"].includes(event)) {
    return res.status(400).json({ error: "event must be 'impression' or 'click'" });
  }
  const field = event === "impression" ? "impressions" : "clicks";
  const ad = await Advertisement.findByIdAndUpdate(req.params.id, { $inc: { [field]: 1 } }, { new: true });
  if (!ad) return res.status(404).json({ error: "Ad not found" });
  res.json({ success: true });
});

export default router;
