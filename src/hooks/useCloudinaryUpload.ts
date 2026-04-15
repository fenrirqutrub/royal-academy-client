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

// ── Check browser WebP support ────────────────────────────────────────────────
const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob((blob) => resolve(!!blob), "image/webp");
  });
};

// ── Browser e WebP convert (with fallback) ────────────────────────────────────
const convertToWebP = async (
  file: File | Blob,
): Promise<{ blob: Blob; ext: string }> => {
  const canWebP = await supportsWebP();

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

      // ✅ WebP support থাকলে WebP, না থাকলে JPEG fallback
      const format = canWebP ? "image/webp" : "image/jpeg";
      const ext = canWebP ? "webp" : "jpg";
      const quality = 0.85;

      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, ext });
          else reject(new Error("Image conversion failed"));
        },
        format,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
};

// ── Single file direct Cloudinary upload ──────────────────────────────────────
export const uploadToCloudinaryDirect = async (
  file: File | Blob,
  folder: string = "uploads",
): Promise<CloudinaryResult> => {
  // ✅ Convert to WebP (or JPEG fallback)
  const { blob, ext } = await convertToWebP(file);

  const fd = new FormData();
  fd.append("file", blob, `image.${ext}`);
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
