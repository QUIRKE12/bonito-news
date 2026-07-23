import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { SiteSettings } from "../models/SiteSettings";
import { requireRole, type AuthedRequest } from "../middleware/auth";

const router = Router();

const SettingsInput = z.object({
  siteName: z.string().min(1).max(80).optional(),
  tagline: z.string().max(160).optional(),
  logoUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional(),
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
    })
    .optional(),
  adsEnabled: z.boolean().optional(),
  commentsEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
});

// GET /api/settings — public
router.get("/", async (_req: Request, res: Response) => {
  let settings = await SiteSettings.findOne({});
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  res.json({ settings });
});

// PATCH /api/settings — Admin only
router.patch("/", requireRole("Admin"), async (req: AuthedRequest, res: Response) => {
  const parsed = SettingsInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid settings data", details: parsed.error.flatten() });
  }

  let settings = await SiteSettings.findOne({});
  if (!settings) {
    settings = await SiteSettings.create({ ...parsed.data, updatedBy: req.user!._id });
  } else {
    Object.assign(settings, parsed.data, { updatedBy: req.user!._id });
    await settings.save();
  }

  res.json({ settings });
});

export default router;
