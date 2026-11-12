import "server-only";
import { Redis } from "@upstash/redis";
import { freshStore, replaceStore, snapshotStore } from "@/lib/requests";

// The prototype has no database: it runs on mock data held in memory.
// Hosted on serverless (Vercel), each request may hit a different short-lived
// server, so the live demo keeps that same mock state in a small Redis cache.
// Locally (no Upstash env vars) nothing here runs and memory is used as before.

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
export const redis = url && token ? new Redis({ url, token }) : null;

const KEY = "guest-requests:demo-state:v1";
// Nobody has changed anything for an hour: start the demo fresh.
const IDLE_RESET_MS = 60 * 60 * 1000;

async function load() {
  if (!redis) return;
  const saved = await redis.get<ReturnType<typeof snapshotStore>>(KEY);
  const stale = !saved?.requests || Date.now() - (saved.lastWrite ?? 0) > IDLE_RESET_MS;
  replaceStore(stale ? { ...freshStore(), lastWrite: Date.now() } : saved);
  if (stale) await redis.set(KEY, snapshotStore());
}

async function save() {
  if (!redis) return;
  snapshotStore().lastWrite = Date.now();
  await redis.set(KEY, snapshotStore());
}

/** Read the demo state (fresh from the cache when hosted). */
export async function readStore<T>(fn: () => T): Promise<T> {
  await load();
  return fn();
}

/** Change the demo state and save it back (when hosted). */
export async function writeStore<T>(fn: () => T): Promise<T> {
  await load();
  const result = fn();
  await save();
  return result;
}

// Public demo link: cap AI calls so nobody can run up the Gemini bill.
const AI_CALLS_PER_HOUR = 60;
export async function aiAllowed(): Promise<boolean> {
  if (!redis) return true;
  const key = `guest-requests:ai:${new Date().toISOString().slice(0, 13)}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 3600);
  return n <= AI_CALLS_PER_HOUR;
}
