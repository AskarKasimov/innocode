"use client";

import { useState } from "react";
import { createSubmission } from "./actions";

export function SubmitForm({ assignments }: { assignments: { id: string; title: string }[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceCode, setSourceCode] = useState("");

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
        return;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  async function action(formData: FormData) {
    setError(null);
    formData.set("sourceCode", sourceCode);
    const result = await createSubmission(formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus("PENDING");
    void poll(result.submissionId);
  }

  return (
    <form action={action} style={{ display: "grid", gap: 12 }}>
      <input name="studentName" placeholder="Your name" required />
      <select name="assignmentId" required defaultValue="">
        <option value="" disabled>Select assignment</option>
        {assignments.map((a) => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </select>
      <input type="file" onChange={onFile} />
      <textarea
        name="sourceCode"
        placeholder="Paste code here"
        rows={14}
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
      />
      <button type="submit">Submit</button>
      {status && <p>Status: {status}</p>}
      {status === "DONE" && <p>✅ Accepted — your submission was processed.</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </form>
  );
}
