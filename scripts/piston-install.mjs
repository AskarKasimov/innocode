// Installs a broad set of popular language runtimes into Piston.
// Versions are not hardcoded — for each wanted language we ask Piston which
// versions it offers and install the newest. Failures are tolerated so one bad
// package never aborts the rest. Runs against PISTON_URL (default piston:2000).
// Node 20+ (global fetch). No dependencies.

const BASE = process.env.PISTON_URL || "http://piston:2000";

const WANT = new Set([
  "python", "javascript", "typescript",
  "c", "cpp", "csharp",
  "java", "kotlin", "scala",
  "go", "rust", "swift",
  "ruby", "php", "perl", "lua",
  "bash", "dart",
]);

function newestFirst(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pb[i] || 0) - (pa[i] || 0);
    if (d) return d;
  }
  return 0;
}

async function main() {
  const res = await fetch(`${BASE}/api/v2/packages`);
  if (!res.ok) throw new Error(`GET /packages failed: ${res.status}`);
  const packages = await res.json(); // [{ language, language_version, installed }]

  const byLang = new Map();
  for (const p of packages) {
    if (!WANT.has(p.language)) continue;
    if (!byLang.has(p.language)) byLang.set(p.language, []);
    byLang.get(p.language).push(p);
  }

  for (const [lang, list] of byLang) {
    const best = list.sort((a, b) => newestFirst(a.language_version, b.language_version))[0];
    if (best.installed) {
      console.log(`skip     ${lang} ${best.language_version} (already installed)`);
      continue;
    }
    try {
      const r = await fetch(`${BASE}/api/v2/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, version: best.language_version }),
      });
      console.log(`${r.ok ? "installed" : `FAILED ${r.status}`} ${lang} ${best.language_version}`);
    } catch (e) {
      console.log(`error    ${lang}: ${e.message}`);
    }
  }
  console.log("piston-install: done");
}

main().catch((e) => {
  console.error("piston-install failed:", e.message);
  process.exit(1);
});
