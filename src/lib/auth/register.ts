import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword } from "./password";
import { randomSlug, slugify } from "./slug";
import { createOwnBusiness, slugExists } from "@/lib/data-access/businesses";
import { sendWelcomeEmail } from "@/lib/email/send-welcome-email";

const MAX_SLUG_ATTEMPTS = 25;

export type RegisterOwnerInput = {
  businessName: string;
  email: string;
  password: string;
};

export type RegisterOwnerResult =
  | { ok: true }
  | { ok: false; stage: "duplicate-email" | "business"; message: string };

const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists.";
const BUSINESS_SETUP_FAILED_MESSAGE =
  "Your account was created, but we couldn't finish setting up your business. Please contact support.";

async function generateUniqueSlug(businessName: string): Promise<string> {
  const baseSlug = slugify(businessName) || randomSlug();
  let candidate = baseSlug;
  let suffix = 1;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    if (!(await slugExists(candidate))) {
      return candidate;
    }
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  // Exhausted attempts (astronomically unlikely at this scale) — fall back
  // to a random suffix rather than failing registration outright.
  return `${baseSlug}-${randomSlug()}`;
}

/**
 * Replaces qr-menu-dev's Supabase `signUp` + RLS-gated business insert
 * (specs/002-authjs-authorization FR-001/FR-002). This function itself
 * still only creates the user/business rows and sends the welcome email —
 * it does not sign the owner in. Its caller (registerAction,
 * src/lib/auth/actions.ts) requires the owner to confirm their email
 * before establishing a session (specs/011-email-confirmation), reversing
 * this project's original "not required for v1" decision.
 */
export async function registerOwner({
  businessName,
  email,
  password,
}: RegisterOwnerInput): Promise<RegisterOwnerResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Same generic duplicate-email message regardless of whether the existing
  // account is an owner or admin (FR-002) — never reveal which.
  if (existing) {
    return { ok: false, stage: "duplicate-email", message: DUPLICATE_EMAIL_MESSAGE };
  }

  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const [user] = await db
      .insert(users)
      .values({ email: normalizedEmail, passwordHash })
      .returning({ id: users.id });
    userId = user.id;
  } catch (err) {
    // Race: another request inserted the same email between the check above
    // and this insert. Postgres unique_violation is 23505.
    if ((err as { code?: string })?.code === "23505") {
      return { ok: false, stage: "duplicate-email", message: DUPLICATE_EMAIL_MESSAGE };
    }
    throw err;
  }

  const slug = await generateUniqueSlug(businessName);

  try {
    await createOwnBusiness(userId, { name: businessName, slug });
  } catch (err) {
    console.error("Failed to create business row for owner", userId, err);
    return { ok: false, stage: "business", message: BUSINESS_SETUP_FAILED_MESSAGE };
  }

  // Fire-and-forget: a welcome-email failure must never turn a successful
  // registration into a failure result, matching qr-menu-dev's
  // createBusinessForOwner behavior.
  await sendWelcomeEmail({ toEmail: normalizedEmail, businessName }).catch((err) => {
    console.error("Failed to send welcome email", err);
  });

  return { ok: true };
}
