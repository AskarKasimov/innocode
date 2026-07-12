import { prisma } from "@/lib/db";
import { HttpJudge0Client } from "@/lib/judge0/client";
import { OpenAiCompatibleLlmClient } from "@/lib/llm/client";
import { processSubmission } from "./process";

export function launchProcessing(submissionId: string): void {
  const deps = {
    prisma,
    judge0: new HttpJudge0Client(),
    llm: new OpenAiCompatibleLlmClient(),
  };
  // Intentionally not awaited: MVP in-process background work.
  void processSubmission(submissionId, deps).catch((err) => {
    console.error(`processSubmission(${submissionId}) failed hard:`, err);
  });
}
