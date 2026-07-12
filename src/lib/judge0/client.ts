import { env } from "@/lib/env";
import type { Judge0Client, RunTestsInput, TestResult, TestCase } from "./types";

interface Judge0BatchResult {
  stdout: string | null;
  status: { id: number; description: string };
}

function normalize(s: string | null): string {
  return (s ?? "").replace(/\r\n/g, "\n").replace(/\s+$/g, "");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class HttpJudge0Client implements Judge0Client {
  constructor(private baseUrl: string = env.JUDGE0_URL) {}

  async runTests({ sourceCode, languageId, tests }: RunTestsInput): Promise<TestResult[]> {
    if (tests.length === 0) return [];

    const submissions = tests.map((t) => ({
      source_code: sourceCode,
      language_id: languageId,
      stdin: t.stdin,
      expected_output: t.expectedStdout,
    }));

    const createRes = await fetch(
      `${this.baseUrl}/submissions/batch?base64_encoded=false&wait=false`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions }),
      },
    );
    if (!createRes.ok) throw new Error(`Judge0 create failed: ${createRes.status}`);
    const created: { token: string }[] = await createRes.json();
    const tokens = created.map((c) => c.token).join(",");

    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await fetch(
        `${this.baseUrl}/submissions/batch?tokens=${tokens}&base64_encoded=false&fields=stdout,status`,
      );
      if (!res.ok) throw new Error(`Judge0 poll failed: ${res.status}`);
      const body: { submissions: Judge0BatchResult[] } = await res.json();
      const pending = body.submissions.some((s) => s.status.id === 1 || s.status.id === 2);
      if (!pending) {
        return body.submissions.map((s, i) => this.toResult(tests[i], s));
      }
      await sleep(1000);
    }
    throw new Error("Judge0 timed out waiting for results");
  }

  private toResult(test: TestCase, s: Judge0BatchResult): TestResult {
    const actual = normalize(s.stdout);
    return {
      stdin: test.stdin,
      expectedStdout: test.expectedStdout,
      actualStdout: actual,
      passed: s.status.id === 3,
      statusDescription: s.status.description,
    };
  }
}
