import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { readWorkbookFile } from "@/lib/excel/workbook-parser";
import { parseCanonicalWorkbook } from "@/lib/excel/canonical-template-adapter";

const FIXTURE_PATH = path.resolve(__dirname, "..", "fixtures", "sample-webinar-4.xlsx");

async function loadFixture() {
  const buffer = readFileSync(FIXTURE_PATH);
  const file = new File([buffer], "sample-webinar-4.xlsx");
  return readWorkbookFile(file);
}

describe("parseCanonicalWorkbook (synthetic fixture, no real PII)", () => {
  it("detects the Participants sheet, reads Metadata, and dedups/flags issues as designed into the fixture", async () => {
    const workbook = await loadFixture();
    const parsed = parseCanonicalWorkbook(workbook, { attendanceThresholdMinutes: 30 });

    expect(parsed.adapter).toBe("canonical-template");
    expect(parsed.metadata.id).toBe("w4");
    expect(parsed.metadata.title).toContain("Webinar 4");

    // Fixture has 27 raw rows: 24 base + 1 duplicate + 1 bad-score + 1 no-identity.
    expect(parsed.rawRowCount).toBe(27);
    expect(parsed.duplicateRowCount).toBe(1);
    expect(parsed.validRowCount).toBe(26);

    const codes = parsed.issues.map((i) => i.code);
    expect(codes).toContain("duplicates-found");
    expect(codes).toContain("score-out-of-range");
    expect(codes).toContain("feedback-out-of-range");
    expect(codes).toContain("extra-columns");

    // The row with no Email/NIP/Participant Key still has a unit, so it's
    // identified via the name+unit fallback (tier 4) rather than raising the
    // name-only warning (tier 5, exercised directly in participant-mapper.test.ts).
    const noIdentityParticipant = parsed.participants.find((p) => p.identityKeySource === "name-unit");
    expect(noIdentityParticipant).toBeDefined();

    expect(parsed.issues.some((i) => i.level === "error")).toBe(false);
  });

  it("reads the Questions sheet", async () => {
    const workbook = await loadFixture();
    const parsed = parseCanonicalWorkbook(workbook);
    expect(parsed.questions.length).toBeGreaterThan(0);
    expect(parsed.questions[0].question.length).toBeGreaterThan(0);
  });

  it("splits Likert vs open-text feedback columns automatically by majority-numeric rule", async () => {
    const workbook = await loadFixture();
    const parsed = parseCanonicalWorkbook(workbook);
    const likert = parsed.feedback.filter((f) => f.type === "likert");
    const text = parsed.feedback.filter((f) => f.type === "text");
    expect(likert.length).toBeGreaterThan(0);
    expect(text.length).toBeGreaterThan(0);
  });
});
