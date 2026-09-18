import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, emailConfirmationTokens, sessions, users, verificationTokens } from "@/lib/db/schema";
import { verifyPassword } from "./password";

// 30-day idle expiry per spec.md Clarifications (FR-004b).
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Thrown by the password branch below when credentials are otherwise
 * correct but the account hasn't confirmed its email yet
 * (specs/011-email-confirmation). Mirrors qr-menu-dev's own
 * `email_not_confirmed` distinction (src/lib/auth/login.ts) — that
 * project gets this for free from Supabase Auth's own default behavior;
 * Auth.js's Credentials provider has no equivalent, so this project must
 * enforce and signal it explicitly. Deliberately a distinct, catchable
 * error type (not just `return null`) so the caller (actions.ts's
 * loginAction) can show a specific, correct message instead of the
 * generic "invalid credentials" one.
 */
export class UnconfirmedEmailError extends CredentialsSignin {
  code = "unconfirmed-email";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Found live on the first real deployment (2026-09-14): Auth.js v5
  // rejects requests with a 500 ("server configuration") on any platform
  // that sits behind a proxy/CDN it doesn't recognize by default — Render
  // is exactly this (fronted by Cloudflare, per the response headers on
  // the failing request). trustHost: true is Auth.js's documented fix for
  // deploying to Render/Railway/Fly.io/Docker/etc.
  trustHost: true,
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
        confirmationToken: { label: "Confirmation Token", type: "text" },
        loginContext: { label: "Login Context", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        if (typeof email !== "string") return null;
        const normalizedEmail = email.trim().toLowerCase();

        // Email-confirmation credential shape (specs/011-email-confirmation
        // FR-004, research.md Decision 3/6) — the confirmation token itself
        // is the credential, the same way a password is in the branch
        // below. This is the ONE place a confirmation token is ever
        // consumed (deleted) and users.emailVerified is set — never done
        // by confirmEmailAction's own read-only pre-check, to avoid
        // consuming the token twice.
        const confirmationToken = credentials?.confirmationToken;
        if (typeof confirmationToken === "string") {
          const [row] = await db
            .select()
            .from(emailConfirmationTokens)
            .where(eq(emailConfirmationTokens.token, confirmationToken))
            .limit(1);

          if (!row || row.expires.getTime() < Date.now()) return null;

          const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
          if (!user || user.email !== normalizedEmail) return null;

          await db
            .delete(emailConfirmationTokens)
            .where(eq(emailConfirmationTokens.token, confirmationToken));
          await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, user.id));

          return { id: user.id, email: user.email, name: user.name };
        }

        const password = credentials?.password;
        if (typeof password !== "string") return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        // Same generic failure for "no such account" and "wrong password"
        // (SC-005 — anti-enumeration) — verifyPassword already returns
        // false rather than throwing for a null/unusable hash (FR-009's
        // clean-break-recreated accounts), so both cases fall through here
        // identically.
        const passwordHash = user?.passwordHash ?? null;
        const valid = await verifyPassword(password, passwordHash);
        if (!user || !valid) return null;

        // adminLoginAction passes loginContext: "admin" (T025). Rejected
        // here, before any session/cookie is created, rather than by
        // checking session.user.isAdmin after signIn() and signing back out
        // — that same-request re-read of auth() right after signIn() is
        // unreliable in Auth.js v5 (session not guaranteed visible until a
        // later request), which let a correct non-admin password
        // intermittently pass and correct admin credentials intermittently
        // read back as "not admin yet".
        if (credentials?.loginContext === "admin" && !user.isAdmin) return null;

        // specs/011-email-confirmation: a correct password alone is no
        // longer sufficient once an account requires confirmation — this
        // is the one place that gate is enforced (registerAction's own
        // redirect-to-pending-screen only covers the immediate post-
        // registration path, not a later direct login attempt). Thrown
        // (not returned null) so the caller can distinguish this from
        // wrong credentials and show the correct message. Scoped to
        // non-admin accounts only — admins are provisioned manually
        // (specs/002 Assumptions), never go through registerAction, and
        // would otherwise be permanently locked out with no path to ever
        // set emailVerified.
        if (!user.isAdmin && !user.emailVerified) {
          throw new UnconfirmedEmailError();
        }

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
