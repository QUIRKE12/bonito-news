import jwt from "jsonwebtoken";

/**
 * Custom JWT-based auth, replacing Firebase Authentication. RBAC
 * (requireRole / requireRole roles) is unchanged — only how a user's
 * identity gets verified on each request changes.
 *
 * Access tokens are short-lived and sent as "Authorization: Bearer <token>"
 * on every request. Refresh tokens are long-lived and only sent to
 * POST /api/auth/refresh to mint a new access token. This is a stateless
 * design (no server-side session/refresh-token store), which keeps it
 * simple but means a leaked refresh token can't be revoked before it
 * expires — acceptable for this app's threat model, but worth knowing.
 */

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("Missing JWT_ACCESS_SECRET or JWT_REFRESH_SECRET env vars.");
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

export interface AccessTokenPayload {
  sub: string; // Mongo user _id
  role: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

export function signAccessToken(userId: string, role: string): string {
  const payload: AccessTokenPayload = { sub: userId, role, type: "access" };
  return jwt.sign(payload, ACCESS_SECRET!, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: "refresh" };
  return jwt.sign(payload, REFRESH_SECRET!, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET!) as AccessTokenPayload;
  if (decoded.type !== "access") throw new Error("Not an access token");
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET!) as RefreshTokenPayload;
  if (decoded.type !== "refresh") throw new Error("Not a refresh token");
  return decoded;
}
