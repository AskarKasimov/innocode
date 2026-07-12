"use client";

import { useState } from "react";
import { createAssignment } from "./actions";

export function AssignmentForm() {
  const [msg, setMsg] = useState<string | null>(null);
  async function action(formData: FormData) {
    const res = await createAssignment(formData);
    setMsg(res.ok ? "Created" : res.error);
  }
  return (
    <form action={action} style={{ display: "grid", gap: 8, maxWidth: 640 }}>
      <input name="title" placeholder="Title" required />
      <textarea name="description" placeholder="Description" rows={3} required />
      <input name="language" type="number" placeholder="Judge0 language_id (e.g. 71 Python)" required />
      <textarea name="criteria" placeholder="One criterion per line" rows={4} />
      <textarea
        name="tests"
        placeholder={"stdin\n=>\nexpected stdout\n---\nnext stdin\n=>\nnext expected"}
        rows={6}
      />
      <button type="submit">Create assignment</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
