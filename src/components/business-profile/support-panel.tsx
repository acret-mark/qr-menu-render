"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge } from "@/components/business-profile/ticket-status-badge";
import { TicketAwaitingResponse } from "@/components/business-profile/ticket-awaiting-response";
import { TicketResolved } from "@/components/business-profile/ticket-resolved";
import { submitSupportTicketAction } from "@/lib/support/actions";
import { formatAdminDate } from "@/lib/admin/format";
import type { SupportTicket } from "@/lib/data-access/support-tickets";

const FIELD_CLASSNAME =
  "rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * specs/022-owner-support-tab FR-010/FR-010a. Grouped by STATUS, not
 * reply presence — data-model.md's own inline pseudocode
 * (`ticket.adminReply ? "resolved" : "awaiting-response"`) contradicts its
 * own prose and FR-010a: a ticket manually marked "Resolved" via specs/021's
 * status control with no reply ever recorded must still use the resolved
 * presentation (with its explicit "No reply was recorded" fallback), which
 * an adminReply-presence check would incorrectly route to
 * TicketAwaitingResponse instead. Status-based grouping is the only
 * reading consistent with FR-010a and quickstart.md Scenario 3.3 (found
 * necessary during implementation, corrected in research.md).
 */
function presentationFor(ticket: SupportTicket): "awaiting-response" | "resolved" {
  return ticket.status === "resolved" ? "resolved" : "awaiting-response";
}

/**
 * specs/022-owner-support-tab. Renders every already-fetched ticket (full
 * rows, via getOwnSupportTickets) — selecting one shows its detail from
 * this same array, with no second per-ticket fetch (research.md addition:
 * getOwnSupportTicketById exists and is used elsewhere in this project's
 * codebase-audit sense, but this feature's own list read already returns
 * every field its detail view needs, so re-fetching by id on selection
 * would be a needless round trip — and, notably, means there is no code
 * path here where a client-supplied ticket id ever reaches a server call,
 * a stronger form of FR-013's isolation guarantee than a fresh fetch would
 * give).
 */
export function SupportPanel({ tickets }: { tickets: SupportTicket[] }) {
  const router = useRouter();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  if (selectedTicket) {
    const Presentation =
      presentationFor(selectedTicket) === "resolved" ? TicketResolved : TicketAwaitingResponse;
    return <Presentation ticket={selectedTicket} onBack={() => setSelectedTicketId(null)} />;
  }

  const canSubmit = subject.trim() !== "" && message.trim() !== "" && !isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    const result = await submitSupportTicketAction({ subject, message });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(
        result.reason === "no-business"
          ? "Couldn't find your business. Please try again."
          : "Please fill in both the subject and message."
      );
      return;
    }

    setSubject("");
    setMessage("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ticket-subject" className="text-sm font-medium">
            Subject
          </label>
          <input
            id="ticket-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's the issue about?"
            className={`h-11 ${FIELD_CLASSNAME}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ticket-message" className="text-sm font-medium">
            Message
          </label>
          <textarea
            id="ticket-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what's happening…"
            className={`min-h-28 py-2 ${FIELD_CLASSNAME}`}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={!canSubmit} className="h-11">
          {isSubmitting ? "Submitting…" : "Submit Ticket"}
        </Button>
      </form>

      <div className="border-t border-border pt-4">
        <div className="mb-2 text-sm font-semibold">Your Tickets</div>

        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t submitted any support tickets yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3.5 py-3 text-left hover:bg-muted"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{ticket.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      Submitted {formatAdminDate(ticket.createdAt)}
                    </span>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
