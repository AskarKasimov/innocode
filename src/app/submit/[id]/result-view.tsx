"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Result = {
  status: "PENDING" | "TESTING" | "ANALYZING" | "DONE" | "ERROR";
  studentName: string;
  assignmentTitle: string;
  language: string;
  aiCategory: "LOW_RISK" | "NEEDS_REVIEW" | "INSUFFICIENT_EVIDENCE" | null;
  errorMessage: string | null;
  testsPassed: number;
  testsTotal: number;
  flags: {
    criterion: string;
    verdict: "OK" | "VIOLATION" | "INSUFFICIENT_EVIDENCE";
    explanation: string;
  }[];
};

const steps = [
  { status: "PENDING", label: "в очереди" },
  { status: "TESTING", label: "тесты" },
  { status: "ANALYZING", label: "AI-анализ" },
  { status: "DONE", label: "готово" },
];

const stepIndex: Record<string, number> = {
  PENDING: 0,
  TESTING: 1,
  ANALYZING: 2,
  DONE: 3,
  ERROR: 3,
};

export function ResultView({ id }: { id: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/submissions/${id}/status`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Submission not found");
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data: Result = await response.json();
        setResult(data);
        setLoading(false);

        // Stop polling if done or error
        if (data.status === "DONE" || data.status === "ERROR") {
          if (intervalId) clearInterval(intervalId);
        }
      } catch {
        // Network error — don't stop polling, just wait and retry on next tick.
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 1500ms
    intervalId = setInterval(fetchStatus, 1500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id]);

  if (loading && !result) {
    return <div className="stack">Загрузка…</div>;
  }

  if (error) {
    return (
      <div className="stack">
        <div className="card" style={{ borderLeft: "4px solid #b32020" }}>
          <p style={{ color: "#b32020" }}>{error}</p>
          <Link href="/submit" className="btn">
            Отправить заново
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return <div className="stack">Загрузка…</div>;
  }

  const currentStepIndex =
    result.status === "DONE" ? 4 : result.status === "ERROR" ? 3 : stepIndex[result.status];
  const isProcessing =
    result.status !== "DONE" && result.status !== "ERROR";

  return (
    <div className="stack">
      {/* Roadmap */}
      <div className="row" style={{ gap: "1rem", alignItems: "center" }}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex && isProcessing;
          const showGreen = isDone || isActive;

          return (
            <div key={step.status} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  backgroundColor: showGreen ? "var(--green)" : "#ccc",
                  color: showGreen ? "white" : "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                }}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {isProcessing && <p className="muted">обрабатываем…</p>}

      {/* Done state */}
      {result.status === "DONE" && (
        <div className="stack">
          <div className="card">
            <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {result.testsPassed}/{result.testsTotal} тестов
            </p>
            {result.aiCategory && (
              <div
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.25rem",
                  marginTop: "1rem",
                  backgroundColor:
                    result.aiCategory === "LOW_RISK"
                      ? "#e4f8e9"
                      : result.aiCategory === "NEEDS_REVIEW"
                        ? "#fde8e8"
                        : "#fbf3d8",
                  color:
                    result.aiCategory === "LOW_RISK"
                      ? "#0d7a2b"
                      : result.aiCategory === "NEEDS_REVIEW"
                        ? "#b32020"
                        : "#8a6d00",
                  fontWeight: "bold",
                }}
              >
                {result.aiCategory === "LOW_RISK"
                  ? "низкий риск"
                  : result.aiCategory === "NEEDS_REVIEW"
                    ? "нужна проверка"
                    : "мало данных"}
              </div>
            )}
          </div>

          {/* Flags */}
          {result.flags.some((f) => f.verdict !== "OK") ? (
            <div className="stack">
              {result.flags
                .filter((f) => f.verdict !== "OK")
                .map((flag, idx) => (
                  <div key={idx} className="card">
                    <p style={{ fontWeight: "bold" }}>{flag.criterion}</p>
                    <p className="muted">{flag.explanation}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="card" style={{ backgroundColor: "#e4f8e9" }}>
              <p style={{ color: "#0d7a2b", fontWeight: "bold" }}>
                Замечаний нет 🎉
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {result.status === "ERROR" && (
        <div className="stack">
          <div className="card" style={{ borderLeft: "4px solid #b32020" }}>
            <p style={{ color: "#b32020" }}>{result.errorMessage}</p>
            <Link href="/submit" className="btn btn-dark" style={{ marginTop: 12 }}>
              Отправить заново
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
