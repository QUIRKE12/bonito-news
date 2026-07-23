import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { NewsletterSubscriber } from "../models/Newsletter";
import { requireRole } from "../middleware/auth";

const router = Router();

const SubscribeInput = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
});

// POST /api/newsletter — public subscribe form (site footer)
router.post("/", async (req: Request, res: Response) => {
  const parsed = SubscribeInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email", details: parsed.error.flatten() });
  }

  const existing = await NewsletterSubscriber.findOne({ email: parsed.data.email });
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = undefined;
      await existing.save();
    }
    return res.json({ subscriber: existing });
  }

  const subscriber = await NewsletterSubscriber.create(parsed.data);
  res.status(201).json({ subscriber });
});

// GET /api/newsletter — Admin/Editor only
router.get("/", requireRole("Admin", "Editor"), async (_req: Request, res: Response) => {
  const subscribers = await NewsletterSubscriber.find({}).sort({ subscribedAt: -1 });
  res.json({ subscribers, total: subscribers.length });
});

// DELETE /api/newsletter?email=<email> — unsubscribe (public, e.g. from an email link)
router.delete("/", async (req: Request, res: Response) => {
  const email = req.query.email as string | undefined;
  if (!email) {
    return res.status(400).json({ error: "Missing email query param" });
  }
  await NewsletterSubscriber.findOneAndUpdate({ email }, { active: false, unsubscribedAt: new Date() });
  res.json({ success: true });
});

export default router;
