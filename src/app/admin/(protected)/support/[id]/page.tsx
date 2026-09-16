import { adminGetSupportTicketById } from "@/lib/data-access/support-tickets";
import { adminGetBusinessById } from "@/lib/data-access/businesses";
import { TicketReplyPanel } from "@/components/admin/ticket-reply-panel";

// specs/021-support-ticket-management. Session/isAdmin gate lives in
// admin/(protected)/layout.tsx (specs/012) — this page only reads its own
// data.
export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await adminGetSupportTicketById(id);

  if (!ticket) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Ticket</h1>
        <p className="text-sm text-destructive">That ticket couldn&apos;t be found.</p>
      </div>
    );
  }

  const business = await adminGetBusinessById(ticket.businessId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <TicketReplyPanel ticket={{ ...ticket, businessName: business?.name ?? "Unknown business" }} />
    </div>
  );
}
