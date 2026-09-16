// Small, dependency-free format check (specs/010-business-profile-editing
// FR-005, research.md Decision 3) — this project has no validation library
// anywhere; one optional field on one form doesn't warrant adding one.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}
