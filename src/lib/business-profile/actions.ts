"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { updateOwnBusiness } from "@/lib/data-access/businesses";
import { createOwnSubscription, type PlanType } from "@/lib/data-access/subscriptions";
import { validateImageFile } from "@/lib/uploads/image-validation";
import { uploadImage } from "@/lib/cloudinary/client";
import { isValidEmail } from "@/lib/validation/email";

export type UpdateBusinessProfileResult =
  | { ok: true }
  | { ok: false; field: "name" | "contactEmail"; message: string };

/**
 * Partial update (specs/010 FR-002) — only the fields present in the form
 * are sent to updateOwnBusiness, so saving one field never requires
 * resubmitting the others. Never touches slug/ownerId/plan/status (FR-006).
 */
export async function updateBusinessProfile(
  formData: FormData
): Promise<UpdateBusinessProfileResult> {
  const user = await requireUser();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) {
    return { ok: false, field: "name", message: "Business name is required." };
  }

  const contactEmailRaw = (formData.get("contactEmail") as string | null)?.trim() ?? "";
  if (!contactEmailRaw) {
    return { ok: false, field: "contactEmail", message: "Contact email is required." };
  }
  if (!isValidEmail(contactEmailRaw)) {
    return { ok: false, field: "contactEmail", message: "Enter a valid email address." };
  }

  const contactPhone = (formData.get("contactPhone") as string | null)?.trim() ?? "";
  const address = (formData.get("address") as string | null)?.trim() ?? "";

  const updated = await updateOwnBusiness(user.id, {
    name,
    contactPhone: contactPhone || null,
    contactEmail: contactEmailRaw || null,
    address: address || null,
  });

  revalidatePath("/business-profile");
  revalidatePath("/dashboard");
  // specs/026-menu-data-caching FR-003/FR-004: the business name shows on
  // the public menu header.
  if (updated) updateTag(`menu:${updated.slug}`);
  return { ok: true };
}

export type UploadBusinessLogoResult =
  | { ok: true; logoUrl: string }
  | { ok: false; message: string };

/**
 * Mirrors items/actions.ts's uploadItemPhoto exactly (research.md Decision
 * 2) — same validation, same uploadImage helper, folder: "businesses"
 * instead of "items". Independent of updateBusinessProfile (FR-008): a
 * successful upload is persisted immediately, not staged until the next
 * profile save.
 */
export async function uploadBusinessLogo(formData: FormData): Promise<UploadBusinessLogoResult> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, message: "No file provided." };
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  let logoUrl: string;
  try {
    logoUrl = await uploadImage(file, { folder: "businesses" });
  } catch (error) {
    console.error("uploadBusinessLogo: upload failed", error);
    return { ok: false, message: "The upload failed. Please try again." };
  }

  const updated = await updateOwnBusiness(user.id, { logoUrl });

  revalidatePath("/business-profile");
  // specs/026-menu-data-caching FR-003/FR-004: the logo shows on the
  // public menu header — named explicitly in that FR's own "business
  // name/logo" list, even though data-model.md's file list only called out
  // updateBusinessProfile, not this sibling action.
  if (updated) updateTag(`menu:${updated.slug}`);
  return { ok: true, logoUrl };
}

export type UploadPaymentProofResult =
  | { ok: true; proofUrl: string }
  | { ok: false; message: string };

/**
 * specs/014-owner-subscription-tab (research.md Decision 3) — mirrors
 * uploadBusinessLogo exactly: same validation, same uploadImage helper,
 * folder: "payment-proofs" instead of "businesses". Does NOT persist
 * anything on the business/subscription — the URL is only attached to a
 * subscription row by submitPayment below, once the owner actually submits.
 */
export async function uploadPaymentProof(formData: FormData): Promise<UploadPaymentProofResult> {
  await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, message: "No file provided." };
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  try {
    const proofUrl = await uploadImage(file, { folder: "payment-proofs" });
    return { ok: true, proofUrl };
  } catch (error) {
    console.error("uploadPaymentProof: upload failed", error);
    return { ok: false, message: "The upload failed. Please try again." };
  }
}

export type SubmitPaymentResult = { ok: true } | { ok: false; message: string };

/**
 * specs/014-owner-subscription-tab FR-005–FR-007. Blocks submission until
 * proof has been uploaded (FR-006); always creates a new subscription row,
 * never updates an existing one (createOwnSubscription's own insert-only
 * shape, FR-007/SC-003).
 */
export async function submitPayment(formData: FormData): Promise<SubmitPaymentResult> {
  const user = await requireUser();

  const plan = formData.get("plan") as string | null;
  if (plan !== "standard" && plan !== "pro") {
    return { ok: false, message: "Choose a plan before submitting." };
  }

  const paymentMethod = (formData.get("paymentMethod") as string | null)?.trim() ?? "";
  if (!paymentMethod) {
    return { ok: false, message: "Choose a payment method before submitting." };
  }

  const paymentProofUrl = (formData.get("paymentProofUrl") as string | null)?.trim() ?? "";
  if (!paymentProofUrl) {
    return { ok: false, message: "Please attach proof of payment before submitting." };
  }

  const subscription = await createOwnSubscription(user.id, {
    plan: plan as Exclude<PlanType, "trial">,
    paymentMethod,
    paymentProofUrl,
  });
  if (!subscription) {
    return { ok: false, message: "No business found for this account." };
  }

  revalidatePath("/business-profile");
  return { ok: true };
}
