import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getOwnLatestSubscription } from "@/lib/data-access/subscriptions";
import { BusinessProfileForm } from "@/components/business-profile/business-profile-form";
import { AccountTabs } from "@/components/business-profile/account-tabs";
import { SubscriptionPanel } from "@/components/business-profile/subscription-panel";

// specs/014-owner-subscription-tab FR-013: introduces the Profile/
// Subscription/Support tab container specs/010 deferred, wrapping its
// existing profile form unchanged as the Profile tab. Session gate lives
// in (owner)/layout.tsx (specs/009 FR-012).
export default async function BusinessProfilePage() {
  // (owner)/layout.tsx redirects unauthenticated visitors, but Next.js still
  // evaluates this page concurrently with that redirect — bail out quietly
  // rather than asserting non-null; the eventual response is the layout's
  // redirect regardless.
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await getOwnBusiness(user.id);
  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Business Profile</h1>
        <p className="text-sm text-destructive">No business found for this account.</p>
      </div>
    );
  }

  const latest = await getOwnLatestSubscription(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <AccountTabs
        profilePanel={
          <BusinessProfileForm
            business={{
              name: business.name,
              logoUrl: business.logoUrl,
              contactPhone: business.contactPhone,
              contactEmail: business.contactEmail,
              address: business.address,
            }}
          />
        }
        subscriptionPanel={
          <SubscriptionPanel
            // A "trial" plan is only ever admin-granted directly as active
            // (adminGrantTrialSubscription) — this owner-facing submission
            // flow never targets it, so it's treated the same as its
            // nearest paid tier for display purposes here.
            currentPlan={business.plan === "trial" ? "standard" : business.plan}
            latest={
              latest && {
                plan: latest.plan,
                status: latest.status,
                paymentMethod: latest.paymentMethod,
              }
            }
          />
        }
        supportPanel={
          <p className="text-sm text-muted-foreground">
            Support isn&apos;t available yet — check back soon.
          </p>
        }
      />
    </div>
  );
}
