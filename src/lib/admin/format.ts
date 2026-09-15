// Admin-panel display formatting (specs/012-payment-queue FR-012). Ported
// from qr-menu-dev's src/lib/admin/format.ts, adjusted for this project's
// "Unspecified" wording (spec FR-012's own text) and string-typed `amount`
// (Drizzle's `numeric` column type, unlike qr-menu-dev's Supabase client
// which returned it as a number).

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
};

export function formatPaymentMethod(method: string | null): string {
  if (!method) return "Unspecified";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function formatAdminDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPeso(amount: string): string {
  const n = Number(amount);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Days a pending payment has been waiting. `isStale` marks the 3-day
 * threshold the Payment Queue emphasizes (spec FR-014) — presentation
 * only: triggers no email, escalation, or state change, and commits to no
 * SLA.
 */
export const STALE_AFTER_DAYS = 3;

export function formatWaitingTime(createdAt: Date): { label: string; isStale: boolean } {
  const elapsedMs = Date.now() - createdAt.getTime();
  const days = Math.floor(elapsedMs / 86_400_000);

  if (days < 1) return { label: "Today", isStale: false };

  return {
    label: days === 1 ? "1 day" : `${days} days`,
    isStale: days >= STALE_AFTER_DAYS,
  };
}
