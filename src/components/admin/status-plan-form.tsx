"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStatusAndPlanAction } from "@/lib/admin/business-actions";
import { Button } from "@/components/ui/button";
import type { Business } from "@/lib/data-access/businesses";

const STATUS_OPTIONS: { value: Business["status"]; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const PLAN_OPTIONS: { value: Business["plan"]; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "pro", label: "Pro" },
];

// Matches Button's "xs" size exactly (h-6/px-2/text-xs) so the two selects
// and the Apply button next to them read as one uniform control group
// (spec FR-009).
const FIELD_CLASSNAME =
  "h-6 rounded-[min(var(--radius-md),10px)] border border-border bg-background px-2 text-xs font-medium capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

// specs/019-admin-status-plan-override. No subscription/trialEndsAt touch
// anywhere in this component — the entire write surface is
// setStatusAndPlanAction → adminSetStatusAndPlan (FR-002/FR-007).
export function StatusPlanForm({
  businessId,
  currentStatus,
  currentPlan,
}: {
  businessId: string;
  currentStatus: Business["status"];
  currentPlan: Business["plan"];
}) {
  const router = useRouter();

  const [status, setStatus] = useState<Business["status"]>(currentStatus);
  const [plan, setPlan] = useState<Business["plan"]>(currentPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isBackwardMove(): boolean {
    const movesOffActive = currentStatus === "active" && status !== currentStatus;
    const movesOffPro =
      currentPlan === "pro" &&
      (currentStatus === "active" || currentStatus === "trial") &&
      plan === "standard" &&
      (status === "active" || status === "trial");
    return movesOffActive || movesOffPro;
  }

  async function handleApply() {
    if (isBackwardMove()) {
      const confirmed = window.confirm(
        `This business is currently ${currentStatus}/${currentPlan}. Apply status=${status}, plan=${plan}?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await setStatusAndPlanAction(businessId, status, plan);
      if (!result.ok) {
        setError("That business couldn't be found anymore.");
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Business["status"])}
          className={FIELD_CLASSNAME}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value as Business["plan"])}
          className={FIELD_CLASSNAME}
        >
          {PLAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="xs" disabled={isSubmitting} onClick={handleApply}>
          {isSubmitting ? "Applying…" : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
