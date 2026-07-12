import Link from "next/link";
import { prisma } from "@/lib/db";
import { isTeacher } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { AssignmentForm } from "./assignment-form";

export default async function TeacherPage() {
  if (!(await isTeacher())) {
    return (
      <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
        <h1>Teacher login</h1>
        <LoginForm />
      </main>
    );
  }
  const assignments = await prisma.assignment.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Assignments</h1>
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
