"use client";

import { setDecision } from "./actions";

const LABEL: Record<string, string> = {
  NONE: "решение не принято",
  APPROVED: "принято ✅",
  DECLINED: "отклонено ⛔",
};

export function DecisionButtons({ id, current }: { id: string; current: string }) {
  return (
    <div className="row">
      <button
        className="btn btn-green"
        onClick={() => setDecision(id, "APPROVED")}
        disabled={current === "APPROVED"}
      >
        ✅ Принять
      </button>
      <button
        className="btn btn-ghost"
        onClick={() => setDecision(id, "DECLINED")}
        disabled={current === "DECLINED"}
      >
        ⛔ Отклонить
      </button>
      <span className="label">{LABEL[current] ?? current}</span>
    </div>
  );
}
