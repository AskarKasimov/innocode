import { describe, expect, it } from "vitest";
import { parseCriteria, parseTests } from "../assignment/parse";

describe("parseCriteria", () => {
  it("splits non-empty trimmed lines", () => {
    expect(parseCriteria("  a \n\n b \n")).toEqual(["a", "b"]);
  });
  it("returns [] for blank input", () => {
    expect(parseCriteria("   \n  ")).toEqual([]);
  });
});

describe("parseTests", () => {
  it("parses multiple blocks", () => {
    const raw = "2 3\n=>\n5\n---\n10 20\n=>\n30";
    expect(parseTests(raw)).toEqual([
      { stdin: "2 3", expectedStdout: "5" },
      { stdin: "10 20", expectedStdout: "30" },
    ]);
  });
  it("normalizes CRLF line endings", () => {
    const raw = "2 3\r\n=>\r\n5";
    expect(parseTests(raw)).toEqual([{ stdin: "2 3", expectedStdout: "5" }]);
  });
  it("drops blocks with empty expected output", () => {
    expect(parseTests("2 3\n=>\n")).toEqual([]);
  });
});
