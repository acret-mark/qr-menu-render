# Hapag on Render (qr-menu-render)

A from-scratch rebuild of `qr-menu-dev` (Hapag), migrating off Vercel + Supabase onto Render.
`qr-menu-dev` remains the untouched reference implementation and rollback path — see
`/Users/acretstaff/render/migration/render-migration-plan.md` for the full migration plan this
project executes, and `specs/` for the Spec Kit feature specs driving the rebuild.

## ⚠️ Currently running on Render's free tier

**No production traffic should run on this deployment.** See
[`docs/known-limitations.md`](docs/known-limitations.md) for why, what the concrete risks are,
and what to do when the free Postgres instance expires.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL (a local Postgres works fine), AUTH_SECRET, etc.
npm run db:push               # apply the Drizzle schema
npm run dev
```

## Verify before opening a PR

```bash
npm run lint
npm run typecheck
npm run build
node .github/scripts/check-structure.mjs
```

## Key docs

- [`docs/contributing.md`](docs/contributing.md) — the data-access-layer rule (read this before
  touching any tenant-scoped table; there's no database-level RLS here, unlike `qr-menu-dev`)
- [`docs/known-limitations.md`](docs/known-limitations.md) — current hosting-tier limitation
- [`docs/render-hosting-report.md`](docs/render-hosting-report.md) — every blocker/limitation hit
  (or anticipated) moving hosting from Vercel + Supabase to Render, with what it took to fix each
- `specs/*/spec.md` — one Spec Kit feature spec per unit of migration/product work
