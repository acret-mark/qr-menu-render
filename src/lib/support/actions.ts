"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createOwnSupportTicket, type SupportTicket } from "@/lib/data-access/support-tickets";

export type SubmitSupportTicketResult =
  | { ok: true; ticket: SupportTicket }
  | { ok: false; reason: "empty-fields" | "no-business" };

/**
 * specs/022-owner-support-tab FR-001–FR-004. `createOwnSupportTicket`
 * already resolves the business from the authenticated ownerId — never a
 * client-supplied value (FR-004).
 */
export async function submitSupportTicketAction(input: {
  subject: string;
  message: string;
}): Promise<SubmitSupportTicketResult> {
  const user = await requireUser();

  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message) {
    return { ok: false, reason: "empty-fields" };
  }

  const ticket = await createOwnSupportTicket(user.id, { subject, message });
  if (!ticket) return { ok: false, reason: "no-business" };

  revalidatePath("/business-profile");
  return { ok: true, ticket };
}
