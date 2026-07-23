import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { verifyIdToken } from "../config/firebase";
import { User } from "../models/User";

const router = Router();

const SyncBodySchema = z.object({
  idToken: z.string().min(10),
  name: z.string().min(1).max(120).optional(),
  avatarUrl: z.string().url().optional(),
});

// POST /api/auth/sync
// 1. Client signs in with Firebase Auth and sends us the resulting ID token.
// 2. We verify it server-side (never trust a raw UID from the client).
// 3. Look up (or create) the matching Mongo user profile.
// 4. Return the app-specific profile so the client can route/gate the UI.
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const parsed = SyncBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    }

    const { idToken, name, avatarUrl } = parsed.data;
    const decoded = await verifyIdToken(idToken);
    const { uid, email } = decoded;

    if (!email) {
      return res.status(400).json({ error: "Firebase account has no email on file" });
    }

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || email.split("@")[0],
        avatarUrl,
        role: "Subscriber",
        language: "en",
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        language: user.language,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (err) {
    console.error("Auth sync error:", err);
    res.status(500).json({ error: "Authentication sync failed" });
  }
});

export default router;
