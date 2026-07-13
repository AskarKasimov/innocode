import { describe, expect, it } from "vitest";
import { studentFacingError } from "../pipeline/errors";

describe("studentFacingError", () => {
  it("returns null for null/undefined/empty", () => {
    expect(studentFacingError(null)).toBeNull();
    expect(studentFacingError(undefined)).toBeNull();
    expect(studentFacingError("   ")).toBeNull();
  });

  it("maps runtime/language errors to a language hint", () => {
    const m = studentFacingError('Piston has no installed runtime for language "python"');
    expect(m).toContain("язык");
  });

  it("falls back to a generic message and never leaks internals", () => {
    const m = studentFacingError("LLM request failed: 401 Unauthorized {api_key}");
    expect(m).toContain("Не удалось обработать");
    expect(m).not.toContain("401");
    expect(m).not.toContain("LLM");
  });
});
