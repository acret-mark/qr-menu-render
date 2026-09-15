"use client";

import { useRef, useState } from "react";
import { uploadPaymentProof } from "@/lib/business-profile/actions";
import { validateImageFile } from "@/lib/uploads/image-validation";
import { cn } from "@/lib/utils";

// Mirrors business-logo-uploader.tsx structurally (specs/014, research.md
// Decision 3) — same validation/upload path, folder: "payment-proofs".
// Uploads immediately on file selection and reports the resulting URL back
// to the parent form via onProofChange; the parent blocks submission until
// a URL exists (FR-006).
export function PaymentProofUploader({
  proofUrl,
  onProofChange,
  onUploadingChange,
}: {
  proofUrl: string | null;
  onProofChange: (url: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    onUploadingChange(true);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadPaymentProof(formData);

    setUploading(false);
    onUploadingChange(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFileName(file.name);
    onProofChange(result.proofUrl);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Payment proof</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-sm text-muted-foreground",
          uploading && "opacity-60"
        )}
      >
        {uploading ? "Uploading…" : proofUrl ? (fileName ?? "Proof attached") : "Tap to upload screenshot"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
