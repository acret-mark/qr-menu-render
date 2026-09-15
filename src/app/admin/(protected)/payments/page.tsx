import { adminGetPendingSubscriptions } from "@/lib/data-access/subscriptions";
import { PaymentQueueRow } from "@/components/admin/payment-queue-row";

// Payment Queue (specs/012-payment-queue). Session/isAdmin gate lives in
// admin/(protected)/layout.tsx — this page only reads its own data.
export default async function PaymentQueuePage() {
  const payments = await adminGetPendingSubscriptions();

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment Queue</h1>
        <p className="text-sm text-muted-foreground">Payment proofs waiting for verification.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {payments.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            All caught up — no payment proofs waiting for verification.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Proof</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <PaymentQueueRow key={payment.id} payment={payment} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
