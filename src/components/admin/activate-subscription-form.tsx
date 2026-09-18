"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  activateSubscriptionAction,
  rejectSubscriptionAction,
} from "@/lib/admin/subscription-actions";
import type { PlanType } from "@/lib/data-access/subscriptions";
import { PLAN_PRICING } from "@/lib/subscriptions/pricing";
import { PaymentProofThumb } from "@/components/admin/payment-proof-thumb";
import { formatPaymentMethod, formatPeso } from "@/lib/admin/format";
import { Button } from "@/components/ui/button";

// Price context in the label (₱/month, from the single source of truth in
// PLAN_PRICING) rather than a plain plan name — matches qr-menu-dev's own
// activate-subscription-form.tsx PLAN_OPTIONS.
const PLAN_OPTIONS: { value: Exclude<PlanType, "trial">; label: string }[] = [
  { value: "standard", label: `Standard — ${formatPeso(PLAN_PRICING.standard)}/month` },
  { value: "pro", label: `Pro — ${formatPeso(PLAN_PRICING.pro)}/month` },
];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addOneMonth(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return toIsoDate(d);
}

export function ActivateSubscriptionForm({
  subscriptionId,
  businessName,
  submittedPlan,
  amount,
  paymentMethod,
  paymentProofUrl,
}: {
  subscriptionId: string;
  businessName: string;
  submittedPlan: Exclude<PlanType, "trial">;
  amount: string;
  paymentMethod: string | null;
  paymentProofUrl: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Exclude<PlanType, "trial">>(submittedPlan);
  const [startsAt, setStartsAt] = useState(() => toIsoDate(new Date()));
  const [expiresAt, setExpiresAt] = useState(() => addOneMonth(toIsoDate(new Date())));
  // Tracks whether the admin has deliberately overridden the computed
  // billing-end date themselves, same "Billing ends" field as qr-menu-dev's
  // activate-subscription-form.tsx — defaults to one month after the start
  // date but stays editable.
  const [expiresAtTouched, setExpiresAtTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function handleStartsAtChange(value: string) {
    setStartsAt(value);
    // Keep the billing window at one month unless the admin has deliberately
    // overridden the end date themselves.
    if (!expiresAtTouched) {
      setExpiresAt(addOneMonth(value));
    }
  }

  async function handleActivate() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setWarning(null);

    const result = await activateSubscriptionAction(
      subscriptionId,
      plan,
      new Date(`${startsAt}T00:00:00.000Z`),
      new Date(`${expiresAt}T00:00:00.000Z`)
    );

    setSubmitting(false);

    if (!result.ok) {
      setError("This subscription is no longer pending — it may have already been resolved.");
      router.refresh();
      return;
    }

    if (!result.emailSent) {
      setWarning("Activated, but the confirmation email failed to send.");
    }
    router.refresh();
  }

  async function handleReject() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await rejectSubscriptionAction(subscriptionId);
    setSubmitting(false);

    if (!result.ok) {
      setError("This subscription is no longer pending — it may have already been resolved.");
    }
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{businessName}</h2>
        <PaymentProofThumb url={paymentProofUrl} businessName={businessName} />
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Submitted plan</dt>
        <dd className="text-right capitalize">{submittedPlan}</dd>
        <dt className="text-muted-foreground">Amount</dt>
        <dd className="text-right">{formatPeso(amount)}</dd>
        <dt className="text-muted-foreground">Payment method</dt>
        <dd className="text-right">{formatPaymentMethod(paymentMethod)}</dd>
      </dl>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="activate-plan" className="text-sm font-medium">
          Plan to activate
        </label>
        <select
          id="activate-plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value as Exclude<PlanType, "trial">)}
          className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {PLAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="activate-starts-at" className="text-sm font-medium">
          Billing start date
        </label>
        <input
          id="activate-starts-at"
          type="date"
          value={startsAt}
          onChange={(e) => handleStartsAtChange(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="activate-expires-at" className="text-sm font-medium">
          Billing ends
        </label>
        <input
          id="activate-expires-at"
          type="date"
          value={expiresAt}
          onChange={(e) => {
            setExpiresAtTouched(true);
            setExpiresAt(e.target.value);
          }}
          className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      {warning && (
        <div className="rounded-lg bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
          {warning}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="lg" disabled={submitting} onClick={handleActivate} className="h-11 flex-1">
          {submitting ? "Working…" : "Activate"}
        </Button>
        <Button
          size="lg"
          variant="destructive"
          disabled={submitting}
          onClick={handleReject}
          className="h-11"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
