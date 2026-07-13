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

Everything — Postgres, Piston, schema migration, and the Next.js app itself — runs via one
`docker compose` command. There are no manual setup steps beyond the env file.

```bash
cp .env.example .env
#   then set a real OPENAI_API_KEY in .env

docker compose up -d --build
```

That's it. Compose's healthchecks and `depends_on` conditions sequence the rest
automatically:

```
app-db (healthy) ──► migrate (deploy) ──► web
piston (healthy) ──► piston-init (installs python 3.12 runtime) ──► web
```

`web` won't start serving until migrations and the Piston runtime install have both
completed successfully — `docker compose up -d` blocks on nothing (it's all backgrounded),
but `docker compose ps` shows `migrate`/`piston-init` as `Exited (0)` once done, and `web`
flips to `running` only after.

The database starts empty — a teacher creates assignments through the dashboard.

- Student submit page: http://localhost:3000/submit
- Teacher dashboard: http://localhost:3000/teacher (password = `TEACHER_PASSWORD` in `.env`)

The `web` service (and `migrate`) bind-mount the repo into the container, so editing source
or `prisma/schema.prisma` on the host is picked up without a rebuild — `web` hot-reloads,
and re-running `docker compose up -d migrate` re-applies schema changes. Rebuild
(`docker compose up -d --build web`) only after changing `package.json` or the `Dockerfile`.

Need a different language runtime than Python 3.12? Run the same request `piston-init`
makes, with a different `language`/`version`:
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
not a numeric id. The teacher's create-assignment form shows a **language selector
populated from Piston's installed runtimes** (`GET /api/v2/runtimes`), so only a language
that will actually run can be assigned. Install more runtimes with the `POST /api/v2/packages`
call shown above; the selector picks them up on the next page load.

## How it works

A submission moves through a status machine, processed fire-and-forget in the Node process:

```
PENDING ──► TESTING ──► ANALYZING ──► DONE
   (Piston runs each test)   (LLM audits code vs criteria)   └─► on failure: ERROR
```

1. **TESTING** — Piston runs the student's code against each teacher test (stdin → expected
   stdout), producing an X/Y pass count.
2. **ANALYZING** — an LLM audits the code against the teacher's criteria and emits one flag
   per criterion (`OK` / `VIOLATION` / `INSUFFICIENT_EVIDENCE`) with an explanation.
3. **Category** is derived deterministically from the flags (`src/lib/category.ts`): any
   `VIOLATION` → **NEEDS_REVIEW**; else any `INSUFFICIENT_EVIDENCE` → **INSUFFICIENT_EVIDENCE**;
   otherwise **LOW_RISK**. Tests passing but the approach violating a criterion still surfaces
   as NEEDS_REVIEW — that's the point of the AI pass.

**Student** (`/submit`) picks an assignment, pastes/uploads code, and is redirected to
`/submit/[id]` — a shareable, refresh-proof result page showing a processing roadmap, then
the X/Y test count, category, and any violated-criterion flags. Errors shown to students are
sanitized (no leaked internals).

**Teacher** (`/teacher`, password `TEACHER_PASSWORD`) builds assignments (language selector,
criteria as tag-chips, per-test stdin/expected rows), then reviews per assignment: a table
with per-category counts, student-name search, and CSV export; it auto-refreshes while
submissions are still processing. Opening a submission shows code, per-test results, AI flags,
and approve/decline.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm test` | Vitest unit suite |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |

## Architecture

- `src/lib/piston/` — Piston execution client behind an interface (`client.ts`) + installed-
  runtime lookup (`runtimes.ts`)
- `src/lib/llm/` — OpenAI-compatible client + zod-validated response schema
- `src/lib/pipeline/` — submission processing (`process.ts`), fire-and-forget launcher
  (`launch.ts`), student-facing error sanitizer (`errors.ts`)
- `src/lib/category.ts` — derives risk category from LLM flags
- `src/lib/csv.ts` — RFC4180 CSV export
- `src/lib/assignment/parse.ts` — parses the teacher's criteria/tests input formats
- `src/app/submit/` — student submit form + `/submit/[id]` result page (roadmap + polling)
- `src/app/teacher/` — auth, assignment builder, submission review, auto-refresh
- `src/app/api/submissions/[id]/status/` — student-facing status/result JSON (polled)

## Tests

`npm test` — Vitest unit suite over the pure logic (category derivation, CSV, LLM schema,
pipeline with mocked clients, error sanitizer, input parser). External services (Piston, LLM)
sit behind interfaces and are mocked.
