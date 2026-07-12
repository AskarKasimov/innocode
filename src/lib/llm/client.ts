import { env } from "@/lib/env";
import { parseLlmResponse, type AnalyzeInput, type LlmClient, type LlmResponse } from "./types";

const SYSTEM_PROMPT = `You are an assistant that audits a student's code solution against a teacher's criteria.
For EACH criterion, output a flag with:
- "criterion": the exact criterion text,
- "verdict": one of "ok" | "violation" | "insufficient_evidence",
- "codeSnippet": the exact lines from the solution that justify the verdict (empty string if none),
- "explanation": a short reason.
Return ONLY JSON of the shape: {"flags":[...]}. Do not add commentary.`;

function buildUserPrompt(input: AnalyzeInput): string {
  const tests = input.testResults
    .map((t, i) => `Test ${i + 1}: ${t.passed ? "PASS" : "FAIL"} (${t.statusDescription})`)
    .join("\n");
  return [
    `Language: ${input.language}`,
    `Criteria:\n${input.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`,
    `Test results:\n${tests || "(none)"}`,
    `Solution source code:\n\`\`\`\n${input.sourceCode}\n\`\`\``,
  ].join("\n\n");
}

export class OpenAiCompatibleLlmClient implements LlmClient {
  constructor(
    private baseUrl: string = env.OPENAI_BASE_URL,
    private apiKey: string = env.OPENAI_API_KEY,
    private model: string = env.OPENAI_MODEL,
  ) {}

  async analyze(input: AnalyzeInput): Promise<LlmResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM request failed: ${res.status} ${await res.text()}`);
    const body = await res.json();
    const content: string = body.choices?.[0]?.message?.content ?? "";
    return parseLlmResponse(content);
  }
}
