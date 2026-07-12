# InnoCode

Auto-grading MVP: students submit code, Judge0 runs it against tests, an LLM audits the
solution against teacher criteria, teachers review and approve/decline.

Stack: Next.js 16 (App Router), Prisma + Postgres, Judge0 (code execution),
OpenAI-compatible LLM.

## Prerequisites

- Node 20+
- Docker (see **Judge0 requires cgroup v1** below — important on macOS)
- An OpenAI-compatible API key

## Setup

```bash
# 1. env
cp .env.example .env
#   then set a real OPENAI_API_KEY in .env

# 2. bring up Postgres + Judge0
docker compose up -d

# 3. app DB schema + demo data
npm run db:migrate
npm run db:seed

# 4. dev server
npm run dev
```

- Student submit page: http://localhost:3000/submit
- Teacher dashboard: http://localhost:3000/teacher (password = `TEACHER_PASSWORD` in `.env`)

## Judge0 requires cgroup v1

Judge0 1.13.x's `isolate` sandbox needs **cgroup v1**. It reads
`/sys/fs/cgroup/memory/...`, which does **not** exist on hosts using the cgroup v2
unified hierarchy — including **Docker Desktop on macOS**.

Symptom: every submission returns status `Internal Error` (id 13). Worker log shows:

```
Failed to create control group /sys/fs/cgroup/memory/box-N/: No such file or directory
No such file or directory @ rb_sysopen - /box/script.py
```

This is a host-kernel issue, **not** a compose or app-code problem — `privileged: true`
is already set and does not help. No compose flag creates the v1 memory controller path.

### Fix on macOS: run Docker on a cgroup-v1 VM via colima

```bash
brew install colima
colima start --cgroups v1 --cpu 4 --memory 6
docker context use colima
docker compose up -d      # rebuild the Judge0 stack on the v1 VM
```

Switch back to Docker Desktop anytime with `docker context use desktop-linux`.

### Fix on a Linux host

Boot the kernel with the legacy hierarchy, then reboot:

```
systemd.unified_cgroup_hierarchy=0
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm test` | Vitest unit suite |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo assignment |
| `npm run db:generate` | Regenerate Prisma client |

## Architecture

- `src/lib/judge0/` — Judge0 batch client (behind an interface)
- `src/lib/llm/` — OpenAI-compatible client + zod-validated response schema
- `src/lib/pipeline/` — submission processing: TESTING → ANALYZING → DONE / ERROR
- `src/lib/category.ts` — derives risk category from LLM flags
- `src/lib/csv.ts` — RFC4180 CSV export
- `src/app/submit/` — student flow with status polling
- `src/app/teacher/` — auth, assignment CRUD, submission review
