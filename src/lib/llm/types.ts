import { z } from "zod";

export const llmFlagSchema = z.object({
  criterion: z.string(),
  verdict: z.enum(["ok", "violation", "insufficient_evidence"]),
  codeSnippet: z.string(),
  explanation: z.string(),
});

export const llmResponseSchema = z.object({
  flags: z.array(llmFlagSchema),
});

export type LlmFlag = z.infer<typeof llmFlagSchema>;
export type LlmResponse = z.infer<typeof llmResponseSchema>;

export function parseLlmResponse(content: string): LlmResponse {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = (fenced ? fenced[1] : content).trim();
  const obj = JSON.parse(jsonText);
  return llmResponseSchema.parse(obj);
}

export interface AnalyzeInput {
  sourceCode: string;
  language: string;
  criteria: string[];
  testResults: { passed: boolean; statusDescription: string }[];
}

export interface LlmClient {
  analyze(input: AnalyzeInput): Promise<LlmResponse>;
}
