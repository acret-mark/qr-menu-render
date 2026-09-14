import { v2 as cloudinary } from "cloudinary";

// The only file allowed to reference CLOUDINARY_API_SECRET, per
// .github/scripts/check-structure.mjs — mirrors src/lib/db/client.ts's role
// as the sole holder of another server-only secret. Ported unchanged from
// qr-menu-dev/src/lib/cloudinary/client.ts (Constitution Principle VI).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file: File, options: { folder: string }): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: options.folder,
    quality: "auto",
    fetch_format: "auto",
  });

  return result.secure_url;
}
