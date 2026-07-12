import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1rem", textAlign: "center" }}>
      <h1>InnoCode</h1>
      <p>Auto-graded code submissions with AI review.</p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 24 }}>
        <Link href="/submit">Submit a solution</Link>
        <Link href="/teacher">Teacher dashboard</Link>
      </div>
    </main>
  );
}
