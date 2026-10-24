# AI Spend Control

Per-person AI tool spend with budgets, warnings and caps. Cursor first; OpenAI and Anthropic next. Read-only API governance: no proxy in the request path, nothing installed on laptops.

## Run locally

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET` and `ENCRYPTION_KEY`.
2. Install and migrate:

   ```powershell
   npm install
   npm run db:migrate
   npm run dev
   ```

3. Open http://localhost:3000, sign up, then go to **Connections** and paste a Cursor Admin API key.

## Cursor requirements

- A Cursor **Enterprise** team (the Admin API is Enterprise-only).
- A team admin creates the key at cursor.com/dashboard → API Keys → New API Key, scope `admin:*`.

## Security

- Admin keys are encrypted at rest with AES-256-GCM. The key lives only in `ENCRYPTION_KEY` (env), never in the database or repo.
- Keys are checked with Cursor before they are saved, shown afterwards only as the last 4 characters, and deleted on disconnect.
- Only spend and request counts are stored. No prompts or code.
- Connect and disconnect are written to an audit log.

## Layout

See `AGENTS.md`.
