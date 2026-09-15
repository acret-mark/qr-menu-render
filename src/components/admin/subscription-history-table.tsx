import { formatAdminDate, formatPaymentMethod, formatPeso } from "@/lib/admin/format";

// specs/018-business-detail FR-004/FR-005/SC-002. Every record regardless
// of status — no pending/active filter here (that's the Payments queue's
// job, specs/012).
export function SubscriptionHistoryTable({
  subscriptions,
}: {
  subscriptions: {
    id: string;
    createdAt: Date;
    plan: string;
    amount: string;
    paymentMethod: string | null;
    status: string;
  }[];
}) {
  if (subscriptions.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-muted-foreground">
        No subscription history yet.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="px-5 py-3 font-medium">Date</th>
          <th className="px-5 py-3 font-medium">Plan</th>
          <th className="px-5 py-3 font-medium">Amount</th>
          <th className="px-5 py-3 font-medium">Method</th>
          <th className="px-5 py-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {subscriptions.map((subscription) => (
          <tr key={subscription.id} className="border-b border-border last:border-none">
            <td className="px-5 py-3.5">{formatAdminDate(subscription.createdAt)}</td>
            <td className="px-5 py-3.5 capitalize">{subscription.plan}</td>
            <td className="px-5 py-3.5">{formatPeso(subscription.amount)}</td>
            <td className="px-5 py-3.5">{formatPaymentMethod(subscription.paymentMethod)}</td>
            <td className="px-5 py-3.5 capitalize">{subscription.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
