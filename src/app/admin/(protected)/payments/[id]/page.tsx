import { adminGetSubscriptionById } from "@/lib/data-access/subscriptions";
import { ActivateSubscriptionForm } from "@/components/admin/activate-subscription-form";
import { formatPaymentMethod, formatPeso } from "@/lib/admin/format";

// specs/013-activate-subscription. Session/isAdmin gate lives in
// admin/(protected)/layout.tsx (specs/012) — this page only reads its own
// data.
export default async function ActivateSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subscription = await adminGetSubscriptionById(id);

  if (!subscription) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Payment</h1>
        <p className="text-sm text-destructive">That payment couldn&apos;t be found.</p>
      </div>
    );
  }

  if (subscription.status !== "pending") {
    // FR-008 — a subscription that's already active/expired/cancelled shows
    // its current state, not a fresh activate/reject decision (also the
    // idempotent-re-open path for User Story 2).
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">{subscription.businessName}</h1>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm">
            This subscription is <span className="font-medium capitalize">{subscription.status}</span>
            {" "}— already resolved, not awaiting a decision.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="text-right capitalize">{subscription.plan}</dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="text-right">{formatPeso(subscription.amount)}</dd>
            <dt className="text-muted-foreground">Payment method</dt>
            <dd className="text-right">{formatPaymentMethod(subscription.paymentMethod)}</dd>
            {subscription.activatedAt && (
              <>
                <dt className="text-muted-foreground">Activated</dt>
                <dd className="text-right">
                  {subscription.activatedAt.toLocaleDateString("en-US")}
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Review Payment</h1>
      <ActivateSubscriptionForm
        subscriptionId={subscription.id}
        businessName={subscription.businessName}
        submittedPlan={subscription.plan === "trial" ? "standard" : subscription.plan}
        amount={subscription.amount}
        paymentMethod={subscription.paymentMethod}
        paymentProofUrl={subscription.paymentProofUrl}
      />
    </div>
  );
}
