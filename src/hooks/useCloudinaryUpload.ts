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

// ── OffscreenCanvas support check (faster than main thread) ───────────────
const hasOffscreenCanvas =
  typeof OffscreenCanvas !== "undefined" &&
  typeof createImageBitmap !== "undefined";

// ── Resize + WebP convert — optimized for large files ─────────────────────
const compressToWebP = async (file: File | Blob): Promise<Blob> => {
  const MAX_DIMENSION = 1920;
  const QUALITY = 0.82;

  // createImageBitmap is MUCH faster than Image() for large files
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;

  // Only resize if needed
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Use OffscreenCanvas if available (non-blocking, faster)
  if (hasOffscreenCanvas) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("OffscreenCanvas context failed");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.convertToBlob({ type: "image/webp", quality: QUALITY });
  }

  // Fallback: regular canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("WebP conversion failed"));
      },
      "image/webp",
      QUALITY,
    );
  });
};

// ── Single upload with XHR progress ──────────────────────────────────────
const uploadSingleWithProgress = (
  blob: Blob,
  folder: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<CloudinaryResult> => {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", blob, "image.webp");
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("folder", folder);
    fd.append("eager", "f_avif,q_auto|f_webp,q_auto");
    fd.append("eager_async", "true");

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    );
    xhr.timeout = 120000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || "Upload failed"));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.send(fd);
  });
};

// ── Multiple upload with accurate progress ────────────────────────────────
export const uploadMultipleToCloudinary = async (
  files: File[],
  options: {
    folder?: string;
    onProgress?: (percent: number) => void;
  } = {},
): Promise<CloudinaryResult[]> => {
  const { folder = "uploads", onProgress } = options;
  const results: CloudinaryResult[] = [];

  // Step 1: Compress all files first (show compression progress)
  const compressedBlobs: Blob[] = [];

  for (let i = 0; i < files.length; i++) {
    const blob = await compressToWebP(files[i]);
    compressedBlobs.push(blob);
    // Compression = first 30% of progress
    onProgress?.(Math.round(((i + 1) / files.length) * 30));
  }

  // Step 2: Upload with real byte-level progress
  const totalBytes = compressedBlobs.reduce((sum, b) => sum + b.size, 0);

  for (let i = 0; i < compressedBlobs.length; i++) {
    const result = await uploadSingleWithProgress(
      compressedBlobs[i],
      folder,
      (loaded, total) => {
        const currentFileProgress = loaded / total;
        const previousFilesBytes = compressedBlobs
          .slice(0, i)
          .reduce((sum, b) => sum + b.size, 0);
        const currentProgress =
          previousFilesBytes + compressedBlobs[i].size * currentFileProgress;

        // Upload = remaining 70% of progress (30-100)
        const uploadPercent =
          30 + Math.round((currentProgress / totalBytes) * 70);
        onProgress?.(Math.min(uploadPercent, 99));
      },
    );

    results.push(result);
  }

  onProgress?.(100);
  return results;
};

// ── Single upload (for avatar etc.) ──────────────────────────────────────
export const uploadToCloudinaryDirect = async (
  file: File | Blob,
  folder: string = "uploads",
): Promise<CloudinaryResult> => {
  const blob = await compressToWebP(file);
  return uploadSingleWithProgress(blob, folder);
};

// ── Cloudinary URL transforms for display (NO eager needed!) ─────────────
export const getCloudinaryOptimizedUrls = (baseUrl: string) => {
  if (!baseUrl || typeof baseUrl !== "string") {
    return { avif: "", webp: "", original: "" };
  }

  const parts = baseUrl.split("/upload/");
  if (parts.length !== 2) {
    return { avif: baseUrl, webp: baseUrl, original: baseUrl };
  }

  const [prefix, suffix] = parts;
  return {
    // f_auto automatically serves avif/webp based on browser support
    auto: `${prefix}/upload/f_auto,q_auto/${suffix}`,
    avif: `${prefix}/upload/f_avif,q_auto/${suffix}`,
    webp: `${prefix}/upload/f_webp,q_auto/${suffix}`,
    // Thumbnail for cards
    thumb: `${prefix}/upload/f_auto,q_auto,w_400,c_limit/${suffix}`,
    // Full size for modal
    full: `${prefix}/upload/f_auto,q_auto,w_1200,c_limit/${suffix}`,
    original: baseUrl,
  };
};
