import { NextRequest, NextResponse } from "next/server";
import { isSharedStorageConfigured, readPublishedStore, removePublishedWebinar, upsertPublishedWebinars } from "@/lib/storage/shared-store";
import type { PublishedWebinarSnapshot } from "@/types/published";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readPublishedStore();
  return NextResponse.json({
    webinars: Object.values(store.webinars),
    updatedAt: store.updatedAt,
    // Only report "configured" once writes can actually succeed — storage
    // alone isn't enough if PUBLISH_SECRET was never set, which would
    // otherwise show "active" while every publish attempt still 401s.
    configured: isSharedStorageConfigured() && !!process.env.PUBLISH_SECRET,
  });
}

function hasValidSecret(req: NextRequest): boolean {
  const expected = process.env.PUBLISH_SECRET;
  if (!expected) return false;
  const provided = req.headers.get("x-publish-secret");
  return provided === expected;
}

export async function POST(req: NextRequest) {
  if (!isSharedStorageConfigured()) {
    return NextResponse.json({ error: "STORAGE_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!hasValidSecret(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { webinars?: PublishedWebinarSnapshot[]; deleteId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (Array.isArray(body.webinars) && body.webinars.length > 0) {
    await upsertPublishedWebinars(body.webinars);
  }
  if (typeof body.deleteId === "string" && body.deleteId) {
    await removePublishedWebinar(body.deleteId);
  }

  return NextResponse.json({ ok: true });
}
