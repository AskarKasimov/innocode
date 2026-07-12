"use client";

import { setDecision } from "./actions";

export function DecisionButtons({ id, current }: { id: string; current: string }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => setDecision(id, "APPROVED")} disabled={current === "APPROVED"}>Approve</button>
      <button onClick={() => setDecision(id, "DECLINED")} disabled={current === "DECLINED"}>Decline</button>
      <span>Current: {current}</span>
    </div>
  );
}
