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
      <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
        <p><Link href="/">← Home</Link></p>
        <h1>Teacher login</h1>
        <LoginForm />
      </main>
    );
  }
  const assignments = await prisma.assignment.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Assignments</h1>
        <form action={logout}>
          <button type="submit">Log out</button>
        </form>
      </div>
      <ul>
        {assignments.map((a) => (
          <li key={a.id}>
            <Link href={`/teacher/assignments/${a.id}`}>{a.title}</Link>
          </li>
        ))}
      </ul>
      <h2>Create assignment</h2>
      <AssignmentForm />
    </main>
  );
}
