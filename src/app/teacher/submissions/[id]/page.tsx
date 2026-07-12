import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";
import { DecisionButtons } from "./decision-buttons";

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id },
    include: { assignment: true, flags: true },
  });
  const results = Array.isArray(submission.testResults)
    ? (submission.testResults as { passed: boolean; statusDescription: string; expectedStdout: string; actualStdout: string }[])
    : [];

  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <p><Link href={`/teacher/assignments/${submission.assignmentId}`}>← {submission.assignment.title}</Link></p>
      <h1>{submission.studentName} — {submission.assignment.title}</h1>
      <p>Status: {submission.status} · Category: {submission.aiCategory ?? "—"}</p>
      {submission.errorMessage && <p style={{ color: "crimson" }}>Error: {submission.errorMessage}</p>}

      <DecisionButtons id={submission.id} current={submission.teacherDecision} />

      <h2>Code</h2>
      <pre style={{ background: "#f5f5f5", padding: 12, overflow: "auto" }}><code>{submission.sourceCode}</code></pre>

      <h2>Tests</h2>
      <ol>
        {results.map((r, i) => (
          <li key={i}>{r.passed ? "✅" : "❌"} {r.statusDescription} — expected <code>{r.expectedStdout}</code>, got <code>{r.actualStdout}</code></li>
        ))}
      </ol>

      <h2>Flags</h2>
      {submission.flags.map((f) => (
        <div key={f.id} style={{ borderLeft: "3px solid #ccc", paddingLeft: 12, marginBottom: 12 }}>
          <strong>{f.criterion}</strong> — {f.verdict}
          <pre style={{ background: "#fafafa", padding: 8 }}><code>{f.codeSnippet}</code></pre>
          <p>{f.explanation}</p>
        </div>
      ))}
    </main>
  );
}
