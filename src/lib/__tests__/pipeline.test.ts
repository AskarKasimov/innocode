import { describe, expect, it, vi } from "vitest";
import { processSubmission, type PipelineDeps } from "../pipeline/process";

function makeDeps(overrides: Partial<PipelineDeps> = {}): {
  deps: PipelineDeps;
  updates: Record<string, unknown>[];
  createdFlags: Record<string, unknown>[];
} {
  const updates: Record<string, unknown>[] = [];
  const createdFlags: Record<string, unknown>[] = [];
  const submission = {
    id: "s1",
    sourceCode: "print(1)",
    assignment: { language: "python", criteria: ["Uses iteration"], tests: [{ stdin: "", expectedStdout: "1" }] },
  };
  const deps: PipelineDeps = {
    prisma: {
      submission: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(submission),
        update: vi.fn().mockImplementation(({ data }) => {
          updates.push(data);
          return Promise.resolve({});
        }),
      },
      flag: {
        createMany: vi.fn().mockImplementation(({ data }) => {
          createdFlags.push(...data);
          return Promise.resolve({});
        }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock only implements the 2 methods the pipeline calls, not the full Prisma delegate
    } as any,
    runner: {
      runTests: vi.fn().mockResolvedValue([
        { stdin: "", expectedStdout: "1", actualStdout: "1", passed: true, statusDescription: "OK" },
      ]),
    },
    llm: {
      analyze: vi.fn().mockResolvedValue({
        flags: [{ criterion: "Uses iteration", verdict: "ok", codeSnippet: "print(1)", explanation: "ok" }],
      }),
    },
    ...overrides,
  };
  return { deps, updates, createdFlags };
}

describe("processSubmission", () => {
  it("walks TESTING -> ANALYZING -> DONE and derives LOW_RISK", async () => {
    const { deps, updates } = makeDeps();
    await processSubmission("s1", deps);
    const statuses = updates.map((u) => u.status).filter(Boolean);
    expect(statuses).toEqual(["TESTING", "ANALYZING", "DONE"]);
    const done = updates.find((u) => u.status === "DONE")!;
    expect(done.aiCategory).toBe("LOW_RISK");
  });

  it("sets ERROR + errorMessage when the code runner throws", async () => {
    const { deps, updates } = makeDeps({
      runner: { runTests: vi.fn().mockRejectedValue(new Error("boom")) },
    });
    await processSubmission("s1", deps);
    const last = updates[updates.length - 1];
    expect(last.status).toBe("ERROR");
    expect(last.errorMessage).toContain("boom");
  });

  it("derives NEEDS_REVIEW when a flag is a violation", async () => {
    const { deps, updates } = makeDeps({
      llm: {
        analyze: vi.fn().mockResolvedValue({
          flags: [{ criterion: "c", verdict: "violation", codeSnippet: "x", explanation: "e" }],
        }),
      },
    });
    await processSubmission("s1", deps);
    const done = updates.find((u) => u.status === "DONE")!;
    expect(done.aiCategory).toBe("NEEDS_REVIEW");
  });
});
