export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validatePackageImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const fileType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(fileType)) {
    return {
      valid: false,
      error: "Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.",
    };
  }

  return { valid: true };
}
