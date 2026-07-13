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
    <form action={action} className="card stack" style={{ gap: 14, maxWidth: 380 }}>
      <label className="field">
        <span className="label">пароль преподавателя</span>
        <input type="password" name="password" placeholder="••••••••" required />
      </label>
      <button type="submit" className="btn btn-green btn-block">🔓 Войти</button>
      {error && <p className="mono" style={{ color: "#c0392b" }}>{error}</p>}
    </form>
  );
}
