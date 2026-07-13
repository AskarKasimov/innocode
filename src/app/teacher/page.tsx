import Link from "next/link";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { AssignmentForm } from "./assignment-form";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  if (!(await isTeacher())) {
    return (
      <main className="page-narrow stack">
        <Link href="/" className="crumb">← на главную</Link>
        <div>
          <span className="label">преподаватель</span>
          <h1 style={{ fontSize: 30, marginTop: 6 }}>Вход в кабинет</h1>
        </div>
        <LoginForm />
      </main>
    );
  }
  const assignments = await prisma.assignment.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <main className="page stack" style={{ gap: 22 }}>
      <section className="hero">
        <div className="spread">
          <div>
            <span className="label" style={{ color: "var(--green)" }}>кабинет преподавателя</span>
            <h1>Задания</h1>
            <p className="sub">Создавай задания и ревьюй решения студентов.</p>
          </div>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost" style={{ background: "transparent", color: "#fff", borderColor: "#333" }}>
              ← Выйти
            </button>
          </form>
        </div>
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <div className="spread">
          <span className="label">📚 список заданий · {assignments.length}</span>
        </div>
        {assignments.length === 0 ? (
          <div className="card muted">Заданий пока нет — создай первое ниже.</div>
        ) : (
          <div className="grid-2">
            {assignments.map((a) => (
              <Link key={a.id} href={`/teacher/assignments/${a.id}`} className="card" style={{ display: "block" }}>
                <div className="spread" style={{ alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16 }}>
                    {a.title}
                  </div>
                  <span className="badge-dark badge">{a.language}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {a._count.submissions} решений · {(a.criteria as string[]).length} критериев
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <span className="label">➕ новое задание</span>
        <AssignmentForm />
      </section>
    </main>
  );
}
