import Link from "next/link";
import { adminGetBusinessById } from "@/lib/data-access/businesses";
import { adminGetCategoriesForBusiness } from "@/lib/data-access/categories";
import { adminGetItemsForBusiness } from "@/lib/data-access/items";
import {
  adminGetAllSubscriptionsForBusiness,
} from "@/lib/data-access/subscriptions";
import { adminGetSupportTicketsForBusiness } from "@/lib/data-access/support-tickets";
import { BusinessDetailTabs } from "@/components/admin/business-detail-tabs";
import { BusinessOverviewPanel } from "@/components/admin/business-overview-panel";
import { BusinessMenuPanel } from "@/components/admin/business-menu-panel";
import { SubscriptionHistoryTable } from "@/components/admin/subscription-history-table";
import { StatusPlanForm } from "@/components/admin/status-plan-form";

// specs/018-business-detail / specs/019-admin-status-plan-override. Session/
// isAdmin gate lives in admin/(protected)/layout.tsx (specs/012) — this
// page only reads its own data.
export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await adminGetBusinessById(id);

  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Business</h1>
        <p className="text-sm text-destructive">That business couldn&apos;t be found.</p>
      </div>
    );
  }

  const [categories, items, subscriptions, supportTickets] = await Promise.all([
    adminGetCategoriesForBusiness(business.id),
    adminGetItemsForBusiness(business.id),
    adminGetAllSubscriptionsForBusiness(business.id),
    adminGetSupportTicketsForBusiness(business.id),
  ]);

  const hasPendingSubscription = subscriptions.some((s) => s.status === "pending");
  const hasOpenTicket = supportTickets.some(
    (t) => t.status === "open" || t.status === "in_progress"
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{business.name}</h1>

        <div className="flex items-center gap-3">
          <StatusPlanForm
            businessId={business.id}
            currentStatus={business.status}
            currentPlan={business.plan}
          />
          {hasPendingSubscription && (
            <Link
              href="/admin/payments"
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Payment Queue
            </Link>
          )}
          {hasOpenTicket && (
            // Support tickets have no built destination yet (specs/021 not
            // implemented) — a non-interactive affordance, matching this
            // project's established "disabled until built" convention
            // (AdminShell's own Support nav item), rather than a link to a
            // route that would 404.
            <span
              aria-disabled="true"
              className="cursor-not-allowed rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground/50"
            >
              Support Tickets
            </span>
          )}
        </div>
      </div>

      <BusinessDetailTabs
        overviewPanel={
          <BusinessOverviewPanel
            business={business}
            categoryCount={categories.length}
            itemCount={items.length}
          />
        }
        menuPanel={<BusinessMenuPanel categories={categories} items={items} />}
        historyPanel={<SubscriptionHistoryTable subscriptions={subscriptions} />}
      />
    </div>
  );
}
