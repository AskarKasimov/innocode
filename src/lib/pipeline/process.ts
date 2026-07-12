import type { PrismaClient } from "@prisma/client";
import { deriveCategory, type FlagVerdictValue } from "@/lib/category";
import type { Judge0Client } from "@/lib/judge0/types";
import type { LlmClient } from "@/lib/llm/types";

export interface PipelineDeps {
  prisma: Pick<PrismaClient, "submission" | "flag"> | any;
  judge0: Judge0Client;
  llm: LlmClient;
}

const VERDICT_MAP: Record<string, FlagVerdictValue> = {
  ok: "OK",
  violation: "VIOLATION",
  insufficient_evidence: "INSUFFICIENT_EVIDENCE",
};

export async function processSubmission(submissionId: string, deps: PipelineDeps): Promise<void> {
  const { prisma, judge0, llm } = deps;
  try {
    const submission = await prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { assignment: true },
    });
    const assignment = submission.assignment;
    const criteria = assignment.criteria as string[];
    const tests = assignment.tests as { stdin: string; expectedStdout: string }[];

    await prisma.submission.update({ where: { id: submissionId }, data: { status: "TESTING" } });
    const testResults = await judge0.runTests({
      sourceCode: submission.sourceCode,
      languageId: assignment.language,
      tests,
    });
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "ANALYZING", testResults },
    });

    const llmResponse = await llm.analyze({
      sourceCode: submission.sourceCode,
      language: assignment.language,
      criteria,
      testResults: testResults.map((t) => ({ passed: t.passed, statusDescription: t.statusDescription })),
    });

    const flags = llmResponse.flags.map((f) => ({
      submissionId,
      criterion: f.criterion,
      verdict: VERDICT_MAP[f.verdict],
      codeSnippet: f.codeSnippet,
      explanation: f.explanation,
    }));
    if (flags.length > 0) await prisma.flag.createMany({ data: flags });

    const aiCategory = deriveCategory(flags.map((f) => ({ verdict: f.verdict })));

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "DONE", aiCategory },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await deps.prisma.submission.update({
      where: { id: submissionId },
      data: { status: "ERROR", errorMessage: message },
    });
  }
}
