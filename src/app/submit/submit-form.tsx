"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubmission } from "./actions";

export function SubmitForm({ assignments }: { assignments: { id: string; title: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sourceCode, setSourceCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Files saved by Windows editors are often cp1251/ANSI, not UTF-8. Reading
    // them as UTF-8 mangles Cyrillic into ? / replacement chars, which then
    // runs and prints garbage. Decode UTF-8 strictly; on failure fall back to
    // windows-1251, and strip a leading BOM either way.
    const buf = await file.arrayBuffer();
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    } catch {
      text = new TextDecoder("windows-1251").decode(buf);
    }
    setSourceCode(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  }

  async function action(formData: FormData) {
    setError(null);
    setBusy(true);
    formData.set("sourceCode", sourceCode);
    const result = await createSubmission(formData);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push(`/submit/${result.submissionId}`);
  }

  return (
    <form action={action} className="card stack" style={{ gap: 16 }}>
      <label className="field">
        <span className="label">имя студента</span>
        <input name="studentName" placeholder="Иван Иванов" required />
      </label>

      <label className="field">
        <span className="label">задание</span>
        <select name="assignmentId" required defaultValue="">
          <option value="" disabled>Выбери задание…</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="label">файл с решением (или вставь ниже)</span>
        <input type="file" onChange={onFile} />
      </label>

      <label className="field">
        <span className="label">исходный код</span>
        <textarea
          name="sourceCode"
          placeholder="# вставь код сюда"
          rows={14}
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </label>

      <button type="submit" className="btn btn-green btn-block" disabled={busy}>
        {busy ? "⏳ Отправка…" : "🚀 Отправить"}
      </button>

      {error && <p className="mono" style={{ color: "#c0392b" }}>{error}</p>}
    </form>
  );
}
