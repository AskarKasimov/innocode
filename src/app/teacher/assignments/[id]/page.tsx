import Link from "next/link";
import type { AiCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

function testsPassed(testResults: unknown): { passed: number; total: number } {
  const arr = Array.isArray(testResults) ? (testResults as { passed: boolean }[]) : [];
  return { passed: arr.filter((t) => t.passed).length, total: arr.length };
}

const CATEGORY: Record<string, { label: string; color: string; bg: string }> = {
  LOW_RISK: { label: "низкий риск", color: "#0d7a2b", bg: "#e4f8e9" },
  NEEDS_REVIEW: { label: "нужна проверка", color: "#b32020", bg: "#fde8e8" },
  INSUFFICIENT_EVIDENCE: { label: "мало данных", color: "#8a6d00", bg: "#fbf3d8" },
};

const FILTERS = [
  { key: "", label: "Все" },
  { key: "LOW_RISK", label: "Низкий риск" },
  { key: "NEEDS_REVIEW", label: "Нужна проверка" },
  { key: "INSUFFICIENT_EVIDENCE", label: "Мало данных" },
];

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
    <main className="page stack" style={{ gap: 20 }}>
      <Link href="/teacher" className="crumb">← задания</Link>

      <section className="hero">
        <span className="label" style={{ color: "var(--green)" }}>задание · {assignment.language}</span>
        <h1>{assignment.title}</h1>
        <p className="sub">{assignment.description}</p>
      </section>

      <div className="spread">
        <div className="row">
          {FILTERS.map((f) => {
            const active = (category ?? "") === f.key;
            const href = f.key ? `/teacher/assignments/${id}?category=${f.key}` : `/teacher/assignments/${id}`;
            return (
              <Link
                key={f.key || "all"}
                href={href}
                className={active ? "btn btn-dark" : "btn btn-ghost"}
                style={{ padding: "8px 14px", fontSize: 12 }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <a href={`/teacher/assignments/${id}/export`} className="btn btn-green" style={{ padding: "8px 16px", fontSize: 13 }}>
          ⬇ CSV
        </a>
      </div>

      {submissions.length === 0 ? (
        <div className="card muted">Решений пока нет.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Тесты</th>
                <th>Категория</th>
                <th>Решение</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const t = testsPassed(s.testResults);
                const cat = s.aiCategory ? CATEGORY[s.aiCategory] : null;
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                    <td>
                      {s.status === "DONE" || s.status === "ANALYZING"
                        ? `${t.passed}/${t.total}`
                        : <span className="faint">{s.status}</span>}
                    </td>
                    <td>
                      {cat ? (
                        <span className="badge" style={{ background: cat.bg, color: cat.color }}>
                          {cat.label}
                        </span>
                      ) : (
                        <span className="faint">—</span>
                      )}
                    </td>
                    <td>
                      <span className="muted">{s.teacherDecision === "NONE" ? "—" : s.teacherDecision}</span>
                    </td>
                    <td>
                      <Link href={`/teacher/submissions/${s.id}`} className="link">открыть →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
