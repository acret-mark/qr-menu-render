// Ported unchanged from qr-menu-dev/src/lib/auth/slug.ts.

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function randomSlug(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `biz-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `biz-${Math.random().toString(36).slice(2, 10)}`;
}
