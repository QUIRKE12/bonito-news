import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Article } from "../models/Article";
import { Category } from "../models/Category";
import { requireRole, optionalAuthenticate, type AuthedRequest } from "../middleware/auth";
import { recordAuditLog } from "../services/auditLog";

const router = Router();

const ArticleInput = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  dek: z.string().min(1).max(500),
  body: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  scheduledFor: z.string().datetime().optional(),
  readTimeMinutes: z.number().int().positive().optional(),
  isBreaking: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});
const ArticleUpdateInput = ArticleInput.partial();

/**
 * GET /api/articles — public.
 * Query params: category, status, tag, page, limit, search
 * Public callers only ever see status=published, regardless of what they
 * pass, unless they're authenticated as Author/Editor/Admin/Moderator.
 */
router.get("/", optionalAuthenticate, async (req: AuthedRequest, res: Response) => {
  const category = req.query.category as string | undefined;
  const tag = req.query.tag as string | undefined;
  const search = req.query.search as string | undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(50, parseInt((req.query.limit as string) || "12", 10));
  const requestedStatus = req.query.status as string | undefined;

  const isStaff = !!req.user && ["Admin", "Editor", "Author", "Moderator"].includes(req.user.role);

  const filter: Record<string, any> = {};
  filter.status = isStaff && requestedStatus ? requestedStatus : "published";
  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (search) filter.title = { $regex: search, $options: "i" };

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate("category", "name slug colorDot")
      .populate("author", "name avatarUrl")
      .populate("coverImage", "url secureUrl altText")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Article.countDocuments(filter),
  ]);

  res.json({
    articles,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/**
 * POST /api/articles — Author, Editor, or Admin.
 * Authors can only create drafts; only Editor/Admin can publish directly.
 */
router.post("/", requireRole("Admin", "Editor", "Author"), async (req: AuthedRequest, res: Response) => {
  const parsed = ArticleInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid article data", details: parsed.error.flatten() });
  }

  const data = parsed.data;
  const status = req.user!.role === "Author" ? "draft" : data.status;

  try {
    const article = await Article.create({
      ...data,
      status,
      author: req.user!._id,
      publishedAt: status === "published" ? new Date() : undefined,
    });
    recordAuditLog({
      actorId: String(req.user!._id),
      action: status === "published" ? "article.publish" : "article.create",
      targetType: "Article",
      targetId: String(article._id),
      meta: { slug: article.slug, status },
    });
    res.status(201).json({ article });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "An article with that slug already exists" });
    }
    console.error("Create article error:", err);
    res.status(500).json({ error: "Failed to create article" });
  }
});

// GET /api/articles/:id — public for published; staff can view drafts of their own or any (Editor/Admin)
// :id may be either a Mongo ObjectId or the article's slug, so the frontend
// can use pretty URLs (/articles/some-slug) without a separate route.
router.get("/:id", optionalAuthenticate, async (req: AuthedRequest, res: Response) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const lookup = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

  const article = await Article.findOne(lookup)
    .populate("category", "name slug colorDot")
    .populate("tags", "name slug")
    .populate("author", "name avatarUrl")
    .populate("coverImage", "url secureUrl altText");

  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  if (article.status !== "published") {
    const isOwnerOrStaff =
      !!req.user &&
      ((article.author as any)._id.equals(req.user._id) || ["Admin", "Editor"].includes(req.user.role));
    if (!isOwnerOrStaff) {
      return res.status(404).json({ error: "Article not found" });
    }
  } else {
    // Fire-and-forget view increment; don't block the response on it
    Article.updateOne({ _id: article._id }, { $inc: { views: 1 } }).catch(() => {});
  }

  res.json({ article });
});

// PATCH /api/articles/:id — Author can edit their own drafts; Editor/Admin can edit anything
router.patch("/:id", requireRole("Admin", "Editor", "Author"), async (req: AuthedRequest, res: Response) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  const isOwner = (article.author as any).equals(req.user!._id);
  const isStaff = ["Admin", "Editor"].includes(req.user!.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: "You can only edit your own articles" });
  }

  const parsed = ArticleUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid article data", details: parsed.error.flatten() });
  }

  const updates = { ...parsed.data } as Record<string, any>;

  if (updates.status === "published" && !isStaff) {
    delete updates.status;
  }
  if (updates.status === "published" && !article.publishedAt) {
    updates.publishedAt = new Date();
  }

  const wasPublished = article.status === "published";
  const updated = await Article.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate("category", "name slug colorDot")
    .populate("author", "name avatarUrl");

  recordAuditLog({
    actorId: String(req.user!._id),
    action: !wasPublished && updated?.status === "published" ? "article.publish" : "article.update",
    targetType: "Article",
    targetId: req.params.id,
    meta: { slug: updated?.slug, status: updated?.status },
  });

  res.json({ article: updated });
});

// DELETE /api/articles/:id — Editor/Admin only
// DELETE /api/articles/seed-samples — Admin/Editor only.
// Removes exactly the placeholder articles seed-samples created (slug
// ends in "-sample-<n>"), so you can clean them up in one click instead
// of deleting each one by hand. Never touches real articles. Must stay
// registered before DELETE "/:id" below — otherwise Express matches
// "/:id" first and tries (and fails) to delete an article whose id is
// literally the string "seed-samples".
router.delete("/seed-samples", requireRole("Admin", "Editor"), async (req: AuthedRequest, res: Response) => {
  const result = await Article.deleteMany({ slug: { $regex: /-sample-\d+$/ } });
  recordAuditLog({
    actorId: String(req.user!._id),
    action: "article.delete_samples",
    targetType: "Article",
    targetId: String(req.user!._id),
    meta: { deletedCount: result.deletedCount },
  });
  res.json({ deleted: result.deletedCount });
});

router.delete("/:id", requireRole("Admin", "Editor"), async (req: AuthedRequest, res: Response) => {
  const deleted = await Article.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Article not found" });
  }
  recordAuditLog({
    actorId: String(req.user!._id),
    action: "article.delete",
    targetType: "Article",
    targetId: req.params.id,
    meta: { slug: deleted.slug },
  });
  res.json({ success: true });
});

/**
 * POST /api/articles/seed-samples — Admin/Editor only.
 * One-time helper: ensures every existing category has at least 5
 * published sample articles, so the site has content to browse while
 * real reporting is being written. Matches by slug, so re-running this
 * is safe — it only fills gaps, never duplicates or overwrites articles
 * that already exist.
 *
 * Content is intentionally generic placeholder copy (no invented facts,
 * names, or events) since these are stand-in articles, not real
 * reporting — swap them out for actual stories before relying on them.
 */
const HEADLINE_TEMPLATES = [
  (name: string) => `${name}: what to know this week`,
  (name: string) => `Five updates in ${name} you shouldn't miss`,
  (name: string) => `${name} roundup: the stories shaping the week`,
  (name: string) => `Inside ${name}: analysis and context`,
  (name: string) => `${name} today: the latest developments`,
];

router.post("/seed-samples", requireRole("Admin", "Editor"), async (req: AuthedRequest, res: Response) => {
  const categories = await Category.find({});
  if (categories.length === 0) {
    return res.status(400).json({ error: "No categories exist yet — create categories first" });
  }

  let inserted = 0;
  const skipped: string[] = [];

  for (const category of categories) {
    for (let i = 0; i < HEADLINE_TEMPLATES.length; i++) {
      const slug = `${category.slug}-sample-${i + 1}`;
      const exists = await Article.findOne({ slug });
      if (exists) {
        skipped.push(slug);
        continue;
      }

      const title = HEADLINE_TEMPLATES[i](category.name);
      await Article.create({
        slug,
        title,
        dek: `Placeholder sample content for the ${category.name} section — replace with real reporting.`,
        body: `<p>This is placeholder sample content for the <strong>${category.name}</strong> section, generated to preview how articles look on the site. It does not describe any real event, person, or organization.</p><p>Replace this with an actual story before publishing to readers — use the editor to update the title, summary, and body, or delete this sample once real content is ready.</p>`,
        category: category._id,
        author: req.user!._id,
        status: "published",
        publishedAt: new Date(),
        readTimeMinutes: 2,
        isFeatured: false,
        isBreaking: false,
      });
      inserted += 1;
    }
  }

  recordAuditLog({
    actorId: String(req.user!._id),
    action: "article.seed_samples",
    targetType: "Article",
    targetId: String(req.user!._id),
    meta: { inserted, skippedCount: skipped.length },
  });

  res.json({ inserted, skipped: skipped.length, categories: categories.length });
});

export default router;
