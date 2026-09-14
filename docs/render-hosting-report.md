# Render Hosting Report: Current Limitations vs. Vercel + Supabase

**Date**: 2026-09-14 (revised)
**Scope**: What's still actually true and unresolved about hosting on Render, compared to what
`qr-menu-dev`'s original Vercel + Supabase setup did or didn't need. An earlier version of this
report also listed the config/schema/build errors hit while first setting up `render.yaml` and
Auth.js — those all now have working fixes deployed and confirmed live, so they've been removed
here; this version covers only what remains a real, current limitation, not solved-and-working
history.

---

## Current limitations

### 1. No scheduled/cron jobs run on the free interim tier at all
Render has no free plan for its Cron Job service type — confirmed directly by its live Blueprint
validator (`free not a valid plan for service type cron`), contradicting what Render's own docs
summary suggested. Rather than pay for cron on an otherwise-free deployment, `payment-reminders`
and `subscription-expiry` are simply not deployed on the interim tier at all — see
`docs/known-limitations.md`. **Vercel comparison**: Vercel's Hobby (free) tier includes cron jobs
at no extra cost — this is a capability the free interim deployment structurally cannot match
until the paid tier is funded.

### 2. Free Postgres is deleted (not paused) after 30 days — confirmed, not assumed
Render's dashboard states outright: *"Your database will expire on October 14, 2026. The database
will be deleted unless you upgrade to a paid compute plan."* (created 2026-09-14 — exactly 30
days). Recreating it means re-pushing the schema and losing all interim data. **Supabase
comparison**: Supabase's free tier *pauses* an inactive project (recoverable) rather than deleting
it outright — Render's free-tier failure mode here is more destructive, not just similarly
time-limited.

### 3. Cold starts are real, but inconsistent to catch, and worse than Vercel's
An automated `curl`-based measurement (three samples across a 20-minute window) failed to catch a
cold start at all — likely because `render.yaml`'s own `healthCheckPath` polling kept the service
warm. But opening the URL in an actual browser after longer idle time triggered Render's full
branded "waking up" splash screen. **Vercel comparison**: Vercel's serverless cold starts are
typically sub-second-to-a-few-seconds and transparent (the response is just slower; no
interstitial branded page). Render's free-tier cold start is both slower and visibly
branded as "someone else's infrastructure" — worse for an end customer scanning a QR code
expecting a menu to just appear.

### 4. No SLA / uptime guarantee on free tier
Structural, not a measurement — free tier carries none of a paid plan's uptime or support
guarantees. Neither Vercel's nor Supabase's free tiers promise production uptime either, so this
isn't a Render-specific regression, but it's still a real gap between the interim environment and
anything production-grade.

---

## Latent risks worth watching (not a problem yet)

### 5. No Node version pinned anywhere in this project
There's no `.nvmrc`, no `engines` field in `package.json`, no explicit `NODE_VERSION` env var. It
has worked so far, but Render could silently change its default Node version out from under the
project. Vercel's Next.js integration is more opinionated about keeping the Node runtime aligned
with the framework version, so this class of drift is less likely to bite silently there. Worth
pinning explicitly before this matters more.

### 6. Region choice needs a deliberate decision, not a default
This project's services were pinned to Render's `singapore` region (reasonable for a
Philippines-focused audience), but that's a manual per-service choice made once during setup —
worth reconfirming it's still the right call before the paid cutover, since Vercel's edge network
sidesteps a single-region choice entirely by design.

---

## Summary table

| # | Issue | Vercel/Supabase had this? |
|---|---|---|
| 1 | No free plan for Cron Jobs | No — Vercel Hobby includes cron |
| 2 | Free Postgres deleted after 30 days | Partially — Supabase pauses, doesn't delete |
| 3 | Cold starts, visibly branded | Partially — Vercel's are faster & invisible |
| 4 | No free-tier SLA | Same on both platforms' free tiers |
| 5 | No Node version pinned | Less likely to drift on Vercel |
| 6 | Manual region choice | Vercel's edge network avoids this choice |

## Bottom line

Everything that was actually broken during setup (Blueprint schema mismatches, the build silently
dropping dev dependencies, Auth.js needing explicit host/redirect config behind Render's proxy) is
now fixed and working — that history has been removed from this report on request. What's left is
what's structurally still true about the free/interim tier specifically: no cron support, a
database on a 30-day countdown, occasionally-visible cold starts, and no uptime guarantee. None of
these are severe, and all are documented with concrete next steps in `docs/known-limitations.md` —
but they're the honest reason this environment stays "interim," not something to run production
traffic on.
