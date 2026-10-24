# Deploy AI Spend Control — Vercel + Neon

Do this in a **new** GitHub repo, a **new** Neon project, and a **new** Vercel project. Do not reuse the MeterClose database URL or encryption key. Do not point this app at meterclose.com.

Ship on the Vercel URL first. A subdomain such as `spend.meterclose.com`, or a new domain, can wait.

## 1) Neon

1. Create a free project at [https://console.neon.tech](https://console.neon.tech) (name it something other than MeterClose).
2. Copy the **pooled** connection string. That is `DATABASE_URL`.
3. Leave the local `.env` on local Postgres. Production gets its own database and its own `ENCRYPTION_KEY`.

## 2) GitHub

This folder is the app. Create a new repository and push when you are ready. Do not push `.env`.

## 3) Vercel

1. Import that GitHub repo at [https://vercel.com](https://vercel.com). Framework: Next.js.
2. Set these for Production (and Preview if you use it):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon pooled connection string |
| `AUTH_SECRET` | New random secret, not the MeterClose one |
| `ENCRYPTION_KEY` | New 32-byte base64 key. Set this **before** the first customer connects Cursor. Rotating it makes stored admin keys unreadable. |
| `CRON_SECRET` | New random secret. The hourly job sends it as a bearer token. |
| `RESEND_API_KEY` | Resend key for this product |
| `EMAIL_FROM` | A verified domain sender. `onboarding@resend.dev` only delivers to the Resend account owner, so employee budget mail will not arrive. |
| `NEXT_PUBLIC_APP_URL` | The Vercel URL, for example `https://your-app.vercel.app` |

3. Deploy. `package.json` runs `prisma migrate deploy` and then `next build`.

Generate secrets:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use a fresh value for `AUTH_SECRET`, `ENCRYPTION_KEY`, and `CRON_SECRET`.

## 4) Hourly sync

Vercel Hobby cron runs once a day. This app needs hourly sync, so use GitHub Actions instead.

1. Repo variable `APP_URL` = the public origin, no trailing slash.
2. Repo secret `CRON_SECRET` = the same value as Vercel `CRON_SECRET`.
3. Workflow: `.github/workflows/cron.yml` (`0 * * * *`) POSTs `https://<host>/api/cron/sync` with `Authorization: Bearer <CRON_SECRET>`.

Without `CRON_SECRET` the route returns 401. It is not required for local `next start`.

## 5) After deploy

1. Open the Vercel URL and sign up. That creates a workspace.
2. Confirm `/security` loads without signing in.
3. Connect Cursor only with an Enterprise admin key. A non-Enterprise key is rejected.
4. Budgets stay in monitor mode until you switch them to enforce.

## What this deploy does not include

Slack Approve/Deny buttons need the public URL and a Slack app, and are not in this release. OpenAI, Anthropic, Google Workspace, and billing are later.
