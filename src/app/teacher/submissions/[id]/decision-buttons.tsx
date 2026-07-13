"use client";

import { useState, useTransition } from "react";
import { setDecision } from "./actions";

const LABEL: Record<string, string> = {
  NONE: "решение не принято",
  APPROVED: "принято ✅",
  DECLINED: "отклонено ⛔",
};

export function DecisionButtons({ id, current }: { id: string; current: string }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function decide(decision: "APPROVED" | "DECLINED") {
    setSaved(false);
    startTransition(async () => {
      await setDecision(id, decision);
      setSaved(true);
    });
  }

  return (
    <div className="row">
      <button
        className="btn btn-green"
        onClick={() => decide("APPROVED")}
        disabled={pending || current === "APPROVED"}
      >
        ✅ Принять
      </button>
      <button
        className="btn btn-ghost"
        onClick={() => decide("DECLINED")}
        disabled={pending || current === "DECLINED"}
      >
        ⛔ Отклонить
      </button>
      <span className="label">
        {pending ? "сохраняю…" : saved ? "сохранено ✓" : LABEL[current] ?? current}
      </span>
    </div>
  );
}
