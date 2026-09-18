import Image from "next/image";
import { formatAdminDate } from "@/lib/admin/format";

// specs/018-business-detail FR-001, spec Assumptions ("stat cards on
// Overview... derived from the same profile/menu data already required").
export function BusinessOverviewPanel({
  business,
  categoryCount,
  itemCount,
}: {
  business: {
    name: string;
    logoUrl: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    address: string | null;
    plan: string;
    createdAt: Date;
    trialEndsAt: Date | null;
  };
  categoryCount: number;
  itemCount: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {business.logoUrl && (
        <div className="relative size-16 overflow-hidden rounded-lg border border-border">
          <Image src={business.logoUrl} alt="" fill className="object-cover" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-muted px-5 py-4">
          <div className="text-sm text-muted-foreground">Plan</div>
          <div className="text-2xl font-semibold capitalize">{business.plan}</div>
        </div>
        <div className="rounded-2xl border border-border bg-muted px-5 py-4">
          <div className="text-sm text-muted-foreground">Categories</div>
          <div className="text-2xl font-semibold">{categoryCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-muted px-5 py-4">
          <div className="text-sm text-muted-foreground">Items</div>
          <div className="text-2xl font-semibold">{itemCount}</div>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Business name</dt>
        <dd>{business.name}</dd>
        <dt className="text-muted-foreground">Contact phone</dt>
        <dd>{business.contactPhone ?? "—"}</dd>
        <dt className="text-muted-foreground">Contact email</dt>
        <dd>{business.contactEmail ?? "—"}</dd>
        <dt className="text-muted-foreground">Address</dt>
        <dd>{business.address ?? "—"}</dd>
        <dt className="text-muted-foreground">Signed up</dt>
        <dd>{formatAdminDate(business.createdAt)}</dd>
        {business.trialEndsAt && (
          <>
            <dt className="text-muted-foreground">Trial reference end date</dt>
            <dd>{formatAdminDate(business.trialEndsAt)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
