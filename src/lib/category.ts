export type FlagVerdictValue = "OK" | "VIOLATION" | "INSUFFICIENT_EVIDENCE";
export type AiCategoryValue = "LOW_RISK" | "NEEDS_REVIEW" | "INSUFFICIENT_EVIDENCE";

export function deriveCategory(flags: { verdict: FlagVerdictValue }[]): AiCategoryValue {
  if (flags.some((f) => f.verdict === "VIOLATION")) return "NEEDS_REVIEW";
  if (flags.some((f) => f.verdict === "INSUFFICIENT_EVIDENCE")) return "INSUFFICIENT_EVIDENCE";
  return "LOW_RISK";
}
