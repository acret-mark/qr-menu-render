# Render Hosting Report: Blockers & Limitations vs. Vercel + Supabase

**Date**: 2026-09-14
**Scope**: What actually broke, and what's structurally different or riskier, moving hosting from
Vercel + Supabase (`qr-menu-dev`) to Render (`qr-menu-render`). Everything in the "Proven" section
below was hit for real during this migration's first live deployment — not theoretical. The
"Possible" section is real risk, reasoned from what Render's platform actually does, but not
(yet) something that has broken this project in practice.

One framing note before the findings: a few items below trace back to swapping Supabase Auth for
Auth.js, not to Render itself — that's a consequence of the wider migration (Render Postgres has
no `auth` schema, so Supabase Auth couldn't come along), not a hosting-platform complaint. They're
included because they only surfaced *because of* the new hosting environment, but it would be
inaccurate to call them "Render's fault" outright. Each is labeled below.

---

## Proven blockers (actually happened, in the order encountered)

### 1. Render's Blueprint spec has no top-level `crons:` key
**What happened**: `render.yaml` declared cron jobs under a top-level `crons:` array (mirroring
how `vercel.json`'s `crons` array works). Render's Blueprint validator rejected it outright:
`crons: not found in type file.service`.
**Fix**: Cron jobs are `services:` entries with `type: cron` — same shape as `type: web`, no
separate top-level construct.
**Vercel comparison**: `vercel.json`'s `crons` array is exactly the flat, top-level shape we
initially assumed Render would also use. It doesn't.

### 2. `envVarGroups` can't be referenced at the service level in a flat Blueprint
**What happened**: Env vars shared between a Web Service and its Cron Jobs (so a cron's bearer
token matches what the route expects) were put in a top-level `envVarGroups:` block and
referenced from each service via `envVarGroups: [group-name]`. Render's validator rejected this
too: `envVarGroups: not found in type file.service`. Render's own docs example for this feature is
misleading for a flat Blueprint — env var groups only attach at the `projects:`/`environments:`
grouping level, which this project's flat `services:`/`databases:` Blueprint doesn't use.
**Fix**: No group-based sharing at all in a flat Blueprint. Each service declares its own env vars
directly.
**Vercel comparison**: A Vercel project's environment variables are simply shared across every
function/cron in that project by default — no separate grouping construct to learn or get wrong.

### 3. No mechanism to share a custom secret between two services
**What happened**: Tried Render's `fromService` field to have a Cron Job pull `CRON_SECRET`
directly from its Web Service. Rejected: `fromService: cannot refer to property and env var` (and
separately, `fromService.type: empty but required` on a second attempt). `fromService` turns out
to only expose fixed, built-in service properties (`host`, `connectionString`, etc.) — not an
arbitrary custom environment variable one service generated.
**Fix**: `CRON_SECRET` is `sync: false` (manually entered) identically on every service that needs
it. This is a real, standing operational risk: nothing validates the values actually match; a
copy-paste mistake silently breaks cron authentication with no error until a scheduled run fails
quietly.
**Vercel comparison**: N/A directly (Vercel doesn't have a separate Cron "service" needing its own
copy of a secret at all — see finding 4).

### 4. Cron Jobs have no free plan on Render, at all
**What happened**: The free-tier interim Blueprint tried `plan: free` on a `type: cron` service.
Render's live validator rejected it: `free not a valid plan for service type cron` — contradicting
what Render's own docs summary suggested when checked beforehand.
**Fix**: The two scheduled jobs (`payment-reminders`, `subscription-expiry`) are simply not
deployed on the free interim tier at all. Documented in `docs/known-limitations.md` as a real,
current functional gap, not a latency inconvenience.
**Vercel comparison**: Vercel's Hobby (free) tier includes cron jobs at no extra cost — this is a
capability the free interim deployment structurally cannot match, not a workaround-able one.

### 5. Render's build sets `NODE_ENV=production`, which makes `npm ci` skip `devDependencies`
**What happened**: First real deploy failed in ~28 seconds — far too fast for a real Next.js
build — with `Error: Cannot find module '@tailwindcss/postcss'`. `@tailwindcss/postcss` was
(reasonably, by normal convention) a `devDependency`. Render's build environment installed only
432 of ~690 packages, silently skipping every `devDependency` because `NODE_ENV=production` was
set.
**Fix**: `buildCommand` changed to `npm ci --include=dev && npm run build`, forcing dev
dependencies to install regardless of `NODE_ENV`. Reproduced locally first
(`NODE_ENV=production npm ci` → 430 packages, build fails; `--include=dev` → 522+ packages, build
succeeds) before pushing, to avoid a fifth blind guess against Render's validator.
**Vercel comparison**: Vercel's build pipeline installs `devDependencies` regardless of `NODE_ENV`
— this is standard, undocumented-because-it-just-works behavior there. Render's is not.

### 6. Auth.js returns HTTP 500 behind Render's proxy without `trustHost: true`
**What happened** *(migration-consequence, not purely a Render complaint — see framing note
above)*: `/api/auth/csrf` returned `{"message":"There was a problem with the server
configuration."}` (HTTP 500) on the live deployment. Auth.js v5 rejects requests from a host it
doesn't recognize by default, and Render sits behind a proxy/CDN (Cloudflare, visible in response
headers) that trips this.
**Fix**: `trustHost: true` in `auth.config.ts` — Auth.js's documented requirement for
Render/Railway/Fly.io/Docker-style deployments.
**Vercel comparison**: This class of problem is specific to self-hosting Auth.js behind a
proxy — it didn't exist in `qr-menu-dev` at all, because that app used Supabase Auth, not Auth.js.
Not a like-for-like Vercel comparison so much as a new failure mode introduced by the auth-library
swap this migration also required.

### 7. Auth.js redirects went to `https://localhost:10000` in production
**What happened** *(same migration-consequence caveat as #6)*: Even after fixing #6, a real login
redirected to `https://localhost:10000` — Render's internal container port — instead of the real
domain. `trustHost` only covers CSRF/host validation, not redirect URL construction.
**Fix**: Explicit `AUTH_URL` env var set to the real deployed URL.

---

## Possible / structural limitations (real, but not "broken" yet)

### 8. Free Postgres is deleted after 30 days — confirmed, not assumed
Render's dashboard states outright: *"Your database will expire on October 14, 2026. The database
will be deleted unless you upgrade to a paid compute plan."* (created 2026-09-14 — exactly 30
days). This is a hard deletion, not a pause: recreating it means re-pushing the schema and losing
all interim data. **Supabase comparison**: Supabase's free tier *pauses* an inactive project
(recoverable) rather than deleting it outright — Render's free-tier failure mode is more
destructive, not just similarly time-limited.

### 9. Cold starts are real and visually jarring — confirmed live, inconsistently
An automated `curl`-based measurement (three samples across a 20-minute window) failed to catch a
cold start at all (all returned in <300ms) — likely because `render.yaml`'s own
`healthCheckPath: /api/health` polling kept the service warm. But opening the URL in an actual
browser after longer idle time triggered Render's full branded "waking up" splash screen. **Vercel
comparison**: Vercel's serverless cold starts are typically sub-second-to-a-few-seconds and
transparent (the response is just slower; there's no interstitial branded page shown to the end
user). Render's free-tier cold start is both slower and visibly branded as "someone else's
infrastructure," which reads poorly for an end customer scanning a QR code expecting a menu.

### 10. No SLA / uptime guarantee on free tier
Structural, not a measurement — free tier carries none of a paid plan's uptime or support
guarantees. Neither Vercel's nor Supabase's free tiers make production uptime promises either, so
this isn't a Render-specific regression, but it's still a real gap between the interim environment
and anything production-grade.

### 11. No Node version pinned anywhere in this project yet
There's no `.nvmrc`, no `engines` field in `package.json`, no explicit `NODE_VERSION` env var.
It has worked so far, but it's a latent risk: Render could silently change its default Node
version out from under the project. Vercel's Next.js integration is more opinionated about
keeping the Node runtime aligned with the framework version, so this class of drift is less likely
to bite silently there. Worth pinning explicitly before this matters more.

### 12. The Blueprint-as-code learning curve had a real engineering time cost
Four distinct, live-validator-confirmed schema errors (findings 1–4 above) were hit before a
working `render.yaml` was reached — each one required either a failed deploy/validation round
trip or an external documentation lookup, and the documentation itself turned out to be wrong or
misleading on two separate points (`fromService`'s actual capabilities, and cron jobs supposedly
having a free plan). `qr-menu-dev`'s equivalent `vercel.json` needed zero iteration to get right.
This is a real, if one-time, cost of the migration — not a recurring operational limitation, but
worth naming so it's not invisible in hindsight.

### 13. Region choice needs a deliberate decision, not a default
This project's services were pinned to Render's `singapore` region (reasonable for a
Philippines-focused audience), but that's a manual per-service choice made once during setup —
worth reconfirming it's still the right call before the paid cutover, since Vercel's edge network
sidesteps a single-region choice entirely by design.

---

## Summary table

| # | Issue | Category | Vercel/Supabase had this? |
|---|---|---|---|
| 1 | No top-level `crons:` key | Proven | No — `vercel.json` crons are top-level |
| 2 | `envVarGroups` needs `projects:`/`environments:` | Proven | No — env vars are just project-level |
| 3 | No native cross-service secret sharing | Proven | N/A — no separate cron "service" |
| 4 | No free plan for Cron Jobs | Proven | No — Vercel Hobby includes cron |
| 5 | `npm ci` skips devDependencies under `NODE_ENV=production` | Proven | No — Vercel installs dev deps regardless |
| 6 | Auth.js 500s behind Render's proxy without `trustHost` | Proven (migration-driven) | N/A — qr-menu-dev used Supabase Auth |
| 7 | Auth.js redirects default to `localhost:10000` | Proven (migration-driven) | N/A — same reason as #6 |
| 8 | Free Postgres deleted after 30 days | Possible/confirmed structural | Partially — Supabase pauses, doesn't delete |
| 9 | Cold starts, visibly branded | Possible/confirmed structural | Partially — Vercel's are faster & invisible |
| 10 | No free-tier SLA | Possible/structural | Same on both platforms' free tiers |
| 11 | No Node version pinned | Possible/latent | Less likely to drift on Vercel |
| 12 | Blueprint-as-code iteration cost | One-time engineering cost | `vercel.json` needed no iteration |
| 13 | Manual region choice | Possible/structural | Vercel's edge network avoids this choice |

## Bottom line

None of these are individually severe, and all thirteen are now fixed, documented, or accepted as
known tradeoffs (see `docs/known-limitations.md` for the currently-live free-tier specifics). But
collectively they represent real engineering time this migration spent that `qr-menu-dev`'s
original Vercel + Supabase setup never asked for — worth having on record for whoever weighs the
$13/mo paid-tier request (`specs/003-render-feasibility-poc`) against "just leave it on Vercel,"
since the honest answer is "Render is materially cheaper, but not zero-friction to run."
