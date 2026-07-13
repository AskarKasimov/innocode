import Link from "next/link";
import { ResultView } from "./result-view";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="page-narrow stack">
      <Link href="/submit" className="crumb">
        ← новая сдача
      </Link>
      <ResultView id={id} />
    </main>
  );
}
