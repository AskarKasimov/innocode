import { prisma } from "@/lib/db";
import { PistonClient } from "@/lib/piston/client";
import { OpenAiCompatibleLlmClient } from "@/lib/llm/client";
import { processSubmission } from "./process";

export function launchProcessing(submissionId: string): void {
  const deps = {
    prisma,
    runner: new PistonClient(),
    llm: new OpenAiCompatibleLlmClient(),
  };
  // Intentionally not awaited: MVP in-process background work.
  void processSubmission(submissionId, deps).catch((err) => {
    console.error(`processSubmission(${submissionId}) failed hard:`, err);
  });
}
