import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { generateSubmissionsCsv, type CsvRow } from "@/lib/csv";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isTeacher())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const assignment = await prisma.assignment.findUniqueOrThrow({ where: { id } });
  const submissions = await prisma.submission.findMany({
    where: { assignmentId: id },
    include: { flags: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: CsvRow[] = submissions.map((s) => {
    const results = Array.isArray(s.testResults) ? (s.testResults as { passed: boolean }[]) : [];
    return {
      student: s.studentName,
      assignment: assignment.title,
      testsPassed: results.filter((r) => r.passed).length,
      testsTotal: results.length,
      category: s.aiCategory ?? "",
      flagsSummary: s.flags
        .filter((f) => f.verdict !== "OK")
        .map((f) => `${f.criterion}: ${f.verdict}`)
        .join("; "),
      teacherDecision: s.teacherDecision,
    };
  });

  const csv = generateSubmissionsCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="assignment-${id}.csv"`,
    },
  });
}
