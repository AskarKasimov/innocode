"use server";

import { prisma } from "@/lib/db";
import { launchProcessing } from "@/lib/pipeline/launch";

export async function createSubmission(formData: FormData) {
  const studentName = String(formData.get("studentName") ?? "").trim();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const sourceCode = String(formData.get("sourceCode") ?? "");

  if (!studentName || !assignmentId || !sourceCode.trim()) {
    return { ok: false as const, error: "All fields are required." };
  }

  const submission = await prisma.submission.create({
    data: { studentName, assignmentId, sourceCode, status: "PENDING" },
  });

  launchProcessing(submission.id);
  return { ok: true as const, submissionId: submission.id };
}
