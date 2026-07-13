import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";
import { DecisionButtons } from "./decision-buttons";

const CATEGORY: Record<string, { label: string; color: string; bg: string }> = {
  LOW_RISK: { label: "низкий риск", color: "#0d7a2b", bg: "#e4f8e9" },
  NEEDS_REVIEW: { label: "нужна проверка", color: "#b32020", bg: "#fde8e8" },
  INSUFFICIENT_EVIDENCE: { label: "мало данных", color: "#8a6d00", bg: "#fbf3d8" },
};

const VERDICT: Record<string, { label: string; color: string; bg: string }> = {
  OK: { label: "ok", color: "#0d7a2b", bg: "#e4f8e9" },
  VIOLATION: { label: "нарушение", color: "#b32020", bg: "#fde8e8" },
  INSUFFICIENT_EVIDENCE: { label: "мало данных", color: "#8a6d00", bg: "#fbf3d8" },
};

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
  const cat = submission.aiCategory ? CATEGORY[submission.aiCategory] : null;

  return (
    <main className="page stack" style={{ gap: 20 }}>
      <Link href={`/teacher/assignments/${submission.assignmentId}`} className="crumb">
        ← {submission.assignment.title}
      </Link>

      <section className="hero">
        <span className="label" style={{ color: "var(--green)" }}>решение · {submission.assignment.language}</span>
        <h1>{submission.studentName}</h1>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="badge badge-dark">статус: {submission.status.toLowerCase()}</span>
          {cat && <span className="badge" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>}
        </div>
      </section>

      {submission.errorMessage && (
        <div className="card" style={{ borderColor: "#e6b0b0", background: "#fdf0f0", color: "#b32020" }}>
          <span className="label" style={{ color: "#b32020" }}>ошибка обработки</span>
          <p className="mono" style={{ marginTop: 6 }}>{submission.errorMessage}</p>
        </div>
      )}

      <div className="card">
        <DecisionButtons id={submission.id} current={submission.teacherDecision} />
      </div>

      <section className="stack" style={{ gap: 10 }}>
        <span className="label">💻 код</span>
        <pre className="pre"><code>{submission.sourceCode}</code></pre>
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <span className="label">🧪 тесты · {results.filter((r) => r.passed).length}/{results.length}</span>
        {results.length === 0 ? (
          <div className="card muted">Результатов тестов нет.</div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {results.map((r, i) => (
              <div key={i} className="card card-tight row" style={{ justifyContent: "space-between" }}>
                <span className="mono">
                  {r.passed ? "✅" : "❌"} тест {i + 1} · {r.statusDescription}
                </span>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  ждали <code>{r.expectedStdout}</code> · получили <code>{r.actualStdout || "∅"}</code>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <span className="label">🚩 флаги AI · {submission.flags.length}</span>
        {submission.flags.length === 0 ? (
          <div className="card muted">Флагов нет.</div>
        ) : (
          submission.flags.map((f) => {
            const v = VERDICT[f.verdict];
            return (
              <div key={f.id} className="card stack" style={{ gap: 8 }}>
                <div className="spread">
                  <strong style={{ fontFamily: "var(--font-sans)" }}>{f.criterion}</strong>
                  <span className="badge" style={{ background: v.bg, color: v.color }}>{v.label}</span>
                </div>
                {f.codeSnippet && <pre className="pre"><code>{f.codeSnippet}</code></pre>}
                <p className="muted">{f.explanation}</p>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
