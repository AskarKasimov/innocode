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

Everything — Postgres, Piston, schema migration, demo seed, and the Next.js app itself —
runs via one `docker compose` command. There are no manual setup steps beyond the env file.

```bash
cp .env.example .env
#   then set a real OPENAI_API_KEY in .env

docker compose up -d --build
```

That's it. Compose's healthchecks and `depends_on` conditions sequence the rest
automatically:

```
app-db (healthy) ──► migrate (deploy) ──► seed ──► web
piston (healthy) ──► piston-init (installs python 3.12 runtime) ──► web
```

`web` won't start serving until migrations, the seed, and the Piston runtime install have
all completed successfully — `docker compose up -d` blocks on nothing (it's all
backgrounded), but `docker compose ps` shows `migrate`/`seed`/`piston-init` as `Exited (0)`
once done, and `web` flips to `running` only after.

- Student submit page: http://localhost:3000/submit
- Teacher dashboard: http://localhost:3000/teacher (password = `TEACHER_PASSWORD` in `.env`)

The `web` service (and `migrate`/`seed`) bind-mount the repo into the container, so editing
source or `prisma/schema.prisma` on the host is picked up without a rebuild — `web` hot-reloads,
and re-running `docker compose up -d migrate seed` re-applies schema/seed changes. Rebuild
(`docker compose up -d --build web`) only after changing `package.json` or the `Dockerfile`.

Need a different language runtime than the seeded Python 3.12? Run the same request
`piston-init` makes, with a different `language`/`version`:
```bash
curl -s -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" \
  -d '{"language":"javascript","version":"18.15.0"}'
```

### Running without Docker for the app

If you'd rather run Next.js on the host (only Postgres + Piston in Docker), start just the
infra services and run `npm run dev` directly:

```bash
docker compose up -d app-db piston piston-init
npm run db:migrate
npm run db:seed
npm run dev
```

`.env`'s `DATABASE_URL`/`PISTON_URL` already default to the host-published ports
(`localhost:5433` / `localhost:2000`).

### Why Piston, not Judge0

Judge0's `isolate` sandbox hardcodes **cgroup v1** paths (`/sys/fs/cgroup/memory/...`),
which don't exist on cgroup-v2 hosts — including Docker Desktop on macOS. Every
submission failed with status `Internal Error` / `Failed to create control group`, a
host-kernel mismatch with no compose-level fix. Piston uses its own sandboxing and runs
fine on a stock Docker Desktop install, so it replaced Judge0 here.

`Assignment.language` stores a Piston language name (`"python"`, `"javascript"`, ...),
not a numeric id — the runtime must be installed in Piston (`piston-init` does this for
Python 3.12 automatically; see above for other languages) before assigning it to a
teacher's assignment. List installed/available runtimes with
`GET http://localhost:2000/api/v2/runtimes`.

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
