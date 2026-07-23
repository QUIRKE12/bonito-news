import { Router } from "express";
import { z } from "zod";
import { Bookmark } from "../models/Bookmark";
import { authenticate, type AuthedRequest } from "../middleware/auth";

const router = Router();

const BookmarkInput = z.object({
  article: z.string().min(1),
});

// GET /api/bookmarks — the signed-in user's own bookmarks
router.get("/", authenticate, async (req: AuthedRequest, res) => {
  const bookmarks = await Bookmark.find({ user: req.user!._id })
    .populate({
      path: "article",
      select: "title slug dek coverImage category publishedAt",
      populate: { path: "category", select: "name slug colorDot" },
    })
    .sort({ createdAt: -1 });
  res.json({ bookmarks });
});

// POST /api/bookmarks — add a bookmark
router.post("/", authenticate, async (req: AuthedRequest, res) => {
  const parsed = BookmarkInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid bookmark data", details: parsed.error.flatten() });
  }
  try {
    const bookmark = await Bookmark.create({ user: req.user!._id, article: parsed.data.article });
    res.status(201).json({ bookmark });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Already bookmarked" });
    }
    console.error("Create bookmark error:", err);
    res.status(500).json({ error: "Failed to bookmark article" });
  }
});

// DELETE /api/bookmarks?article=<id> — remove a bookmark
router.delete("/", authenticate, async (req: AuthedRequest, res) => {
  const articleId = req.query.article as string | undefined;
  if (!articleId) {
    return res.status(400).json({ error: "Missing article query param" });
  }
  await Bookmark.findOneAndDelete({ user: req.user!._id, article: articleId });
  res.json({ success: true });
});

export default router;
