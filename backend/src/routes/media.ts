import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { MediaMetadata } from "../models/MediaMetadata";
import { requireRole, type AuthedRequest } from "../middleware/auth";
import { createUploadSignature, destroyAsset } from "../config/cloudinary";

const router = Router();

const MediaInput = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  secureUrl: z.string().url(),
  type: z.enum(["image", "video"]),
  format: z.string().min(1),
  width: z.number().optional(),
  height: z.number().optional(),
  bytes: z.number().nonnegative(),
  altText: z.string().max(200).optional(),
});
const MediaUpdateInput = z.object({ altText: z.string().max(200).optional() });

const staffRoles = requireRole("Admin", "Editor", "Author");

// POST /api/media/sign — short-lived signature for direct-to-Cloudinary upload
router.post("/sign", ...staffRoles, async (_req: Request, res: Response) => {
  try {
    const signature = createUploadSignature("amakuru");
    res.json(signature);
  } catch (err) {
    console.error("Cloudinary signature error:", err);
    res.status(500).json({ error: "Cloudinary is not configured on the server" });
  }
});

// GET /api/media — Media Library view
router.get("/", ...staffRoles, async (_req: Request, res: Response) => {
  const media = await MediaMetadata.find({}).sort({ createdAt: -1 }).limit(100);
  res.json({ media });
});

// POST /api/media — register metadata for an already-uploaded Cloudinary asset
router.post("/", ...staffRoles, async (req: AuthedRequest, res) => {
  const parsed = MediaInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid media data", details: parsed.error.flatten() });
  }
  const media = await MediaMetadata.create({ ...parsed.data, uploadedBy: req.user!._id });
  res.status(201).json({ media });
});

// PATCH /api/media/:id — edit alt text. Owner (Author) or Admin/Editor.
router.patch("/:id", ...staffRoles, async (req: AuthedRequest, res) => {
  const media = await MediaMetadata.findById(req.params.id);
  if (!media) return res.status(404).json({ error: "Media not found" });

  const isOwner = (media.uploadedBy as any).equals(req.user!._id);
  const isStaff = ["Admin", "Editor"].includes(req.user!.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: "You can only edit media you uploaded" });
  }

  const parsed = MediaUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid update", details: parsed.error.flatten() });
  }

  const updated = await MediaMetadata.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  res.json({ media: updated });
});

// DELETE /api/media/:id — removes the Cloudinary asset and its metadata doc.
router.delete("/:id", ...staffRoles, async (req: AuthedRequest, res) => {
  const media = await MediaMetadata.findById(req.params.id);
  if (!media) return res.status(404).json({ error: "Media not found" });

  const isOwner = (media.uploadedBy as any).equals(req.user!._id);
  const isStaff = ["Admin", "Editor"].includes(req.user!.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: "You can only delete media you uploaded" });
  }

  try {
    await destroyAsset(media.publicId, media.type);
  } catch (err) {
    console.error("Cloudinary destroy failed:", err);
  }

  await MediaMetadata.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
