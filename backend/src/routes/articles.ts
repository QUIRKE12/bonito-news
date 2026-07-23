import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Article } from "../models/Article";
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

export default router;
