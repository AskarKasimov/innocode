import Link from "next/link";
import type { AiCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

function testsPassed(testResults: unknown): { passed: number; total: number } {
  const arr = Array.isArray(testResults) ? (testResults as { passed: boolean }[]) : [];
  return { passed: arr.filter((t) => t.passed).length, total: arr.length };
}

const CATEGORY_COLORS: Record<string, string> = {
  LOW_RISK: "#2e7d32",
  NEEDS_REVIEW: "#c62828",
  INSUFFICIENT_EVIDENCE: "#f9a825",
};

export default async function AssignmentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  const { category } = await searchParams;

  const assignment = await prisma.assignment.findUniqueOrThrow({ where: { id } });
  const submissions = await prisma.submission.findMany({
    where: { assignmentId: id, ...(category ? { aiCategory: category as AiCategory } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ maxWidth: 1024, margin: "2rem auto", padding: "0 1rem" }}>
      <p><Link href="/teacher">← Assignments</Link></p>
      <h1>{assignment.title}</h1>
      <p>
        Filter:{" "}
        <Link href={`/teacher/assignments/${id}`}>All</Link>{" | "}
        <Link href={`?category=LOW_RISK`}>Low risk</Link>{" | "}
        <Link href={`?category=NEEDS_REVIEW`}>Needs review</Link>{" | "}
        <Link href={`?category=INSUFFICIENT_EVIDENCE`}>Insufficient</Link>
      </p>
      <p><a href={`/teacher/assignments/${id}/export`}>Export CSV</a></p>
      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr><th>Student</th><th>Tests</th><th>Category</th><th>Decision</th><th></th></tr>
        </thead>
        <tbody>
          {submissions.map((s) => {
            const t = testsPassed(s.testResults);
            return (
              <tr key={s.id}>
                <td>{s.studentName}</td>
                <td>{s.status === "DONE" || s.status === "ANALYZING" ? `${t.passed}/${t.total}` : s.status}</td>
                <td style={{ color: s.aiCategory ? CATEGORY_COLORS[s.aiCategory] : undefined }}>
                  {s.aiCategory ?? "—"}
                </td>
                <td>{s.teacherDecision}</td>
                <td><Link href={`/teacher/submissions/${s.id}`}>Open</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
