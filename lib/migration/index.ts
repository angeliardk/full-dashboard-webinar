import type { Webinar } from "@/types/webinar";
import { legacyWebinar1 } from "./legacy-html-data";
import { legacyWebinar2 } from "./legacy-next-data";
import webinar3Seed from "./seed/webinar-3.json";
import webinar4Seed from "./seed/webinar-4.json";

/**
 * Webinar 3 & 4, baked in from real uploads (not a legacy reconstruction
 * like W1/W2) so every fresh visitor sees them without re-uploading the
 * Excel files. Contact-identifying fields (email/NIP/phone) and raw import
 * audit rows were stripped before these files were committed — see
 * webinar.participants, every entry has email/nip/phone: null.
 */
const legacyWebinar3 = webinar3Seed as unknown as Webinar;
const legacyWebinar4 = webinar4Seed as unknown as Webinar;

/** Seed data used only the very first time the app runs (empty IndexedDB). */
export function getSeedWebinars(): Webinar[] {
  return [legacyWebinar1, legacyWebinar2, legacyWebinar3, legacyWebinar4];
}
