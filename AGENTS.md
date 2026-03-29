# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Vibe Coding Launchpad is a single Next.js 15 application (not a monorepo) that implements the BMAD framework for AI-assisted PRD generation. It uses InstantDB (cloud SaaS) for auth/database and the Anthropic Claude API for AI chat.

### Running the application
- **Dev server**: `npm run dev` — starts on port 3050
- **Lint**: `npm run lint`
- **Type check**: `npx tsc --noEmit`
- See `README.md` and `QUICKSTART.md` for full command reference.

### Environment variables
A `.env.local` file is required. Copy from `env.template`:
- `NEXT_PUBLIC_INSTANTDB_APP_ID` — InstantDB app ID (cloud SaaS, no local alternative)
- `INSTANTDB_ADMIN_TOKEN` — InstantDB admin token (server-side only)
- `NEXT_PUBLIC_APP_URL` — defaults to `http://localhost:3050`
- `ENCRYPTION_KEY` — optional in dev (code has a fallback); required in production

### Gotchas
- **`postinstall` runs `npm run build`**: Running `npm install` triggers a full production build. This means env vars (at minimum `NEXT_PUBLIC_INSTANTDB_APP_ID` and `INSTANTDB_ADMIN_TOKEN`) must be set in `.env.local` before `npm install`, even with placeholder values, or the build may fail or produce warnings.
- **InstantDB is cloud-only**: There is no local database to run. Auth pages (`/auth/login`, `/auth/signup`) will show runtime errors unless valid InstantDB credentials are provided via environment secrets.
- **No test framework**: The project has no Jest/Vitest/Playwright configured. Testing is limited to `npm run lint` and `npx tsc --noEmit`.
- **Node.js version**: `.node-version` specifies `20`, and `package.json` engines requires `>=20.0.0`.
