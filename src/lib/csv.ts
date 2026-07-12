export interface CsvRow {
  student: string;
  assignment: string;
  testsPassed: number;
  testsTotal: number;
  category: string;
  flagsSummary: string;
  teacherDecision: string;
}

const HEADER = [
  "student",
  "assignment",
  "tests passed",
  "category",
  "flags summary",
  "teacher decision",
];

function escapeField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateSubmissionsCsv(rows: CsvRow[]): string {
  const lines = [HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.student,
        r.assignment,
        `${r.testsPassed}/${r.testsTotal}`,
        r.category,
        r.flagsSummary,
        r.teacherDecision,
      ]
        .map((f) => escapeField(String(f)))
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}
