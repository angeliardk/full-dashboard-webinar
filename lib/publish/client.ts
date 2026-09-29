"use client";

import type { PublishedWebinarSnapshot } from "@/types/published";

export interface FetchPublishedResult {
  webinars: PublishedWebinarSnapshot[];
  configured: boolean;
}

export async function fetchPublishedWebinars(): Promise<FetchPublishedResult> {
  try {
    const res = await fetch("/api/dashboard", { cache: "no-store" });
    if (!res.ok) return { webinars: [], configured: false };
    const data = await res.json();
    return { webinars: Array.isArray(data.webinars) ? data.webinars : [], configured: !!data.configured };
  } catch {
    return { webinars: [], configured: false };
  }
}

export type PublishResult = { ok: true } | { ok: false; error: "STORAGE_NOT_CONFIGURED" | "UNAUTHORIZED" | "NETWORK" };

export async function publishWebinarSnapshot(snapshot: PublishedWebinarSnapshot, secret: string): Promise<PublishResult> {
  try {
    const res = await fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publish-secret": secret },
      body: JSON.stringify({ webinars: [snapshot] }),
    });
    if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" };
    if (res.status === 503) return { ok: false, error: "STORAGE_NOT_CONFIGURED" };
    if (!res.ok) return { ok: false, error: "NETWORK" };
    return { ok: true };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function unpublishWebinar(id: string, secret: string): Promise<PublishResult> {
  try {
    const res = await fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publish-secret": secret },
      body: JSON.stringify({ deleteId: id }),
    });
    if (res.status === 401) return { ok: false, error: "UNAUTHORIZED" };
    if (res.status === 503) return { ok: false, error: "STORAGE_NOT_CONFIGURED" };
    if (!res.ok) return { ok: false, error: "NETWORK" };
    return { ok: true };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}
