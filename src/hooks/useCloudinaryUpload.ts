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

// ── Browser e WebP convert ────────────────────────────────────────────────────
const convertToWebP = (file: File | Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("WebP conversion failed"));
        },
        "image/webp",
        0.85, // quality 85 — server er shathe same
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
};

// ── Single file direct Cloudinary te upload ───────────────────────────────────
export const uploadToCloudinaryDirect = async (
  file: File | Blob,
  folder: string = "uploads",
): Promise<CloudinaryResult> => {
  // ✅ Upload er aage WebP te convert koro
  const webpBlob = await convertToWebP(file);

  const fd = new FormData();
  fd.append("file", webpBlob, "image.webp"); // ← WebP blob
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

// ── Multiple files with progress ──────────────────────────────────────────────
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
