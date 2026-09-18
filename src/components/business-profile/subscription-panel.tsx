"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitPayment } from "@/lib/business-profile/actions";
import { PLAN_PRICING } from "@/lib/subscriptions/pricing";
import { PaymentProofUploader } from "@/components/business-profile/payment-proof-uploader";
import { Button } from "@/components/ui/button";

const PLAN_LABELS: Record<"standard" | "pro", string> = { standard: "Standard", pro: "Pro" };
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending verification",
  expired: "Expired",
  cancelled: "Cancelled",
};

type LatestSubscription = {
  plan: "standard" | "pro" | "trial";
  status: string;
  paymentMethod: string | null;
  expiresAt: Date | string | null;
} | null;

// specs/014-owner-subscription-tab. US1 (display) + US2 (submission) +
// US3 (upgrade) live in one component per plan.md/tasks.md's own
// structure.
//
// The payment instructions/submission form is ALWAYS shown, regardless of
// `latest.status` — matching qr-menu-dev's current shipped behavior
// (src/components/subscription/subscription-panel.tsx), not the earlier,
// superseded FR-004 revision this component used to target. A healthy
// trial/paid subscription sits at status "active" for its entire life,
// right up until the expiry cron flips it to "expired" — which only
// happens once the grace period has already elapsed, i.e. after the owner
// is already locked out. Gating this block on status !== "active" (the old
// behavior) meant the T-7/T-1/T-0 reminder emails told owners to "submit
// your renewal payment" / "upgrade" here, but the form wasn't actually
// rendered until it was too late to matter. Submitting early while still
// "active" is harmless — worst case is a redundant pending row an admin
// reviews.
export function SubscriptionPanel({
  currentPlan,
  latest,
  isTrial,
}: {
  currentPlan: "standard" | "pro";
  latest: LatestSubscription;
  isTrial: boolean;
}) {
  const router = useRouter();

  const [targetPlan, setTargetPlan] = useState<"current" | "pro">("current");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isProofUploading, setIsProofUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canOfferUpgrade = currentPlan === "standard";
  const payingForPlan: "standard" | "pro" = targetPlan === "pro" ? "pro" : currentPlan;
  const canSubmit = !!proofUrl && !isProofUploading && !submitting;

  const statusLabel = useMemo(() => {
    if (!latest) return isTrial ? "Trial" : "No subscription yet";
    return STATUS_LABELS[latest.status] ?? latest.status;
  }, [latest, isTrial]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    const formData = new FormData();
    formData.set("plan", payingForPlan);
    formData.set("paymentMethod", paymentMethod);
    formData.set("paymentProofUrl", proofUrl!);

    const result = await submitPayment(formData);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setProofUrl(null);
    setTargetPlan("current");
    setSubmitted(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-4 rounded-lg border border-border bg-muted p-5">
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-lg font-semibold">
            {currentPlan === "pro" ? PLAN_LABELS.pro : PLAN_LABELS.standard}
          </span>
          <span className="text-sm font-medium">{statusLabel}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">₱{PLAN_PRICING[currentPlan]} / month</p>
        {latest?.expiresAt && (
          <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 text-sm text-muted-foreground">
            <span>{isTrial ? "Trial ends" : "Renews / expires"}</span>
            <span className="font-medium text-foreground">
              {new Date(latest.expiresAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        {latest?.paymentMethod && (
          <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 text-sm text-muted-foreground">
            <span>Payment method</span>
            <span className="font-medium text-foreground">
              {latest.paymentMethod === "gcash" ? "GCash" : "Bank Transfer"}
            </span>
          </div>
        )}
      </div>

      <div className="mx-4 rounded-lg border border-border p-4 text-sm">
        <p className="font-medium">Manual payment instructions</p>
        <p className="mt-2 text-muted-foreground">
          GCash: 0917-123-4567 (Hapag Inc.)
          <br />
          Bank Transfer: BDO Savings — 1234-5678-90 (Hapag Inc.)
        </p>
        <p className="mt-2 text-muted-foreground">
          After paying, choose your method and upload proof below.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 px-4">
        {targetPlan === "pro" ? (
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm">
            <span className="font-medium text-primary">
              Paying for: Pro (₱{PLAN_PRICING.pro}/month)
            </span>
            <button
              type="button"
              onClick={() => setTargetPlan("current")}
              className="text-xs font-medium text-muted-foreground underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          canOfferUpgrade && (
            <button
              type="button"
              onClick={() => setTargetPlan("pro")}
              className="text-center text-sm font-semibold text-primary"
            >
              Upgrade to Pro — ₱{PLAN_PRICING.pro}/month →
            </button>
          )
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-method" className="text-sm font-medium">
            Payment method
          </label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="gcash">GCash</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <PaymentProofUploader
          proofUrl={proofUrl}
          onProofChange={setProofUrl}
          onUploadingChange={setIsProofUploading}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
        {submitted && (
          <div className="rounded-lg bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
            Payment proof submitted — we&apos;ll verify it shortly.
          </div>
        )}

        <Button type="submit" disabled={!canSubmit} className="mt-1 h-11">
          {submitting
            ? "Submitting…"
            : payingForPlan === "pro"
              ? "Submit Pro Upgrade Payment"
              : "Submit for Verification"}
        </Button>
      </form>
    </div>
  );
}
