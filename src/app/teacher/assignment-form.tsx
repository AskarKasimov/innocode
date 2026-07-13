"use client";

import { useState } from "react";
import { createAssignment } from "./actions";

type TestRow = { stdin: string; expected: string };

export function AssignmentForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [criteria, setCriteria] = useState("");
  const [rows, setRows] = useState<TestRow[]>([{ stdin: "", expected: "" }]);

  async function action(formData: FormData) {
    const res = await createAssignment(formData);
    setMsg(res.ok ? "Создано ✓" : res.error);
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
        <input name="language" type="text" placeholder="python, javascript, cpp…" required />
      </label>
      <label className="field">
        <span className="label">критерии — по одному на строку</span>
        <textarea
          name="criteria"
          placeholder={"Читает ввод из stdin\nБез внешних библиотек"}
          rows={4}
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
        />
      </label>

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
