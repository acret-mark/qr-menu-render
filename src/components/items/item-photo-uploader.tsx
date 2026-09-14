"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { uploadItemPhoto } from "@/lib/items/actions";
import { validateImageFile } from "@/lib/uploads/image-validation";
import { cn } from "@/lib/utils";

export function ItemPhotoUploader({
  photoUrl,
  onPhotoChange,
  onUploadingChange,
}: {
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
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
    const result = await uploadItemPhoto(formData);

    setUploading(false);
    onUploadingChange(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onPhotoChange(result.photoUrl);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "relative flex size-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted",
          uploading && "opacity-60"
        )}
        aria-label="Upload item photo"
      >
        {photoUrl ? (
          <Image src={photoUrl} alt="" fill className="object-cover" />
        ) : (
          <Camera className="size-6 text-muted-foreground" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
