"use client";

import { useState } from "react";
import { createSubmission } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "в очереди",
  TESTING: "гоняем тесты",
  ANALYZING: "AI анализирует",
  DONE: "готово",
  ERROR: "ошибка",
};

export function SubmitForm({ assignments }: { assignments: { id: string; title: string }[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceCode, setSourceCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSourceCode(await file.text());
  }

  async function poll(id: string) {
    for (;;) {
      const res = await fetch(`/api/submissions/${id}/status`);
      const data = await res.json();
      setStatus(data.status);
      if (data.status === "DONE" || data.status === "ERROR") {
        if (data.status === "ERROR") setError(data.errorMessage ?? "Processing error");
        setBusy(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
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
    setStatus("PENDING");
    void poll(result.submissionId);
  }

  const done = status === "DONE";
  const failed = status === "ERROR";

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
        {busy ? "⏳ Обработка…" : "🚀 Отправить"}
      </button>

      {status && (
        <div className="banner" style={{ justifyContent: "space-between" }}>
          <span className="mono">
            {done ? "✅" : failed ? "⛔" : "🦫"}{" "}
            статус: {STATUS_LABEL[status] ?? status}
          </span>
          {!done && !failed && <span className="faint mono">опрашиваем…</span>}
        </div>
      )}
      {done && <p className="mono" style={{ color: "var(--green-hover)" }}>Решение принято и обработано.</p>}
      {error && <p className="mono" style={{ color: "#c0392b" }}>{error}</p>}
    </form>
  );
}
