"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { uploadBusinessLogo } from "@/lib/business-profile/actions";
import { validateImageFile } from "@/lib/uploads/image-validation";
import { cn } from "@/lib/utils";

// Mirrors item-photo-uploader.tsx structurally (research.md Decision 2) —
// same validation/upload path, folder: "businesses" instead of "items".
// Independent of the rest of the form (spec FR-008): a successful upload
// is persisted immediately via uploadBusinessLogo, not staged for the next
// profile save.
export function BusinessLogoUploader({
  logoUrl,
  onLogoChange,
  onUploadingChange,
}: {
  logoUrl: string | null;
  onLogoChange: (url: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
    const result = await uploadBusinessLogo(formData);

    setUploading(false);
    onUploadingChange(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onLogoChange(result.logoUrl);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-muted-foreground",
          uploading && "opacity-60"
        )}
        aria-label="Upload business logo"
      >
        {logoUrl ? (
          <Image src={logoUrl} alt="" fill className="object-cover" />
        ) : (
          <Camera className="size-6" />
        )}
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs font-medium text-primary disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Tap to change logo"}
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
