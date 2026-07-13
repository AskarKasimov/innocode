import { env } from "@/lib/env";

// Distinct language names that Piston currently has installed. Used to populate
// the teacher's language selector so only runnable languages can be assigned.
// Returns [] on any failure — the caller decides on a fallback list.
export async function listInstalledLanguages(baseUrl: string = env.PISTON_URL): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/v2/runtimes`, { cache: "no-store" });
    if (!res.ok) return [];
    const runtimes: { language: string }[] = await res.json();
    return [...new Set(runtimes.map((r) => r.language))].sort();
  } catch {
    return [];
  }
}
