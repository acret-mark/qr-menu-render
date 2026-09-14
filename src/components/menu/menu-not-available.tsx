// Minimal, correct not-available fallback (spec FR-002) — a single message
// covering every non-visible case uniformly (nonexistent slug, wrong
// status, malformed path). A fuller, status-specific experience is
// deferred to a future spec (see spec.md Assumptions).
export function MenuNotAvailable() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-lg font-semibold">Menu not available</h1>
      <p className="text-sm text-muted-foreground">
        This menu doesn&apos;t exist or isn&apos;t currently active.
      </p>
    </div>
  );
}
