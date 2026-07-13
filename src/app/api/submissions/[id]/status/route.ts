import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { studentFacingError } from "@/lib/pipeline/errors";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      assignment: { select: { title: true, language: true } },
      flags: true,
    },
  });
  if (!submission) return NextResponse.json({ error: "not found" }, { status: 404 });

  const results = Array.isArray(submission.testResults)
    ? (submission.testResults as { passed: boolean }[])
    : [];

  return NextResponse.json({
    status: submission.status,
    studentName: submission.studentName,
    assignmentTitle: submission.assignment.title,
    language: submission.assignment.language,
    aiCategory: submission.aiCategory,
    errorMessage: studentFacingError(submission.errorMessage),
    testsPassed: results.filter((r) => r.passed).length,
    testsTotal: results.length,
    flags: submission.flags.map((f) => ({
      criterion: f.criterion,
      verdict: f.verdict,
      explanation: f.explanation,
    })),
  });
}
