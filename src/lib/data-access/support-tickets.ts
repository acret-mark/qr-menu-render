import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { supportTickets } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type SupportTicket = typeof supportTickets.$inferSelect;

export async function getOwnSupportTickets(ownerId: string): Promise<SupportTicket[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db.select().from(supportTickets).where(eq(supportTickets.businessId, business.id));
}

export async function createOwnSupportTicket(
  ownerId: string,
  input: { subject: string; message: string }
): Promise<SupportTicket | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [ticket] = await db
    .insert(supportTickets)
    .values({ businessId: business.id, subject: input.subject, message: input.message })
    .returning();
  return ticket;
}

export async function getOwnSupportTicketById(
  ownerId: string,
  ticketId: string
): Promise<SupportTicket | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.businessId, business.id)))
    .limit(1);
  return ticket ?? null;
}

// ---- Admin-scoped (contracts/data-access-layer.md category 2) ----

export async function adminGetAllSupportTickets(): Promise<SupportTicket[]> {
  return db.select().from(supportTickets);
}

/**
 * specs/018-business-detail: mirrors adminGetAllSubscriptionsForBusiness's
 * exact per-business shape — avoids fetching every business's tickets just
 * to check one business's existence signal (FR-008).
 */
export async function adminGetSupportTicketsForBusiness(
  businessId: string
): Promise<SupportTicket[]> {
  return db.select().from(supportTickets).where(eq(supportTickets.businessId, businessId));
}

/**
 * specs/021-support-ticket-management FR-009 (research.md Decision 1):
 * replying always auto-resolves — fixed from a pre-existing, uncalled
 * "in_progress" default that contradicted this spec's own requirement.
 */
export async function adminReplyToSupportTicket(
  ticketId: string,
  reply: string
): Promise<SupportTicket | null> {
  const [ticket] = await db
    .update(supportTickets)
    .set({ adminReply: reply, repliedAt: new Date(), status: "resolved" })
    .where(eq(supportTickets.id, ticketId))
    .returning();
  return ticket ?? null;
}

/**
 * specs/021-support-ticket-management, added beyond the original plan
 * (research.md) — the detail view (`/admin/support/[id]`) needs a
 * single-ticket-by-id read; only an all-tickets and a per-business read
 * existed before this feature.
 */
export async function adminGetSupportTicketById(ticketId: string): Promise<SupportTicket | null> {
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  return ticket ?? null;
}

/**
 * specs/021-support-ticket-management FR-010/FR-011, research.md Decision
 * 2. Status-only write — the `SET` clause structurally can never touch
 * `adminReply`/`repliedAt`, guaranteeing FR-011 by construction rather than
 * by care at each call site.
 */
export async function adminSetTicketStatus(
  ticketId: string,
  status: SupportTicket["status"]
): Promise<SupportTicket | null> {
  const [ticket] = await db
    .update(supportTickets)
    .set({ status })
    .where(eq(supportTickets.id, ticketId))
    .returning();
  return ticket ?? null;
}
