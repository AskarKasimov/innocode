import Link from "next/link";

const FEATURES = [
  { icon: "🧪", title: "Автотесты", sub: "Piston гоняет код" },
  { icon: "🤖", title: "AI-ревью", sub: "аудит по критериям" },
  { icon: "🗂️", title: "Категории", sub: "риск-флаги решений" },
  { icon: "📊", title: "CSV-экспорт", sub: "выгрузка для препода" },
];

export default function Home() {
  return (
    <main className="page-narrow" style={{ textAlign: "center", maxWidth: 920 }}>
      <div className="row" style={{ justifyContent: "center", marginBottom: 28 }}>
        <span className="navpill">INNOCODE · автопроверка кода</span>
      </div>

      <div style={{ fontSize: 56, lineHeight: 1 }}>🦫</div>
      <h1 style={{ fontSize: "clamp(34px, 6vw, 52px)", margin: "16px 0 10px" }}>INNOCODE</h1>
      <p className="muted" style={{ maxWidth: 560, margin: "0 auto 32px" }}>
        Студент сдаёт код — тесты и AI проверяют его, преподаватель ревьюит и решает.
      </p>

      <div className="grid-4" style={{ marginBottom: 36, textAlign: "left" }}>
        {FEATURES.map((f) => (
          <div className="card card-tight" key={f.title}>
            <div style={{ fontSize: 26 }}>{f.icon}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, marginTop: 10 }}>
              {f.title}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{f.sub}</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ justifyContent: "center" }}>
        <Link className="btn btn-green" href="/submit">
          📨 Отправить решение
        </Link>
        <Link className="btn btn-dark" href="/teacher">
          🔑 Кабинет преподавателя
        </Link>
      </div>
    </main>
  );
}
