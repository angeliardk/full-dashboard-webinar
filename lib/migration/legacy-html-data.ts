import type { Webinar } from "@/types/webinar";
import webinar1Seed from "./seed/webinar-1.json";

/**
 * Webinar 1, migrated from Dashboard_Editable_Webinar1_dan_2.html's
 * DEFAULTS_W1 object. See scripts/generate-legacy-seed.mjs for exactly how
 * every field was reconstructed into real participant/feedback/question
 * rows, and webinar.importInfo.reconstructionNotes for the documented
 * discrepancies against the original two sources.
 */
export const legacyWebinar1 = webinar1Seed as unknown as Webinar;
