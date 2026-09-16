"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  adminReplyToSupportTicket,
  adminSetTicketStatus,
  type SupportTicket,
} from "@/lib/data-access/support-tickets";

export type ReplyToTicketResult = { ok: true; ticket: SupportTicket } | { ok: false; reason: "empty-reply" | "not-found" };

/**
 * specs/021-support-ticket-management FR-005/FR-007/FR-008/FR-009.
 * requireAdmin() throws for a non-admin caller (fail-closed, matching every
 * other admin-scoped action in this project) — defense in depth against a
 * direct server-action call bypassing the UI.
 */
export async function replyToTicketAction(ticketId: string, reply: string): Promise<ReplyToTicketResult> {
  await requireAdmin();

  const trimmed = reply.trim();
  if (!trimmed) return { ok: false, reason: "empty-reply" };

  const ticket = await adminReplyToSupportTicket(ticketId, trimmed);
  if (!ticket) return { ok: false, reason: "not-found" };

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { ok: true, ticket };
}

export type SetTicketStatusResult = { ok: true; ticket: SupportTicket } | { ok: false; reason: "not-found" };

/**
 * specs/021-support-ticket-management FR-010/FR-011 — status-only, never
 * touches adminReply/repliedAt (structurally guaranteed by
 * adminSetTicketStatus itself, research.md Decision 2).
 */
export async function setTicketStatusAction(
  ticketId: string,
  status: SupportTicket["status"]
): Promise<SetTicketStatusResult> {
  await requireAdmin();

  const ticket = await adminSetTicketStatus(ticketId, status);
  if (!ticket) return { ok: false, reason: "not-found" };

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { ok: true, ticket };
}
