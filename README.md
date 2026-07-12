# InnoCode

Auto-grading MVP: students submit code, Piston runs it against tests, an LLM audits the
solution against teacher criteria, teachers review and approve/decline.

Stack: Next.js 16 (App Router), Prisma + Postgres, Piston (code execution),
OpenAI-compatible LLM.

## Prerequisites

- Docker
- Node 20+ (only needed if you're editing code / running `npm test` outside the container)
- An OpenAI-compatible API key

## Setup

Everything — Postgres, Piston, and the Next.js app itself — runs via `docker compose`.

```bash
# 1. env
cp .env.example .env
#   then set a real OPENAI_API_KEY in .env

# 2. bring up Postgres + Piston + the app (builds the app image on first run)
docker compose up -d --build

# 3. install the language runtimes assignments will use (Piston ships with none by default)
curl -s -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" \
  -d '{"language":"python","version":"3.12.0"}'

# 4. app DB schema + demo data (inside the app container)
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run db:seed
```

- Student submit page: http://localhost:3000/submit
- Teacher dashboard: http://localhost:3000/teacher (password = `TEACHER_PASSWORD` in `.env`)

The `web` service bind-mounts the repo into the container, so editing source on the host
hot-reloads inside it — no rebuild needed for code changes. Rebuild (`docker compose up -d
--build web`) only after changing `package.json` or the `Dockerfile`.

### Running without Docker for the app

If you'd rather run Next.js on the host (only Postgres + Piston in Docker), skip the `web`
service and run `npm run dev` directly — just point `.env`'s `DATABASE_URL`/`PISTON_URL`
at the host-published ports (`localhost:5433` / `localhost:2000`, already the defaults in
`.env.example`), then use `npm run db:migrate` / `npm run db:seed` instead of the
`docker compose exec` forms above.

### Why Piston, not Judge0

Judge0's `isolate` sandbox hardcodes **cgroup v1** paths (`/sys/fs/cgroup/memory/...`),
which don't exist on cgroup-v2 hosts — including Docker Desktop on macOS. Every
submission failed with status `Internal Error` / `Failed to create control group`, a
host-kernel mismatch with no compose-level fix. Piston uses its own sandboxing and runs
fine on a stock Docker Desktop install, so it replaced Judge0 here.

`Assignment.language` stores a Piston language name (`"python"`, `"javascript"`, ...),
not a numeric id — install the matching runtime via `POST /api/v2/packages` (see step 3
above) before assigning it to a teacher's assignment. List installed/available runtimes
with `GET http://localhost:2000/api/v2/runtimes`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm test` | Vitest unit suite |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo assignment |
| `npm run db:generate` | Regenerate Prisma client |

## Architecture

- `src/lib/piston/` — Piston execution client (behind an interface)
- `src/lib/llm/` — OpenAI-compatible client + zod-validated response schema
- `src/lib/pipeline/` — submission processing: TESTING → ANALYZING → DONE / ERROR
- `src/lib/category.ts` — derives risk category from LLM flags
- `src/lib/csv.ts` — RFC4180 CSV export
- `src/app/submit/` — student flow with status polling
- `src/app/teacher/` — auth, assignment CRUD, submission review
