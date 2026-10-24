# AGENTS.md — instructions for AI agents

**AI Spend Control** (working name) — Wiv Air-style AI spend governance for 10–200 person teams: per-person spend across AI tools, budgets, warnings, caps. No gateway/proxy; we read provider admin APIs.

Product plan: `D:\Ninad\ai-spend-validation\PRODUCT_PLAN.md`. Validation kit: `VALIDATION_KIT.md` in the same folder.

Stack: Next.js 15 (>= 15.2.8), TypeScript strict, Prisma 5, PostgreSQL, Auth.js v5 credentials, Zod 4, Vitest, Tailwind 4, Resend.

## Architecture (do not break)

```text
app → application → domain
app → infrastructure
domain ✗ app | infrastructure | provider SDKs
```

| Layer | Path |
|-------|------|
| Routes & UI | `src/app/`, `src/components/` |
| Use cases | `src/application/` |
| Business rules | `src/domain/` (pure, Zod, no React/Prisma client) |
| Persistence | `src/infrastructure/repositories/` |
| Provider adapters | `src/infrastructure/providers/<provider>/` |
| Encryption | `src/infrastructure/crypto/secret-box.ts` |
| Cross-cutting | `src/lib/` |

## Phase status

| Phase | Status |
|-------|--------|
| 1 Foundation: auth, orgs + roles, encrypted Cursor connection, test sync | **Done** |
| 2 Visibility: hourly cron, 14-day usage trend, manager CSV, Monday digest, audit page, usage spike | **Done** |
| 3 Budgets: 80/90/100 email alerts, monitor or enforce, Cursor cap, per-person raise | **Done** |
| 4 Slack approve/deny buttons, Google Workspace import | Not started (needs a public HTTPS URL for Slack) |
| 5 OpenAI + Anthropic | Not started |
| 6 Launch + billing | Not started |

## Rules

1. **Admin keys are secrets.** Encrypt with `encryptSecret()` before storing; decrypt only in sync/enforcement code. Never select `encryptedKey` for UI, never log keys, never return them from an API.
2. **Money** — provider spend is fractional cents; use `src/domain/common/money.ts` (Decimal). Never JS float math on money.
3. **Roles** — permission checks live in `src/domain/organization/roles.ts`; services check them, routes do not.
4. **Provider errors** — map to `AppError("UPSTREAM" | "VALIDATION")` with a user-readable message. DB outages map to `SERVICE_UNAVAILABLE`.
5. **Never store prompts or code.** Only spend, counts, model names.
6. Add Vitest tests for domain logic and provider response parsing.
7. Do not commit or push unless asked. No `.env` in git.

## Commands

```powershell
npm install
npm run db:migrate
npm test
npm run dev   # http://localhost:3000
npm run build
```
