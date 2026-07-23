import type { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../config/firebase";
import { User, type UserRole, type IUser } from "../models/User";

export interface AuthedRequest extends Request {
  user?: IUser;
}

/**
 * Reads the Firebase ID token from the Authorization header
 * ("Bearer <token>"), verifies it, and loads the matching Mongo user onto
 * req.user. Same logic as getAuthenticatedUser() in the old Next.js
 * requireRole.ts, just expressed as Express middleware instead of a
 * helper each route called manually.
 */
export async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  try {
    const decoded = await verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }
    if (user.status === "deactivated") {
      return res.status(403).json({ error: "Account deactivated" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Same token check as authenticate(), but never blocks the request if the
 * token is missing/invalid — it just leaves req.user undefined. Used for
 * routes that behave differently for signed-in staff vs. the public (e.g.
 * GET /articles showing drafts to staff, published-only to everyone else)
 * without requiring sign-in.
 */
export async function optionalAuthenticate(req: AuthedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();

  try {
    const decoded = await verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (user && user.status !== "deactivated") {
      req.user = user;
    }
  } catch {
    // Invalid/expired token on an optional-auth route: proceed as anonymous
    // rather than failing the request.
  }
  next();
}

/**
 * Express middleware factory equivalent to the old requireRole(req, roles).
 * Usage: router.post("/", ...requireRole("Admin", "Editor"), handler)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return [
    authenticate,
    (req: AuthedRequest, res: Response, next: NextFunction) => {
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user!.role)) {
        return res.status(403).json({ error: `Requires one of: ${allowedRoles.join(", ")}` });
      }
      next();
    },
  ];
}
