#!/usr/bin/env node
// Structure/spec compliance checks for the qr-menu-render codebase.
// Ported from qr-menu-dev's .github/scripts/check-structure.mjs
// (specs/001-render-hosting-cutover T023, Constitution Principle VI) and
// adapted to this project's actual secrets/files — Supabase-specific checks
// replaced with this project's own (DATABASE_URL, GMAIL_SMTP_APP_PASSWORD).
// Run in CI on every pull request; exits non-zero on any failure.
//
// Deliberately NOT automated here: Constitution Principle II's "no raw
// tenant-table query outside src/lib/data-access/" rule
// (docs/contributing.md). A reliable static check for that would need to
// distinguish a type-only import of a schema table (common and fine — see
// every data-access module's own `typeof table.$inferSelect`) from an actual
// query built from it, which is more than a pattern-match can safely do
// without false positives. Enforced by code review instead, per
// docs/contributing.md.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const failures = [];
const warnings = [];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk(SRC);
const codeFiles = allFiles.filter((f) =>
  [".ts", ".tsx"].includes(extname(f))
);

// 1. No console.log/debug left in source (console.warn/error allowed).
for (const file of codeFiles) {
  const content = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    if (/console\.(log|debug)\s*\(/.test(line)) {
      failures.push(
        `${rel}:${i + 1}: console.log/debug left in source (use console.warn/error, or remove)`
      );
    }
    if (/\b(FIXME|HACK)\b/.test(line)) {
      failures.push(
        `${rel}:${i + 1}: unresolved FIXME/HACK comment must be resolved before merge`
      );
    }
    if (/\bTODO\b/.test(line)) {
      warnings.push(`${rel}:${i + 1}: TODO comment (allowed, but tracked)`);
    }
  });
}

// 2. Secret keys must never appear outside server-only wiring, each confined
//    to one dedicated file. Extend ALLOWED_SECRET_FILES as later features
//    add their own (e.g. a Cloudinary client, the cron routes using
//    CRON_SECRET) — mirrors qr-menu-dev's server.ts/service.ts convention.
const SECRET_PATTERNS = [
  /DATABASE_URL/,
  /GMAIL_SMTP_APP_PASSWORD/,
  /CLOUDINARY_API_SECRET/,
  /CRON_SECRET/,
];
const ALLOWED_SECRET_FILES = new Set([
  join(SRC, "lib", "db", "client.ts"),
  join(SRC, "lib", "email", "google-smtp-client.ts"),
]);
for (const file of codeFiles) {
  if (ALLOWED_SECRET_FILES.has(file)) continue;
  const content = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      failures.push(
        `${rel}: references a server-only secret (${pattern}) outside its dedicated file`
      );
    }
  }
}

// 3. "use client" components must not import the server-only DB client or
//    session helpers.
for (const file of codeFiles) {
  const content = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  if (
    /^["']use client["'];?/m.test(content) &&
    (/lib\/db\/client/.test(content) || /lib\/auth\/session/.test(content))
  ) {
    failures.push(`${rel}: client component imports a server-only module`);
  }
}

// 4. App Router route segments only contain Next.js special files or nested route dirs.
const ALLOWED_APP_FILES = new Set([
  "page.tsx",
  "layout.tsx",
  "loading.tsx",
  "error.tsx",
  "not-found.tsx",
  "route.ts",
  "globals.css",
  "favicon.ico",
]);
const APP_DIR = join(SRC, "app");
try {
  for (const file of walk(APP_DIR)) {
    const base = file.split("/").pop();
    const rel = relative(ROOT, file);
    const inDynamicOrGroup = /\/\(.*\)\//.test(file) || /\/\[.*\]\//.test(file);
    if (!ALLOWED_APP_FILES.has(base) && extname(file) !== "") {
      warnings.push(
        `${rel}: non-standard file under src/app — App Router segments should only contain page/layout/route files; move shared logic to src/lib or src/components (dynamic/group segment: ${inDynamicOrGroup})`
      );
    }
  }
} catch {
  // src/app may not exist in every checkout state; ignore.
}

// 5. Flag oversized files as a maintainability signal (non-blocking).
const LINE_LIMIT = 300;
for (const file of codeFiles) {
  const lines = readFileSync(file, "utf8").split("\n").length;
  if (lines > LINE_LIMIT) {
    warnings.push(
      `${relative(ROOT, file)}: ${lines} lines (over ${LINE_LIMIT}) — consider splitting`
    );
  }
}

// 6. Naming convention: component/hook files use kebab-case.
for (const file of codeFiles) {
  const rel = relative(ROOT, file);
  if (!rel.startsWith("src/components/") && !rel.startsWith("src/hooks/")) {
    continue;
  }
  const base = file.split("/").pop().replace(/\.tsx?$/, "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(base)) {
    warnings.push(`${rel}: filename should be kebab-case`);
  }
}

console.log(`\nStructure check: ${codeFiles.length} files scanned.\n`);

if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
  console.log("");
}

if (failures.length) {
  console.log(`Failures (${failures.length}):`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  process.exit(1);
}

console.log("No blocking structure issues found.");
