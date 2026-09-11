import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================================
// Enums — ported unchanged from qr-menu-dev's Postgres enums
// (supabase/migrations/20260710015525_initial_schema.sql and later
// migrations; language_pref was dropped there and is not recreated here).
// ============================================================

export const planTypeEnum = pgEnum("plan_type", ["standard", "pro", "trial"]);
export const businessStatusEnum = pgEnum("business_status", [
  "active",
  "suspended",
  "trial",
  "pending",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "pending",
  "active",
  "expired",
  "cancelled",
]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved"]);
export const descriptionSourceEnum = pgEnum("description_source", ["ai_generated", "manual"]);
export const sourceLanguageEnum = pgEnum("source_language", ["en", "fil"]);
export const displayLanguageEnum = pgEnum("display_language", ["en", "ko", "ja", "zh"]);

// ============================================================
// Auth.js-owned tables (@auth/drizzle-adapter schema), extended with
// password_hash/is_admin per specs/002-authjs-authorization/data-model.md.
// Replaces qr-menu-dev's Supabase `auth.users` + `admin_users`.
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // Not an Auth.js-standard column — added here rather than a side table
  // since every user (owner or admin) has exactly one. Nullable so a
  // clean-break-recreated account (specs/002 FR-008) can exist with no
  // usable password until it completes a reset (FR-009).
  passwordHash: text("password_hash"),
  // Replaces qr-menu-dev's separate `admin_users` table + `is_admin()` RPC —
  // see research.md's "Admin modeling" decision.
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ]
);

// Auth.js database-session table (session strategy — required by
// spec.md's Clarifications: revoke-on-password-change, 30-day idle expiry).
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// Password-reset tokens — not an Auth.js-adapter table; this feature's own
// mechanism for FR-004 (reuses the existing Gmail-SMTP email path, not a
// Supabase-specific flow). One-time use: consumed and deleted on redemption.
export const passwordResetTokens = pgTable("password_reset_tokens", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

// ============================================================
// Ported domain tables — same shape as qr-menu-dev, `owner_id`/`activated_by`
// repointed at `users.id`, no RLS (Constitution Principle II — see
// contracts/data-access-layer.md for what replaces it).
// ============================================================

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  address: text("address"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: planTypeEnum("plan").notNull().default("standard"),
  status: businessStatusEnum("status").notNull().default("pending"),
  sourceLanguage: sourceLanguageEnum("source_language").notNull().default("en"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.businessId)]
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    photoUrl: text("photo_url"),
    isDisplayed: boolean("is_displayed").notNull().default(true),
    isSoldOut: boolean("is_sold_out").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    descriptionSource: descriptionSourceEnum("description_source"),
    aiKeywords: text("ai_keywords").array(),
    aiGeneratedAt: timestamp("ai_generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.businessId), index().on(table.categoryId)]
);

export const itemTranslations = pgTable(
  "item_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    languageCode: displayLanguageEnum("language_code").notNull(),
    translatedDescription: text("translated_description"),
    sourceHash: text("source_hash").notNull(),
    translatedAt: timestamp("translated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex().on(table.itemId, table.languageCode),
    index().on(table.businessId),
  ]
);

export const categoryTranslations = pgTable(
  "category_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    languageCode: displayLanguageEnum("language_code").notNull(),
    translatedName: text("translated_name"),
    sourceHash: text("source_hash").notNull(),
    translatedAt: timestamp("translated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex().on(table.categoryId, table.languageCode),
    index().on(table.businessId),
  ]
);

export const ingredients = pgTable(
  "ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index().on(table.businessId),
    // Case-insensitive dedupe (qr-menu-dev FR-005) — a plain unique() can't
    // express lower(name), so this mirrors the DB's expression index.
    uniqueIndex("ingredients_business_id_lower_name_idx").on(
      table.businessId,
      sql`lower(${table.name})`
    ),
  ]
);

export const itemIngredients = pgTable(
  "item_ingredients",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.ingredientId] }),
    index().on(table.itemId),
    index().on(table.ingredientId),
    index().on(table.businessId),
  ]
);

export const ingredientTranslations = pgTable(
  "ingredient_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    languageCode: displayLanguageEnum("language_code").notNull(),
    translatedName: text("translated_name"),
    sourceHash: text("source_hash").notNull(),
    translatedAt: timestamp("translated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex().on(table.ingredientId, table.languageCode),
    index().on(table.businessId),
  ]
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    plan: planTypeEnum("plan").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: subscriptionStatusEnum("status").notNull().default("pending"),
    paymentMethod: text("payment_method"),
    paymentProofUrl: text("payment_proof_url"),
    // References users.id (any user with is_admin = true at the time of the
    // action) rather than a separate admin_users table — see data-model.md.
    activatedBy: uuid("activated_by").references(() => users.id),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    expiryReminderSentAt: timestamp("expiry_reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.businessId)]
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: ticketStatusEnum("status").notNull().default("open"),
    adminReply: text("admin_reply"),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.businessId)]
);
