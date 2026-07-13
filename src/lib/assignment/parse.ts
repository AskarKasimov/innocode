export interface ParsedTest {
  stdin: string;
  expectedStdout: string;
}

function normalize(raw: string): string {
  return raw.replace(/\r\n/g, "\n");
}

export function parseCriteria(raw: string): string[] {
  return normalize(raw)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Tests are blocks separated by a line "---". Within a block, stdin and the
// expected stdout are separated by a line "=>". A block counts only if it has
// a non-empty expected output.
export function parseTests(raw: string): ParsedTest[] {
  return normalize(raw)
    .split(/\n---\n/)
    .map((block) => {
      const [stdin = "", expectedStdout = ""] = block.split(/\n=>\n/);
      return { stdin: stdin.trim(), expectedStdout: expectedStdout.trim() };
    })
    .filter((t) => t.expectedStdout.length > 0);
}
