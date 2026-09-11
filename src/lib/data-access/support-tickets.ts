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

export async function adminReplyToSupportTicket(
  ticketId: string,
  reply: string
): Promise<SupportTicket | null> {
  const [ticket] = await db
    .update(supportTickets)
    .set({ adminReply: reply, repliedAt: new Date(), status: "in_progress" })
    .where(eq(supportTickets.id, ticketId))
    .returning();
  return ticket ?? null;
}
