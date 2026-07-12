import { describe, expect, it } from "vitest";
import { llmResponseSchema, parseLlmResponse } from "../llm/types";

describe("llmResponseSchema", () => {
  it("accepts a valid response", () => {
    const raw = {
      flags: [
        { criterion: "Uses iteration", verdict: "ok", codeSnippet: "for i in range(n):", explanation: "loops" },
        { criterion: "No banned libs", verdict: "violation", codeSnippet: "import numpy", explanation: "banned" },
      ],
    };
    const parsed = llmResponseSchema.parse(raw);
    expect(parsed.flags).toHaveLength(2);
  });

  it("rejects unknown verdict", () => {
    const raw = { flags: [{ criterion: "x", verdict: "maybe", codeSnippet: "", explanation: "" }] };
    expect(() => llmResponseSchema.parse(raw)).toThrow();
  });

  it("parseLlmResponse extracts JSON from fenced content", () => {
    const content = '```json\n{"flags":[{"criterion":"c","verdict":"insufficient_evidence","codeSnippet":"","explanation":"e"}]}\n```';
    const parsed = parseLlmResponse(content);
    expect(parsed.flags[0].verdict).toBe("insufficient_evidence");
  });
});
