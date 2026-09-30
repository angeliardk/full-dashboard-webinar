import { describe, it, expect } from "vitest";
import {
  cleanString,
  isEmptyish,
  normalizeEmail,
  normalizeHeaderKey,
  parseBoolean,
  parseIdentifierString,
  parseNumber,
  parseTimestamp,
} from "@/lib/excel/header-normalizer";

describe("normalizeHeaderKey", () => {
  it("trims, lowercases, and collapses whitespace/punctuation", () => {
    expect(normalizeHeaderKey("  Hadir Zoom >30m?  ")).toBe(normalizeHeaderKey("hadir zoom >30m"));
    expect(normalizeHeaderKey("Nama")).toBe("nama");
    expect(normalizeHeaderKey("Skor   Pre   Final")).toBe("skor pre final");
  });
});

describe("isEmptyish / cleanString", () => {
  it.each(["", "-", "N/A", "null", "NaN", undefined, null])("treats %s as empty", (v) => {
    expect(isEmptyish(v)).toBe(true);
    expect(cleanString(v)).toBeNull();
  });

  it("keeps real strings and trims them", () => {
    expect(cleanString("  PLN Pusat  ")).toBe("PLN Pusat");
  });
});

describe("parseBoolean", () => {
  it.each([
    ["Ya", true], ["ya", true], ["YES", true], ["yes", true], ["TRUE", true], ["1", true],
    ["Tidak", false], ["tidak", false], ["NO", false], ["FALSE", false], ["0", false],
  ])("parses %s -> %s", (input, expected) => {
    expect(parseBoolean(input)).toBe(expected);
  });

  it("returns null for unrecognized or empty values", () => {
    expect(parseBoolean("")).toBeNull();
    expect(parseBoolean("maybe")).toBeNull();
    expect(parseBoolean(null)).toBeNull();
  });

  it("treats numeric zero/non-zero as boolean", () => {
    expect(parseBoolean(0)).toBe(false);
    expect(parseBoolean(5)).toBe(true);
  });
});

describe("parseNumber", () => {
  it("parses plain numbers and numeric strings", () => {
    expect(parseNumber(87)).toBe(87);
    expect(parseNumber("87")).toBe(87);
    expect(parseNumber("87.5")).toBe(87.5);
  });

  it("returns null for empty/invalid values", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});

describe("parseIdentifierString (NIP/phone)", () => {
  it("never round-trips an integer-looking ID through float formatting", () => {
    expect(parseIdentifierString(198007202006041008)).not.toMatch(/e\+/);
    expect(parseIdentifierString("92171054ZY")).toBe("92171054ZY");
  });

  it("returns null for empty values", () => {
    expect(parseIdentifierString(null)).toBeNull();
    expect(parseIdentifierString("-")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases valid emails and rejects invalid ones", () => {
    expect(normalizeEmail("Contoh.Orang@PLN.CO.ID")).toBe("contoh.orang@pln.co.id");
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });
});

describe("parseTimestamp", () => {
  it("parses DD/MM/YYYY HH:mm:ss as WIB (UTC+7) and stores the correct UTC instant", () => {
    // These exports are quiz/form submission logs in WIB wall-clock time --
    // 14:20:29 WIB is 07:20:29 UTC, not 14:20:29 UTC.
    const iso = parseTimestamp("16/07/2026 14:20:29");
    expect(iso).toBe("2026-07-16T07:20:29.000Z");
    const d = new Date(iso as string);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(6); // July = index 6
    expect(d.getUTCDate()).toBe(16);
    expect(d.getUTCHours()).toBe(7);
  });

  it("rolls the UTC date back a day when the WIB time is before 07:00", () => {
    // 03:00 WIB on the 17th is 20:00 UTC on the 16th.
    const iso = parseTimestamp("17/07/2026 03:00:00");
    expect(iso).toBe("2026-07-16T20:00:00.000Z");
  });

  it("parses Indonesian text dates", () => {
    const iso = parseTimestamp("11 Juni 2026");
    expect(iso).not.toBeNull();
    const d = new Date(iso as string);
    expect(d.getMonth()).toBe(5); // June = index 5
  });

  it("parses Excel serial dates", () => {
    const iso = parseTimestamp(46000); // arbitrary serial date
    expect(iso).not.toBeNull();
  });

  it("returns null for empty values", () => {
    expect(parseTimestamp(null)).toBeNull();
    expect(parseTimestamp("")).toBeNull();
  });
});
