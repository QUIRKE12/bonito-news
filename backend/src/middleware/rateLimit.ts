import rateLimit from "express-rate-limit";

/**
 * Requires `express-rate-limit` — add it to backend/package.json
 * ("express-rate-limit": "^7.4.1") and `npm install`.
 *
 * Three profiles, applied per-route in server.ts:
 *  - apiLimiter: generous, global default for every /api/* request.
 *  - authLimiter: tight, for auth/sync — the endpoint most worth
 *    protecting from credential-stuffing / brute force.
 *  - writeLimiter: for comment/article POSTs — stops a single account
 *    (or IP, for anonymous reads) from spamming writes.
 *
 * Keyed by req.user's id when authenticated (so shared-IP users like an
 * office or campus network don't throttle each other), falling back to IP
 * for anonymous requests.
 */
function keyFn(req: any): string {
  return req.user?._id ? String(req.user._id) : req.ip;
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyFn,
  message: { error: "Too many requests, please slow down." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyFn,
  message: { error: "Too many auth attempts, please try again later." },
});

export const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyFn,
  message: { error: "Too many submissions, please slow down." },
});
