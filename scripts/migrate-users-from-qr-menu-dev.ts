/**
 * One-time migration script (spec 002 T028, FR-008). Reads an export of
 * qr-menu-dev's `auth.users` and `admin_users` and inserts matching `users`
 * rows here — same id/email/created_at, no password_hash (clean break, per
 * the migration plan's decision: pre-launch, no real passwords worth
 * preserving). Existing `businesses`/`subscriptions` rows (migrated
 * separately, per the wider migration plan's Phase 3) keep working because
 * they reference these same ids — nothing here needs to update them.
 *
 * Usage:
 *   npx tsx scripts/migrate-users-from-qr-menu-dev.ts path/to/export.json
 *
 * Expected export.json shape:
 *   [
 *     { "id": "uuid-from-auth.users", "email": "...", "createdAt": "2026-...", "isAdmin": false },
 *     ...
 *   ]
 * (isAdmin true for rows that existed in qr-menu-dev's admin_users table.)
 */
import { readFileSync } from "node:fs";
// Relative imports, not the "@/..." alias — this script runs standalone via
// `tsx`, which doesn't resolve tsconfig.json path aliases without extra
// configuration; keeping it dependency-free is simpler than adding that.
import { db } from "../src/lib/db/client";
import { users } from "../src/lib/db/schema";

type ExportedUser = {
  id: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
};

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/migrate-users-from-qr-menu-dev.ts <export.json>");
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf8");
  const exported: ExportedUser[] = JSON.parse(raw);

  let inserted = 0;
  let skipped = 0;

  for (const record of exported) {
    try {
      await db.insert(users).values({
        id: record.id,
        email: record.email.trim().toLowerCase(),
        // passwordHash intentionally omitted (null) — clean break. The
        // account reaches a usable state only via the password-reset flow
        // (FR-009), never by carrying over a Supabase-issued hash.
        isAdmin: record.isAdmin ?? false,
        createdAt: new Date(record.createdAt),
      });
      inserted++;
    } catch (err) {
      console.error(`Skipped ${record.email} (${record.id}):`, err);
      skipped++;
    }
  }

  console.log(`Migrated ${inserted} user(s), skipped ${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
