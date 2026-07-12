"use client";

import { useState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  async function action(formData: FormData) {
    const res = await login(formData);
    if (res && !res.ok) setError(res.error);
  }
  return (
    <form action={action} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
      <input type="password" name="password" placeholder="Teacher password" required />
      <button type="submit">Log in</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </form>
  );
}
