import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

// Used by Render's Web Service health check (render.yaml) and by
// specs/001-render-hosting-cutover's quickstart.md Scenario 1 ("confirm the
// app can read/write the staging Postgres instance"). A trivial query
// rather than a no-op response — a healthy process with a dead DB
// connection should NOT report healthy.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch (err) {
    console.error("Health check failed: database unreachable", err);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
