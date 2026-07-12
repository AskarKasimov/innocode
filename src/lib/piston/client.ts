import { env } from "@/lib/env";
import type { CodeRunner, RunTestsInput, TestResult, TestCase } from "./types";

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

interface PistonExecuteResponse {
  run: { stdout: string; stderr: string; code: number | null; signal: string | null };
  compile?: { stdout: string; stderr: string; code: number | null };
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\s+$/g, "");
}

export class PistonClient implements CodeRunner {
  constructor(private baseUrl: string = env.PISTON_URL) {}

  async runTests({ sourceCode, language, tests }: RunTestsInput): Promise<TestResult[]> {
    if (tests.length === 0) return [];
    const version = await this.resolveVersion(language);
    return Promise.all(tests.map((t) => this.runOne(language, version, sourceCode, t)));
  }

  private async resolveVersion(language: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v2/runtimes`);
    if (!res.ok) throw new Error(`Piston runtimes request failed: ${res.status}`);
    const runtimes: PistonRuntime[] = await res.json();
    const match = runtimes.find((r) => r.language === language || r.aliases.includes(language));
    if (!match) throw new Error(`Piston has no installed runtime for language "${language}"`);
    return match.version;
  }

  private async runOne(
    language: string,
    version: string,
    sourceCode: string,
    test: TestCase,
  ): Promise<TestResult> {
    const res = await fetch(`${this.baseUrl}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version,
        files: [{ content: sourceCode }],
        stdin: test.stdin,
      }),
    });
    if (!res.ok) throw new Error(`Piston execute failed: ${res.status} ${await res.text()}`);
    const body: PistonExecuteResponse = await res.json();

    if (body.compile && body.compile.code !== 0) {
      return {
        stdin: test.stdin,
        expectedStdout: test.expectedStdout,
        actualStdout: "",
        passed: false,
        statusDescription: `Compile Error: ${body.compile.stderr || body.compile.stdout}`.slice(0, 500),
      };
    }

    const actual = normalize(body.run.stdout ?? "");
    const expected = normalize(test.expectedStdout);
    const passed = body.run.code === 0 && actual === expected;
    const statusDescription =
      body.run.code === 0
        ? "OK"
        : body.run.signal
          ? `Runtime Error (signal ${body.run.signal})`
          : `Runtime Error (exit ${body.run.code})`;

    return {
      stdin: test.stdin,
      expectedStdout: test.expectedStdout,
      actualStdout: actual,
      passed,
      statusDescription,
    };
  }
}
