import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { businesses } from "@/lib/db/schema";
import type { businesses as BusinessesTable } from "@/lib/db/schema";

export type Business = typeof BusinessesTable.$inferSelect;

export type NewOwnBusiness = {
  name: string;
  slug: string;
};

/**
 * Owner-scoped (contracts/data-access-layer.md, category 1): callers must
 * already have proven `ownerId` is the authenticated caller's own id
 * (src/lib/auth/session.ts) before calling this.
 */
export async function createOwnBusiness(
  ownerId: string,
  input: NewOwnBusiness
): Promise<Business> {
  const [business] = await db
    .insert(businesses)
    .values({
      name: input.name,
      slug: input.slug,
      ownerId,
      status: "pending",
      plan: "standard",
    })
    .returning();
  return business;
}

/**
 * Owner-scoped: filters on ownerId, never trusts a businessId alone.
 */
export async function getOwnBusiness(ownerId: string): Promise<Business | null> {
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, ownerId))
    .limit(1);
  return business ?? null;
}

/**
 * T034 security review note: this is the one function in this module that
 * doesn't fit the owner/admin/public naming convention — it takes no
 * identity because it isn't tenant data at all, just a boolean existence
 * check against a globally-unique slug (used by registerOwner's
 * slug-suffix retry loop, before any business/owner exists to scope it to).
 * Reviewed and intentional, not an oversight.
 */
export async function slugExists(slug: string): Promise<boolean> {
  const [row] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, slug)).limit(1);
  return !!row;
}

// ---- Public-scoped (contracts/data-access-layer.md category 3) ----

/**
 * specs/007-public-menu-display's public-visibility-boundary contract: the
 * ONE place `status IN ('active','trial')` is checked. Returns null for a
 * nonexistent slug or any other status — this is the entire replacement for
 * qr-menu-dev's RLS policies on this path (Constitution Principle II).
 * Every other public function in this feature trusts a businessId that
 * already came from a non-null result of this call; none re-check status.
 */
export async function getPublicBusinessBySlug(slug: string): Promise<Business | null> {
  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.slug, slug), inArray(businesses.status, ["active", "trial"])))
    .limit(1);
  return business ?? null;
}

// ---- Admin-scoped (contracts/data-access-layer.md category 2) ----
// Callers MUST have already called requireAdmin() (src/lib/auth/session.ts)
// before invoking these — no internal check here, per the contract.

export async function adminGetAllBusinesses(): Promise<Business[]> {
  return db.select().from(businesses);
}

export async function adminGetBusinessById(businessId: string): Promise<Business | null> {
  const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  return business ?? null;
}

export async function adminUpdateBusinessStatus(
  businessId: string,
  status: Business["status"]
): Promise<Business | null> {
  const [business] = await db
    .update(businesses)
    .set({ status })
    .where(eq(businesses.id, businessId))
    .returning();
  return business ?? null;
}
