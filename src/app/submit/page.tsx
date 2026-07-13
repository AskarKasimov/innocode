import Link from "next/link";
import { prisma } from "@/lib/db";
import { SubmitForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const assignments = await prisma.assignment.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-narrow stack">
      <Link href="/" className="crumb">← на главную</Link>
      <div>
        <span className="label">студент</span>
        <h1 style={{ fontSize: 30, marginTop: 6 }}>Отправить решение</h1>
      </div>
      {assignments.length === 0 ? (
        <div className="card muted">Пока нет доступных заданий — загляни позже.</div>
      ) : (
        <SubmitForm assignments={assignments} />
      )}
    </main>
  );
}
