import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Comment } from "../models/Comment";
import { authenticate, requireRole, type AuthedRequest } from "../middleware/auth";
import { dispatchNotification } from "../services/dispatch";
import { recordAuditLog } from "../services/auditLog";

const router = Router();

const CommentInput = z.object({
  content: z.string().min(1).max(2000),
  parentComment: z.string().optional(),
});
const ModerationInput = z.object({
  status: z.enum(["approved", "hidden", "deleted"]),
});

// GET /api/articles/:articleId/comments — public, only approved comments
router.get("/articles/:articleId/comments", async (req: Request, res: Response) => {
  const comments = await Comment.find({ article: req.params.articleId, status: "approved" })
    .populate("author", "name avatarUrl")
    .sort({ createdAt: -1 });
  res.json({ comments });
});

// POST /api/articles/:articleId/comments — any signed-in user
router.post("/articles/:articleId/comments", authenticate, async (req: AuthedRequest, res: Response) => {
  const parsed = CommentInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid comment data", details: parsed.error.flatten() });
  }

  const comment = await Comment.create({
    article: req.params.articleId,
    author: req.user!._id,
    content: parsed.data.content,
    parentComment: parsed.data.parentComment || null,
    status: "approved", // flip to "pending" here if you want pre-moderation
  });

  // Notify the parent comment's author on a reply.
  if (parsed.data.parentComment) {
    const parent = await Comment.findById(parsed.data.parentComment).select("author");
    if (parent && !(parent.author as any).equals(req.user!._id)) {
      dispatchNotification({
        userId: String(parent.author),
        type: "comment_reply",
        title: "New reply to your comment",
        body: parsed.data.content.slice(0, 140),
        url: `/articles/${req.params.articleId}`,
      }).catch((err) => console.error("[comments] notify reply failed:", err));
    }
  }

  const populated = await comment.populate("author", "name avatarUrl");
  res.status(201).json({ comment: populated });
});

/**
 * GET /api/comments?status=approved&page=1&limit=20
 * Cross-article comment listing for the moderation queue.
 * Gated to Admin | Editor | Moderator.
 *
 * Defaults to status=approved (not "pending") because POST above always
 * creates comments as "approved" — this is a post-then-moderate queue
 * (comments go live immediately, moderators hide/delete after) rather
 * than a pre-publish queue. Pass ?status=pending or ?status=all to see
 * other states. If you switch POST to create "pending" comments instead,
 * change this default to match.
 */
router.get("/comments", requireRole("Admin", "Editor", "Moderator"), async (req: Request, res: Response) => {
  const status = (req.query.status as string) || "approved";
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const filter = status === "all" ? {} : { status };

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name email avatarUrl")
      .populate("article", "title slug")
      .lean(),
    Comment.countDocuments(filter),
  ]);

  res.json({
    comments,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  });
});

// PATCH /api/comments/:id — Moderator/Editor/Admin only: approve/hide/delete
router.patch("/comments/:id", requireRole("Admin", "Editor", "Moderator"), async (req: AuthedRequest, res: Response) => {
  const parsed = ModerationInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid moderation action", details: parsed.error.flatten() });
  }

  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    { status: parsed.data.status, moderatedBy: req.user!._id, moderatedAt: new Date() },
    { new: true }
  );

  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  recordAuditLog({
    actorId: String(req.user!._id),
    action: "comment.moderate",
    targetType: "Comment",
    targetId: req.params.id,
    meta: { status: parsed.data.status, article: String(comment.article) },
  });

  if (parsed.data.status === "approved" || parsed.data.status === "hidden") {
    dispatchNotification({
      userId: String(comment.author),
      type: parsed.data.status === "approved" ? "comment_approved" : "comment_hidden",
      title: parsed.data.status === "approved" ? "Your comment was approved" : "Your comment was hidden",
      body: comment.content.slice(0, 140),
      url: `/articles/${comment.article}`,
    }).catch((err) => console.error("[comments] notify moderation failed:", err));
  }

  res.json({ comment });
});

// DELETE /api/comments/:id — the comment's own author, or Moderator/Editor/Admin
router.delete("/comments/:id", authenticate, async (req: AuthedRequest, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  const isOwner = (comment.author as any).equals(req.user!._id);
  const canModerate = ["Admin", "Editor", "Moderator"].includes(req.user!.role);
  if (!isOwner && !canModerate) {
    return res.status(403).json({ error: "Not authorized to delete this comment" });
  }

  comment.status = "deleted";
  await comment.save();
  recordAuditLog({
    actorId: String(req.user!._id),
    action: "comment.delete",
    targetType: "Comment",
    targetId: req.params.id,
    meta: { article: String(comment.article), deletedBy: isOwner ? "author" : "moderator" },
  });
  res.json({ success: true });
});

export default router;
