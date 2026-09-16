import Link from "next/link";
import type { PendingSubscriptionRow } from "@/lib/data-access/subscriptions";
import { PaymentProofThumb } from "@/components/admin/payment-proof-thumb";
import { formatAdminDate, formatPaymentMethod, formatPeso, formatWaitingTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

// One payment-queue row (specs/012-payment-queue FR-003/FR-004/FR-007/FR-014).
export function PaymentQueueRow({ payment }: { payment: PendingSubscriptionRow }) {
  const waiting = formatWaitingTime(payment.createdAt);

  return (
    <tr className="border-b border-border last:border-none hover:bg-muted">
      <td className="px-5 py-3.5">{payment.businessName}</td>
      <td className="px-5 py-3.5 capitalize">{payment.plan}</td>
      <td className="px-5 py-3.5">{formatPeso(payment.amount)}</td>
      <td className="px-5 py-3.5">{formatPaymentMethod(payment.paymentMethod)}</td>
      <td className="px-5 py-3.5">
        <PaymentProofThumb url={payment.paymentProofUrl} businessName={payment.businessName} />
      </td>
      <td className="px-5 py-3.5">
        {formatAdminDate(payment.createdAt)}
        <div
          className={cn(
            "mt-0.5 text-xs",
            waiting.isStale ? "font-medium text-warning" : "text-muted-foreground"
          )}
        >
          {waiting.label}
        </div>
      </td>
      <td className="px-5 py-3.5">
        {/* Subscription-scoped, not business-scoped (one business can have
            more than one pending payment, spec Edge Cases). Destination
            screen's own content is a future spec (FR-007). */}
        <Link
          href={`/admin/payments/${payment.id}`}
          className="inline-flex items-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Review
        </Link>
      </td>
    </tr>
  );
}
