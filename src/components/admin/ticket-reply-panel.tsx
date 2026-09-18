"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyToTicketAction, setTicketStatusAction } from "@/lib/admin/support-ticket-actions";
import { Button } from "@/components/ui/button";
import { formatAdminDate } from "@/lib/admin/format";
import type { SupportTicket } from "@/lib/data-access/support-tickets";

const FIELD_CLASSNAME =
  "h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const TEXTAREA_CLASSNAME =
  "min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const STATUS_OPTIONS: { value: SupportTicket["status"]; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

// specs/021-support-ticket-management US2/US3. The status control (FR-010)
// calls adminSetTicketStatus directly and independently the moment it
// changes — it is never bundled into the reply submission (research.md
// Decision 2 chose a wholly separate function, not an optional parameter on
// the reply action). That immediate save is still not enough on its own,
// though: adminReplyToSupportTicket defaults to auto-resolving a ticket on
// reply (FR-009), and without also telling it about an admin's own explicit
// status pick, sending a reply right after changing the status would
// silently stomp that choice back to "resolved". `statusOverride` tracks
// only an admin-initiated change (never a mirrored copy of `ticket.status`,
// which would go stale between this change and the next `router.refresh()`)
// and is threaded into both the status control's displayed value and the
// reply submission, mirroring qr-menu-dev's own ticket-reply-panel.tsx.
export function TicketReplyPanel({ ticket }: { ticket: SupportTicket & { businessName: string } }) {
  const router = useRouter();
  const [reply, setReply] = useState(ticket.adminReply ?? "");
  const [statusOverride, setStatusOverride] = useState<SupportTicket["status"] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = statusOverride ?? ticket.status;
  const trimmedReply = reply.trim();

  async function handleStatusChange(nextStatus: SupportTicket["status"]) {
    setStatusOverride(nextStatus);
    setIsChangingStatus(true);
    setError(null);
    try {
      const result = await setTicketStatusAction(ticket.id, nextStatus);
      if (!result.ok) {
        setError("That ticket couldn't be found anymore.");
        return;
      }
      router.refresh();
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleSendReply() {
    if (!trimmedReply) return; // FR-008: reject an empty reply, nothing saved
    setIsSubmitting(true);
    setError(null);
    try {
      // Only passes an explicit status when the admin actually changed the
      // control themselves — otherwise omit it so the server's "resolved"
      // default (FR-009) applies.
      const result = await replyToTicketAction(
        ticket.id,
        trimmedReply,
        statusOverride ?? undefined
      );
      if (!result.ok) {
        setError(
          result.reason === "empty-reply"
            ? "Please write a reply before sending."
            : "That ticket couldn't be found anymore."
        );
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h1 className="text-lg font-semibold">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground">{ticket.businessName}</p>
      </div>

      <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <label htmlFor="ticket-status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="ticket-status"
          value={status}
          disabled={isChangingStatus}
          onChange={(e) => handleStatusChange(e.target.value as SupportTicket["status"])}
          className={FIELD_CLASSNAME}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {ticket.adminReply && ticket.repliedAt && (
        <p className="text-xs text-muted-foreground">
          Last replied {formatAdminDate(ticket.repliedAt)}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reply-message" className="text-sm font-medium">
          Reply to this ticket
        </label>
        <textarea
          id="reply-message"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply to this ticket…"
          className={TEXTAREA_CLASSNAME}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="button"
        disabled={isSubmitting || trimmedReply.length === 0}
        onClick={handleSendReply}
      >
        {isSubmitting ? "Sending…" : "Send Reply"}
      </Button>
    </div>
  );
}
