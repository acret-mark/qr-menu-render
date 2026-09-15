"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { updateOwnBusiness } from "@/lib/data-access/businesses";
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
  if (contactEmailRaw && !isValidEmail(contactEmailRaw)) {
    return { ok: false, field: "contactEmail", message: "Enter a valid email address." };
  }

  const contactPhone = (formData.get("contactPhone") as string | null)?.trim() ?? "";
  const address = (formData.get("address") as string | null)?.trim() ?? "";

  await updateOwnBusiness(user.id, {
    name,
    contactPhone: contactPhone || null,
    contactEmail: contactEmailRaw || null,
    address: address || null,
  });

  revalidatePath("/business-profile");
  revalidatePath("/dashboard");
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

  await updateOwnBusiness(user.id, { logoUrl });

  revalidatePath("/business-profile");
  return { ok: true, logoUrl };
}
