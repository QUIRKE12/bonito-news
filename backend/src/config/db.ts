import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable. Add it to your .env file.");
}

let conn: typeof mongoose | null = null;

/**
 * A long-running Express process only needs to connect once at startup —
 * no per-request caching dance needed here (that was a Next.js
 * serverless/hot-reload workaround, not relevant to a standalone server).
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (conn) return conn;
  conn = await mongoose.connect(MONGODB_URI as string);
  console.log("[db] connected to MongoDB");
  return conn;
}
