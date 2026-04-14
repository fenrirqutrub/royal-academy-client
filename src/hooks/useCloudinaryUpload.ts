// src/hooks/useCloudinaryUpload.ts

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// ── Single file direct Cloudinary te upload ──
export const uploadToCloudinaryDirect = async (
  file: File | Blob,
  folder: string = "uploads",
): Promise<CloudinaryResult> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }

  return res.json();
};

// ── Multiple files with progress ──
export const uploadMultipleToCloudinary = async (
  files: File[],
  options: {
    folder?: string;
    onProgress?: (percent: number) => void;
  } = {},
): Promise<CloudinaryResult[]> => {
  const { folder = "uploads", onProgress } = options;
  const results: CloudinaryResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCloudinaryDirect(files[i], folder);
    results.push(result);
    onProgress?.(Math.round(((i + 1) / files.length) * 100));
  }

  return results;
};
