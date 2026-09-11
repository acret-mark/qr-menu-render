import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { verifyPassword } from "./password";

// 30-day idle expiry per spec.md Clarifications (FR-004b).
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Auth.js's Credentials provider does not support the built-in "database"
  // session strategy — Auth.js only auto-creates/reads adapter session rows
  // for OAuth sign-ins, not Credentials ones (a real Auth.js v5 constraint,
  // not a qr-menu-render design choice; corrected here after the initial
  // research.md decision assumed otherwise). To still satisfy FR-004a
  // (revoke on password change) and FR-004b (30-day idle expiry) —
  // both of which require a session Auth.js can invalidate server-side —
  // sessions are managed manually: the JWT below carries only an opaque
  // token pointing at a row in `sessions` (same table shape the adapter
  // itself uses), and every request resolves the real user from that row,
  // so deleting it (password.ts's revokeAllSessions) actually invalidates
  // the session. A plain "jwt" strategy alone could not do that.
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.trim().toLowerCase()))
          .limit(1);

        // Same generic failure for "no such account" and "wrong password"
        // (SC-005 — anti-enumeration) — verifyPassword already returns
        // false rather than throwing for a null/unusable hash (FR-009's
        // clean-break-recreated accounts), so both cases fall through here
        // identically.
        const passwordHash = user?.passwordHash ?? null;
        const valid = await verifyPassword(password, passwordHash);
        if (!user || !valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        // Fresh sign-in: mint a new server-side session row rather than
        // trusting the JWT alone to represent the session.
        const sessionToken = randomUUID();
        const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
        await db.insert(sessions).values({ sessionToken, userId: user.id, expires });
        token.sessionToken = sessionToken;
      }
      return token;
    },
    async session({ session, token }) {
      const sessionToken = token.sessionToken as string | undefined;
      if (!sessionToken) {
        return { ...session, user: undefined };
      }

      const [row] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);

      // Missing (revoked — FR-004a) or past its idle window (FR-004b):
      // fail closed, never fall back to trusting the JWT's own claims.
      if (!row || row.expires.getTime() < Date.now()) {
        return { ...session, user: undefined };
      }

      // Sliding expiry: activity within the window pushes it back out.
      const newExpires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
      await db
        .update(sessions)
        .set({ expires: newExpires })
        .where(eq(sessions.sessionToken, sessionToken));

      const [dbUser] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
      if (!dbUser) {
        return { ...session, user: undefined };
      }

      session.user = {
        ...session.user,
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        isAdmin: dbUser.isAdmin,
      };
      return session;
    },
  },
});
