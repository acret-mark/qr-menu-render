/**
 * The one place the seeded demo business's slug is defined
 * (specs/030-marketing-homepage FR-009).
 *
 * ⚠️ PLACEHOLDER VALUE — no business exists at this slug yet. Per this
 * feature's own tasks.md T023, a real business must be registered through
 * the normal owner-registration + admin-activation flow (ideally on the
 * Pro tier, with at least one category and a few items) and this constant
 * updated to its real slug before `/demo` shows real content. Until then,
 * `/demo` falls through to whatever `/menu/[slug]` already renders for a
 * nonexistent/inactive slug — expected, not a bug.
 */
export const DEMO_BUSINESS_SLUG = "hapag-demo";
