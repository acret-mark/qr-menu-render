// specs/014-owner-subscription-tab (research.md Decision 4). No existing
// pricing constant anywhere in this codebase to reuse —
// adminGrantActiveSubscription always inserts "0" (a free admin grant, not
// a paid submission). String values match subscriptions.amount's numeric
// Drizzle type (already represented as a string elsewhere, e.g. items.price).
export const PLAN_PRICING: Record<"standard" | "pro", string> = {
  standard: "299.00",
  pro: "399.00",
};
