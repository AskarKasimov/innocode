"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function setDecision(submissionId: string, decision: "APPROVED" | "DECLINED") {
  await requireTeacher();
  await prisma.submission.update({
    where: { id: submissionId },
    data: { teacherDecision: decision },
  });
  revalidatePath(`/teacher/submissions/${submissionId}`);
}
