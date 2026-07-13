// Maps a raw internal pipeline error into a safe, friendly message for students.
// Never leak internals (status codes, stack traces, provider names) to the UI.
export function studentFacingError(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("piston") || lower.includes("runtime") || lower.includes("language")) {
    return "Не удалось запустить код. Проверь, что решение написано на нужном языке.";
  }
  return "Не удалось обработать решение. Попробуй отправить ещё раз чуть позже.";
}
