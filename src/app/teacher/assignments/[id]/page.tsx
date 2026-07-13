import Link from "next/link";
import type { AiCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";
import { AutoRefresh } from "../../auto-refresh";

function testsPassed(testResults: unknown): { passed: number; total: number } {
  const arr = Array.isArray(testResults) ? (testResults as { passed: boolean }[]) : [];
  return { passed: arr.filter((t) => t.passed).length, total: arr.length };
}

const CATEGORY: Record<string, { label: string; color: string; bg: string }> = {
  LOW_RISK: { label: "низкий риск", color: "#0d7a2b", bg: "#e4f8e9" },
  NEEDS_REVIEW: { label: "нужна проверка", color: "#b32020", bg: "#fde8e8" },
  INSUFFICIENT_EVIDENCE: { label: "мало данных", color: "#8a6d00", bg: "#fbf3d8" },
};

export default async function AssignmentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  const { category, q } = await searchParams;

  const assignment = await prisma.assignment.findUniqueOrThrow({ where: { id } });

  const baseWhere = {
    assignmentId: id,
    ...(q ? { studentName: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const grouped = await prisma.submission.groupBy({
    by: ["aiCategory"],
    where: baseWhere,
    _count: { _all: true },
  });
  const countOf = (c: string) => grouped.find((g) => g.aiCategory === c)?._count._all ?? 0;
  const total = grouped.reduce((s, g) => s + g._count._all, 0);

  const submissions = await prisma.submission.findMany({
    where: { ...baseWhere, ...(category ? { aiCategory: category as AiCategory } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const anyProcessing = submissions.some((s) => s.status !== "DONE" && s.status !== "ERROR");
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

  const filters = [
    { key: "", label: "Все", n: total },
    { key: "LOW_RISK", label: "низкий риск", n: countOf("LOW_RISK") },
    { key: "NEEDS_REVIEW", label: "нужна проверка", n: countOf("NEEDS_REVIEW") },
    { key: "INSUFFICIENT_EVIDENCE", label: "мало данных", n: countOf("INSUFFICIENT_EVIDENCE") },
  ];

  return (
    <main className="page stack" style={{ gap: 20 }}>
      <AutoRefresh active={anyProcessing} />
      <Link href="/teacher" className="crumb">← задания</Link>

      <section className="hero">
        <span className="label" style={{ color: "var(--green)" }}>задание · {assignment.language}</span>
        <h1>{assignment.title}</h1>
        <p className="sub">{assignment.description}</p>
      </section>

      <div className="spread">
        <div className="row">
          {filters.map((f) => {
            const active = (category ?? "") === f.key;
            const href = f.key
              ? `/teacher/assignments/${id}?category=${f.key}${qParam}`
              : `/teacher/assignments/${id}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
            return (
              <Link
                key={f.key || "all"}
                href={href}
                className={active ? "btn btn-dark" : "btn btn-ghost"}
                style={{ padding: "8px 14px", fontSize: 12 }}
              >
                {f.label} · {f.n}
              </Link>
            );
          })}
        </div>
        <a href={`/teacher/assignments/${id}/export`} className="btn btn-green" style={{ padding: "8px 16px", fontSize: 13 }}>
          ⬇ CSV
        </a>
      </div>

      <form method="get" className="row" style={{ gap: 8 }}>
        <input name="q" defaultValue={q ?? ""} placeholder="поиск по студенту…" style={{ maxWidth: 280 }} />
        <button type="submit" className="btn btn-ghost">Найти</button>
        {q && <Link href={`/teacher/assignments/${id}`} className="crumb">сбросить</Link>}
      </form>

      {submissions.length === 0 ? (
        <div className="card muted">Решений не найдено.</div>
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
                        <span className="badge" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
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
