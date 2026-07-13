"use client";

import { useState } from "react";
import { createAssignment } from "./actions";
import { parseCriteria, parseTests } from "@/lib/assignment/parse";

export function AssignmentForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [criteria, setCriteria] = useState("");
  const [tests, setTests] = useState("");
  async function action(formData: FormData) {
    const res = await createAssignment(formData);
    setMsg(res.ok ? "Created" : res.error);
  }
  const criteriaCount = parseCriteria(criteria).length;
  const testCount = parseTests(tests).length;
  const testsNonEmpty = tests.trim().length > 0;
  const testWarning = testsNonEmpty && testCount === 0;
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
        <textarea name="criteria" placeholder={"Читает ввод из stdin\nБез внешних библиотек"} rows={4} value={criteria} onChange={(e) => setCriteria(e.target.value)} />
      </label>
      <label className="field">
        <span className="label">тесты — формат: stdin ⏎=&gt;⏎ expected, блоки через ⏎---⏎</span>
        <textarea
          name="tests"
          placeholder={"2 3\n=>\n5\n---\n10 20\n=>\n30"}
          rows={6}
          value={tests}
          onChange={(e) => setTests(e.target.value)}
        />
        <p className="mono muted">распознано {testCount} тестов · {criteriaCount} критериев</p>
        {testWarning && (
          <p className="mono" style={{ color: "#c0392b" }}>
            ⚠ формат тестов не распознан — блоки разделяй строкой ---, ввод и вывод строкой =&gt;
          </p>
        )}
      </label>
      <button type="submit" className="btn btn-green btn-block">➕ Создать задание</button>
      {msg && <p className="mono muted">{msg}</p>}
    </form>
  );
}
