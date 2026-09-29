import "server-only";
import { Redis } from "@upstash/redis";
import type { PublishedStore, PublishedWebinarSnapshot } from "@/types/published";
import { emptyPublishedStore } from "@/types/published";

const STORE_KEY = "dashboard:published:v1";

function getClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isSharedStorageConfigured(): boolean {
  return getClient() !== null;
}

export async function readPublishedStore(): Promise<PublishedStore> {
  const client = getClient();
  if (!client) return emptyPublishedStore();
  const data = await client.get<PublishedStore>(STORE_KEY);
  return data ?? emptyPublishedStore();
}

export async function upsertPublishedWebinars(snapshots: PublishedWebinarSnapshot[]): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("STORAGE_NOT_CONFIGURED");
  const current = await readPublishedStore();
  for (const snapshot of snapshots) current.webinars[snapshot.id] = snapshot;
  current.updatedAt = new Date().toISOString();
  await client.set(STORE_KEY, current);
}

export async function removePublishedWebinar(id: string): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("STORAGE_NOT_CONFIGURED");
  const current = await readPublishedStore();
  delete current.webinars[id];
  current.updatedAt = new Date().toISOString();
  await client.set(STORE_KEY, current);
}
