# Known Limitation: Running on Render's Free Tier

**Status as of 2026-09-11: no company budget is currently approved for Render.** Per
`specs/003-render-feasibility-poc`'s 2026-09-11 reversal, this project runs on Render's free tier
(`render.free.yaml`) as an **interim measure**, not the target configuration
(`render.yaml`, which requires the paid Starter + Postgres Basic tier — see
`/Users/acretstaff/render/migration/render-migration-plan.md` for the cost comparison and
`specs/003-render-feasibility-poc`'s paid-tier request document for the evidence-backed ask).

**This is not a production-ready setup. Production traffic MUST NOT run on it.**

## Concrete risks

| Risk | Detail | Measured? |
|---|---|---|
| Cold starts | Render's free Web Service spins down after 15 minutes idle; the next request pays a cold-start penalty | *Pending — record the actual seconds here once `specs/003-render-feasibility-poc` T009 runs against a live deployment. Compare against the product's own <2s load target (`docs/01_planning.md` in `qr-menu-dev`).* |
| Database expiry | Render's free Postgres is **not permanent** — it is deleted after a limited period (~30 days per Render's documented free-instance lifetime as of this migration's research; reconfirm the current figure from Render's own docs before relying on it, since pricing/lifetime policies can change) | *Pending — record the actual creation/expiry date here once T010 runs.* |
| No SLA | Free tier carries none of a paid plan's uptime/support guarantees | Structural, not something a measurement changes |

## What to do when the free Postgres instance expires

1. Recreate the database service from `render.free.yaml` (`databases: qr-menu-render-interim-db`).
2. Re-run the schema push (`npm run db:push` / `drizzle-kit push`) against the new instance's
   connection string.
3. Update the Web Service's `DATABASE_URL` to point at the new instance (Render's `fromDatabase`
   reference in `render.free.yaml` handles this automatically if the database is recreated under
   the same blueprint apply — confirm this behavior the first time, since Render's exact behavior
   on a recreated database name is worth verifying rather than assuming).
4. Any interim data (test accounts, demo content) created since the last expiry is lost — this is
   expected on free tier, not a bug. Do not store anything here that isn't reproducible or
   disposable.

## Path off this limitation

Resolved once `specs/003-render-feasibility-poc`'s paid-tier request (~$13/mo, Render Starter +
Postgres Basic) is approved — at that point, switch from applying `render.free.yaml` to applying
`render.yaml` (the real target, already written and ready), and this document can note the date
that happened rather than being deleted outright (a record of "we used to run on free tier, here's
why, and here's when that stopped" is more useful to keep than to erase).
