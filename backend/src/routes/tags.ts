import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Tag } from "../models/Tag";
import { requireRole } from "../middleware/auth";

const router = Router();

const TagInput = z.object({
  slug: z.string().min(1).max(60),
  name: z.string().min(1).max(80),
});

router.get("/", async (_req: Request, res: Response) => {
  const tags = await Tag.find({}).sort({ name: 1 });
  res.json({ tags });
});

router.post("/", requireRole("Admin", "Editor", "Author"), async (req: Request, res: Response) => {
  const parsed = TagInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid tag data", details: parsed.error.flatten() });
  }
  try {
    const tag = await Tag.create(parsed.data);
    res.status(201).json({ tag });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A tag with that slug already exists" });
    }
    console.error("Create tag error:", err);
    res.status(500).json({ error: "Failed to create tag" });
  }
});

router.delete("/:id", requireRole("Admin", "Editor"), async (req: Request, res: Response) => {
  const deleted = await Tag.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Tag not found" });
  res.json({ success: true });
});

export default router;
