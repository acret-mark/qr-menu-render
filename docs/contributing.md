# Contributing

## The data-access-layer rule (read before touching any tenant-scoped table)

This project has no Postgres Row-Level Security — `qr-menu-dev`'s RLS is what this rule replaces
(see the project constitution, Principle II, and
`ai_workspace/projects/qr-menu-render/specs/002-authjs-authorization/contracts/data-access-layer.md`
for the full contract).

**No page, server action, or route handler may query a tenant-scoped table
(`businesses`, `categories`, `items`, `ingredients`, `item_ingredients`, `item_translations`,
`category_translations`, `ingredient_translations`, `subscriptions`, `support_tickets`) directly.**
Always go through `src/lib/data-access/*.ts`. Every exported function there is one of three
shapes:

1. **Owner-scoped** (`getOwn*`/`createOwn*`/`updateOwn*`) — takes the authenticated caller's
   `ownerId` as its first parameter, resolves their own business internally, and scopes every
   query to it. Never accepts a bare `businessId`/`categoryId` from client input without checking
   it belongs to that owner.
2. **Admin-scoped** (`adminGetAll*`/`adminMutate*`) — assumes the caller's route/action already
   called `requireAdmin()` (`src/lib/auth/session.ts`) before invoking it. The function itself
   does not re-check.
3. **Public-scoped** (`getPublic*`) — no identity parameter; filters only on business visibility.

When reviewing a PR that touches one of the tables above: if you see a raw Drizzle/SQL query
outside `src/lib/data-access/`, that's a request for changes, not a nitpick — it's the thing this
whole application-layer authorization model depends on.

## Verifying cross-tenant isolation

Any PR that adds a new data-access function must be checked against
`specs/002-authjs-authorization/quickstart.md`'s Scenario 2 (two independent test businesses,
confirm neither can read/write the other's data through any entry point) before merging. This is
a standing regression check, not a one-time task — Constitution Principle V treats it as a
release gate.
