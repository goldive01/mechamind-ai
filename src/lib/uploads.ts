import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const;

type SupportedImageType = keyof typeof IMAGE_EXTENSIONS;

export class UploadValidationError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 415,
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export function validateImageUpload(value: FormDataEntryValue | null): File {
  if (!(value instanceof File)) {
    throw new UploadValidationError("No image file was provided.", 400);
  }

  if (!(value.type in IMAGE_EXTENSIONS)) {
    throw new UploadValidationError(
      "Unsupported image type. Upload a JPEG, PNG, or WebP image.",
      415,
    );
  }

  if (value.size > MAX_IMAGE_SIZE) {
    throw new UploadValidationError("Image exceeds the maximum size of 10 MB.", 413);
  }

  if (value.size === 0) {
    throw new UploadValidationError("The uploaded image is empty.", 400);
  }

  return value;
}

export async function saveImageUpload(file: File): Promise<string> {
  const now = new Date();
  const dateParts = [
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ];
  const extension = IMAGE_EXTENSIONS[file.type as SupportedImageType];
  const filename = `${randomUUID()}${extension}`;
  const uploadsRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  const uploadDirectory = path.join(uploadsRoot, ...dateParts);

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), Buffer.from(await file.arrayBuffer()));

  return `/uploads/${dateParts.join("/")}/${filename}`;
}
