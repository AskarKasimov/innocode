import { prisma } from "@/lib/db";
import { SubmitForm } from "./submit-form";

export default async function SubmitPage() {
  const assignments = await prisma.assignment.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Submit your solution</h1>
      <SubmitForm assignments={assignments} />
    </main>
  );
}
