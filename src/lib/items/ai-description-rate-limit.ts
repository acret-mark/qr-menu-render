import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

// Ported from qr-menu-dev's src/lib/ai-description/rate-limit.ts, adapted from
// its Supabase/PostgREST client to render's direct Postgres (node-postgres)
// connection. Same daily cap, same fail-open behavior.
const DAILY_LIMIT = Number(process.env.AI_DESCRIPTION_DAILY_LIMIT ?? 10);

// "42P01" is Postgres's own "relation does not exist" — the
// item_description_generations table (mirroring qr-menu-dev's own proposed,
// still-unmigrated data-model.md table) isn't guaranteed to exist yet.
function isUndefinedTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42P01"
  );
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Counts and caps description-generation attempts per item per day. Fails
 * open — allows the attempt and logs a warning — if the backing table
 * doesn't exist yet, so the rest of the AI description flow stays fully
 * functional ahead of that migration landing (same posture as qr-menu-dev,
 * whose own reference table isn't migrated in its database either).
 */
export async function checkAndIncrementDailyLimit(
  itemId: string,
  businessId: string
): Promise<{ allowed: boolean }> {
  const generatedOn = todayDateString();

  try {
    const { rows } = await db.execute<{ id: string; attempt_count: number }>(sql`
      select id, attempt_count from item_description_generations
      where item_id = ${itemId} and generated_on = ${generatedOn}
      limit 1
    `);
    const existing = rows[0];

    if (existing && existing.attempt_count >= DAILY_LIMIT) {
      return { allowed: false };
    }

    if (existing) {
      await db.execute(sql`
        update item_description_generations
        set attempt_count = attempt_count + 1
        where id = ${existing.id}
      `);
    } else {
      await db.execute(sql`
        insert into item_description_generations (item_id, business_id, generated_on, attempt_count)
        values (${itemId}, ${businessId}, ${generatedOn}, 1)
      `);
    }

    return { allowed: true };
  } catch (error) {
    if (isUndefinedTableError(error)) {
      console.warn(
        "checkAndIncrementDailyLimit: item_description_generations table doesn't exist yet " +
          "— failing open; every generation attempt is currently allowed and uncapped."
      );
      return { allowed: true };
    }
    console.error("checkAndIncrementDailyLimit: query failed", error);
    return { allowed: true };
  }
}
