import { describe, expect, it } from "vitest";
import { deriveCategory } from "../category";

describe("deriveCategory", () => {
  it("returns LOW_RISK when all flags are OK", () => {
    expect(deriveCategory([{ verdict: "OK" }, { verdict: "OK" }])).toBe("LOW_RISK");
  });

  it("returns NEEDS_REVIEW when any flag is VIOLATION", () => {
    expect(
      deriveCategory([{ verdict: "OK" }, { verdict: "VIOLATION" }, { verdict: "INSUFFICIENT_EVIDENCE" }]),
    ).toBe("NEEDS_REVIEW");
  });

  it("returns INSUFFICIENT_EVIDENCE when no violation but some insufficient", () => {
    expect(
      deriveCategory([{ verdict: "OK" }, { verdict: "INSUFFICIENT_EVIDENCE" }]),
    ).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("returns LOW_RISK for empty flags", () => {
    expect(deriveCategory([])).toBe("LOW_RISK");
  });
});
