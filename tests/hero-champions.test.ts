import { describe, it, expect } from "vitest";
import { HERO_CHAMPIONS } from "@/lib/awards/hero-champions";

describe("HERO_CHAMPIONS (official award list)", () => {
  it("has exactly 3 confirmed recipients, no duplicates", () => {
    expect(HERO_CHAMPIONS).toHaveLength(3);
    const names = HERO_CHAMPIONS.map((h) => h.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("never includes an ECADIN/BRIN/Kemenkeu organizer by name, as a guard against pasting a panitia into the award list", () => {
    const EXCLUDE_PATTERN = /\becadin\b|\bbrin\b|\bkemenkeu\b/i;
    for (const h of HERO_CHAMPIONS) {
      expect(EXCLUDE_PATTERN.test(h.name)).toBe(false);
      expect(EXCLUDE_PATTERN.test(h.unit)).toBe(false);
    }
  });

  it("every entry has a name and a unit", () => {
    for (const h of HERO_CHAMPIONS) {
      expect(h.name.trim().length).toBeGreaterThan(0);
      expect(h.unit.trim().length).toBeGreaterThan(0);
    }
  });
});
