"use client";

import { useState } from "react";
import { updateBusinessProfile } from "@/lib/business-profile/actions";
import { isValidEmail } from "@/lib/validation/email";
import { Button } from "@/components/ui/button";
import { BusinessLogoUploader } from "@/components/business-profile/business-logo-uploader";
import { cn } from "@/lib/utils";

type BusinessProfileFormValues = {
  name: string;
  logoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
};

type FieldErrors = Partial<Record<"name" | "contactEmail", string>>;

function validate(values: { name: string; contactEmail: string }): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Business name is required.";
  }

  const trimmedEmail = values.contactEmail.trim();
  if (!trimmedEmail) {
    errors.contactEmail = "Contact email is required.";
  } else if (!isValidEmail(trimmedEmail)) {
    errors.contactEmail = "Enter a valid email address.";
  }

  return errors;
}

// Standalone screen, no tab container (spec FR-011, research.md Decision
// 1). Save is disabled only while a logo upload is in flight (FR-008a) —
// the same onUploadingChange -> canSubmit wiring item-form.tsx already
// established for item photos (research.md Decision 2).
export function BusinessProfileForm({ business }: { business: BusinessProfileFormValues }) {
  const [name, setName] = useState(business.name);
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logoUrl);
  const [contactPhone, setContactPhone] = useState(business.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(business.contactEmail ?? "");
  const [address, setAddress] = useState(business.address ?? "");

  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canSubmit = !isLogoUploading && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSaved(false);

    const errors = validate({ name, contactEmail });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("contactPhone", contactPhone);
    formData.set("contactEmail", contactEmail);
    formData.set("address", address);

    const result = await updateBusinessProfile(formData);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-6">
      <BusinessLogoUploader
        logoUrl={logoUrl}
        onLogoChange={setLogoUrl}
        onUploadingChange={setIsLogoUploading}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-name" className="text-sm font-medium">
            Business name
          </label>
          <input
            id="business-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cn(
              "h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              fieldErrors.name && "border-destructive"
            )}
            aria-invalid={!!fieldErrors.name}
          />
          {/* Persistent slug-safety note (spec FR-007) — always visible, not
              conditioned on whether the name has been edited. */}
          <p className="text-xs text-muted-foreground">
            Changing your business name will not change your menu link.
          </p>
          {fieldErrors.name && <span className="text-xs text-destructive">{fieldErrors.name}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-phone" className="text-sm font-medium">
            Contact phone
          </label>
          <input
            id="business-phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Optional"
            className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-email" className="text-sm font-medium">
            Contact email <span className="font-normal text-destructive">*</span>
          </label>
          <input
            id="business-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={cn(
              "h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              fieldErrors.contactEmail && "border-destructive"
            )}
            aria-invalid={!!fieldErrors.contactEmail}
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll send your activation confirmation to this address.
          </p>
          {fieldErrors.contactEmail && (
            <span className="text-xs text-destructive">{fieldErrors.contactEmail}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-address" className="text-sm font-medium">
            Address
          </label>
          <textarea
            id="business-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="Optional"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}
        {saved && !error && (
          <div className="rounded-lg bg-success/10 px-3.5 py-2.5 text-sm text-success">
            Business information saved.
          </div>
        )}

        <Button type="submit" size="lg" disabled={!canSubmit} className="h-11">
          {submitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
