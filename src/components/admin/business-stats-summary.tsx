// specs/017-business-list FR-006, data-model.md's BusinessSummaryCounts
// shape. Mirrors qr-menu-dev's StatCard grid. The "Expired" card
// (specs/020-unified-subscription-lifecycle FR-017) was added once that
// feature's locked-state computation existed.
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export function BusinessStatsSummary({
  total,
  active,
  trial,
  needsAttention,
  expired,
}: {
  total: number;
  active: number;
  trial: number;
  needsAttention: number;
  expired: number;
}) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard label="Total Businesses" value={total} />
      <StatCard label="Active" value={active} />
      <StatCard label="On Trial" value={trial} />
      <StatCard label="Needs Attention" value={needsAttention} />
      <StatCard label="Expired" value={expired} />
    </div>
  );
}
