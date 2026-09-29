import type { Webinar } from "@/types/webinar";
import webinar2Seed from "./seed/webinar-2.json";

/**
 * Webinar 2, migrated from the previous Next.js project's hardcoded SAMPLE
 * object (components/dashboard.tsx). See scripts/generate-legacy-seed.mjs
 * for how the attendance/unit breakdown (unitsHadir, hanyaZoom) from that
 * source was combined with Webinar 2's HTML learning data.
 */
export const legacyWebinar2 = webinar2Seed as unknown as Webinar;
