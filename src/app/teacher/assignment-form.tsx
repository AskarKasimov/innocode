"use client";

import { useState, type KeyboardEvent } from "react";
import { createAssignment } from "./actions";

type TestRow = { stdin: string; expected: string };

export function AssignmentForm({ languages }: { languages: string[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [criterionInput, setCriterionInput] = useState("");
  const [rows, setRows] = useState<TestRow[]>([{ stdin: "", expected: "" }]);

  async function action(formData: FormData) {
    const res = await createAssignment(formData);
    setMsg(res.ok ? "Создано ✓" : res.error);
  }

  function addCriterion() {
    const v = criterionInput.trim();
    if (!v) return;
    setCriteria((c) => (c.includes(v) ? c : [...c, v]));
    setCriterionInput("");
  }
  function onCriterionKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCriterion();
    } else if (e.key === "Backspace" && !criterionInput && criteria.length) {
      setCriteria((c) => c.slice(0, -1));
    }
  }
  function removeCriterion(i: number) {
    setCriteria((c) => c.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, patch: Partial<TestRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { stdin: "", expected: "" }]);
  }
  function removeRow(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }

  const serializedTests = rows
    .filter((r) => r.expected.trim().length > 0)
    .map((r) => `${r.stdin}\n=>\n${r.expected}`)
    .join("\n---\n");
  const validTests = rows.filter((r) => r.expected.trim().length > 0).length;

  return (
    <form action={action} className="card stack" style={{ gap: 14 }}>
      <label className="field">
        <span className="label">название</span>
        <input name="title" placeholder="Сумма двух чисел" required />
      </label>

      <label className="field">
        <span className="label">описание</span>
        <textarea name="description" placeholder="Что требуется от студента" rows={3} required />
      </label>

      <label className="field">
        <span className="label">язык (piston)</span>
        <select name="language" required defaultValue="">
          <option value="" disabled>Выбери язык…</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </label>

      <div className="field">
        <span className="label">критерии · {criteria.length}</span>
        <div
          className="row"
          style={{
            gap: 8,
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            padding: 10,
            background: "var(--card)",
            alignItems: "center",
          }}
        >
          {criteria.map((c, i) => (
            <span
              key={i}
              className="badge"
              style={{ background: "#ecebe3", color: "var(--fg)", textTransform: "none", letterSpacing: 0 }}
            >
              {c}
              <button
                type="button"
                onClick={() => removeCriterion(i)}
                aria-label="удалить критерий"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            value={criterionInput}
            onChange={(e) => setCriterionInput(e.target.value)}
            onKeyDown={onCriterionKey}
            onBlur={addCriterion}
            placeholder={criteria.length ? "ещё критерий + Enter" : "критерий + Enter"}
            style={{ flex: 1, minWidth: 160, border: "none", padding: 4, boxShadow: "none" }}
          />
        </div>
        <input type="hidden" name="criteria" value={criteria.join("\n")} />
      </div>

      <div className="field">
        <span className="label">тесты · {validTests}</span>
        <div className="stack" style={{ gap: 10 }}>
          {rows.map((r, i) => (
            <div key={i} className="card card-tight stack" style={{ gap: 8, background: "#fbfbf8" }}>
              <div className="spread">
                <span className="label">тест {i + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={() => removeRow(i)}
                  >
                    ✕ удалить
                  </button>
                )}
              </div>
              <label className="field">
                <span className="faint mono" style={{ fontSize: 11 }}>ввод (stdin)</span>
                <textarea rows={2} value={r.stdin} onChange={(e) => updateRow(i, { stdin: e.target.value })} placeholder="2 3" />
              </label>
              <label className="field">
                <span className="faint mono" style={{ fontSize: 11 }}>ожидаемый вывод</span>
                <textarea rows={2} value={r.expected} onChange={(e) => updateRow(i, { expected: e.target.value })} placeholder="5" />
              </label>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost" onClick={addRow} style={{ marginTop: 4 }}>
          ➕ добавить тест
        </button>
        <input type="hidden" name="tests" value={serializedTests} />
      </div>

      <button type="submit" className="btn btn-green btn-block">➕ Создать задание</button>
      {msg && <p className="mono muted">{msg}</p>}
    </form>
  );
}
