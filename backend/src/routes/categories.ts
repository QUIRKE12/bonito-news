import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Category } from "../models/Category";
import { requireRole } from "../middleware/auth";

const router = Router();

const CategoryInput = z.object({
  slug: z.string().min(1).max(60),
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  colorDot: z.string().optional(),
});
const CategoryUpdateInput = CategoryInput.partial();

// GET /api/categories — public
router.get("/", async (_req: Request, res: Response) => {
  const categories = await Category.find({}).sort({ name: 1 });
  res.json({ categories });
});

// GET /api/categories/:id — public. :id may be an ObjectId or the category's slug.
router.get("/:id", async (req: Request, res: Response) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const lookup = isObjectId ? { _id: req.params.id } : { slug: req.params.id };
  const category = await Category.findOne(lookup);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json({ category });
});

// POST /api/categories — Admin/Editor only
router.post("/", requireRole("Admin", "Editor"), async (req: Request, res: Response) => {
  const parsed = CategoryInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid category data", details: parsed.error.flatten() });
  }
  try {
    const category = await Category.create(parsed.data);
    res.status(201).json({ category });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A category with that slug already exists" });
    }
    console.error("Create category error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PATCH /api/categories/:id — Admin/Editor only
router.patch("/:id", requireRole("Admin", "Editor"), async (req: Request, res: Response) => {
  const parsed = CategoryUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid category data", details: parsed.error.flatten() });
  }
  const category = await Category.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json({ category });
});

// DELETE /api/categories/:id — Admin only
router.delete("/:id", requireRole("Admin"), async (req: Request, res: Response) => {
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Category not found" });
  res.json({ success: true });
});

// POST /api/categories/seed-defaults — Admin/Editor only.
// One-time helper: creates a standard set of news categories. Matches
// by slug, so already-existing categories are left untouched — safe to
// click more than once.
const DEFAULT_CATEGORIES = [
  { slug: "politics", name: "Politics", colorDot: "#B23A48" },
  { slug: "business", name: "Business & Economy", colorDot: "#1F7A6C" },
  { slug: "sports", name: "Sports", colorDot: "#2E7D32" },
  { slug: "technology", name: "Technology", colorDot: "#1565C0" },
  { slug: "health", name: "Health", colorDot: "#0097A7" },
  { slug: "entertainment", name: "Entertainment", colorDot: "#8E24AA" },
  { slug: "world", name: "World", colorDot: "#455A64" },
  { slug: "education", name: "Education", colorDot: "#F9A825" },
  { slug: "culture", name: "Culture & Lifestyle", colorDot: "#D81B60" },
  { slug: "opinion", name: "Opinion", colorDot: "#6D4C41" },
  { slug: "environment", name: "Environment", colorDot: "#43A047" },
  { slug: "crime-justice", name: "Crime & Justice", colorDot: "#C62828" },
];

router.post("/seed-defaults", requireRole("Admin", "Editor"), async (_req: Request, res: Response) => {
  let inserted = 0;
  const skipped: string[] = [];

  for (const c of DEFAULT_CATEGORIES) {
    const exists = await Category.findOne({ slug: c.slug });
    if (exists) {
      skipped.push(c.slug);
      continue;
    }
    await Category.create(c);
    inserted += 1;
  }

  res.json({ inserted, skipped: skipped.length, total: DEFAULT_CATEGORIES.length });
});

export default router;
