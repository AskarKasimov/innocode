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
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <p><Link href="/">← Home</Link></p>
      <h1>Submit your solution</h1>
      {assignments.length === 0 && <p>No assignments available yet — check back later.</p>}
      <SubmitForm assignments={assignments} />
    </main>
  );
}
