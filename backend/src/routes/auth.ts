import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../config/jwt";
import { authenticate, type AuthedRequest } from "../middleware/auth";

const router = Router();

const SALT_ROUNDS = 12;

function serializeUser(user: any) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    language: user.language,
    notificationPreferences: user.notificationPreferences,
  };
}

function issueTokens(user: any) {
  return {
    accessToken: signAccessToken(String(user._id), user.role),
    refreshToken: signRefreshToken(String(user._id)),
  };
}

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().min(1).max(120),
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }
  const { email, password, name } = parsed.data;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    email,
    passwordHash,
    name,
    role: "Subscriber",
    language: "en",
  });

  const tokens = issueTokens(user);
  res.status(201).json({ ...tokens, user: serializeUser(user) });
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }
  if (user.status === "deactivated") {
    return res.status(403).json({ error: "Account deactivated" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  const tokens = issueTokens(user);
  res.json({ ...tokens, user: serializeUser(user) });
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

// POST /api/auth/refresh
// Exchanges a valid refresh token for a new access token (and a rotated
// refresh token). Stateless — no server-side refresh-token store, so a
// refresh token remains valid until it expires even if "logged out".
router.post("/refresh", async (req: Request, res: Response) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const decoded = verifyRefreshToken(parsed.data.refreshToken);
    const user = await User.findById(decoded.sub);
    if (!user || user.status === "deactivated") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const tokens = issueTokens(user);
    res.json({ ...tokens, user: serializeUser(user) });
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// GET /api/auth/me
// Used by the frontend to hydrate the signed-in profile on page load,
// given a still-valid access token (or after refreshing one).
router.get("/me", authenticate, async (req: AuthedRequest, res: Response) => {
  res.json({ user: serializeUser(req.user) });
});

// POST /api/auth/logout
// Stateless design: there's no server-side session to invalidate, so this
// just acknowledges the request. The client is responsible for discarding
// its stored access/refresh tokens.
router.post("/logout", async (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default router;
