import { describe, expect, it } from "vitest";
import { generateSubmissionsCsv, type CsvRow } from "../csv";

const rows: CsvRow[] = [
  {
    student: "Alice",
    assignment: "Sorting",
    testsPassed: 5,
    testsTotal: 7,
    category: "NEEDS_REVIEW",
    flagsSummary: "Uses recursion: VIOLATION",
    teacherDecision: "NONE",
  },
  {
    student: 'Bob "the builder"',
    assignment: "Sorting, advanced",
    testsPassed: 7,
    testsTotal: 7,
    category: "LOW_RISK",
    flagsSummary: "",
    teacherDecision: "APPROVED",
  },
];

describe("generateSubmissionsCsv", () => {
  it("emits header + rows with X/Y tests", () => {
    const csv = generateSubmissionsCsv(rows);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(
      "student,assignment,tests passed,category,flags summary,teacher decision",
    );
    expect(lines[1]).toContain("5/7");
    expect(lines[1]).toContain("Alice");
  });

  it("escapes quotes and commas per RFC4180", () => {
    const csv = generateSubmissionsCsv(rows);
    expect(csv).toContain('"Bob ""the builder"""');
    expect(csv).toContain('"Sorting, advanced"');
  });

  it("handles empty input (header only)", () => {
    const csv = generateSubmissionsCsv([]);
    expect(csv.trim().split("\n")).toHaveLength(1);
  });
});
