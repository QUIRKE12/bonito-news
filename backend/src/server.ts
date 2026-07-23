import "dotenv/config";
import express from "express";
import cors from "cors";
import "express-async-errors"; // lets async route handler rejections reach the error middleware below (Express 4 doesn't do this on its own)
import { connectToDatabase } from "./config/db";
import adsRoutes from "./routes/ads";
import articlesRoutes from "./routes/articles";
import auditLogRoutes from "./routes/audit-log";
import authRoutes from "./routes/auth";
import bookmarksRoutes from "./routes/bookmarks";
import categoriesRoutes from "./routes/categories";
import commentsRoutes from "./routes/comments"; // mounts its own /articles/:id/comments + /comments paths
import mediaRoutes from "./routes/media";
import newsletterRoutes from "./routes/newsletter";
import notificationsRoutes from "./routes/notifications";
import settingsRoutes from "./routes/settings";
import tagsRoutes from "./routes/tags";
import usersRoutes from "./routes/users";
import { apiLimiter, authLimiter, writeLimiter } from "./middleware/rateLimit";
const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(",") ?? "*" }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", apiLimiter); // global default; tighter limiters below override per-route
app.use("/api/ads", adsRoutes);
app.use("/api/articles", writeLimiter, articlesRoutes);
app.use("/api/audit-log", auditLogRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api", writeLimiter, commentsRoutes); // -> /api/articles/:id/comments, /api/comments, /api/comments/:id
app.use("/api/media", mediaRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/users", usersRoutes);
// Basic error handler — catches anything thrown inside async route handlers
// that wasn't already caught (zod parsing/db calls above mostly handle
// their own errors, but this is the last line of defense).
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});
const PORT = process.env.PORT || 4000;
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] amakuru API listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("[server] failed to connect to MongoDB, exiting:", err);
    process.exit(1);
  });
