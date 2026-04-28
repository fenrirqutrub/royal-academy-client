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

export interface ConvertedImageBlobs {
  avif: Blob | null;
  webp: Blob;
  /** Which format is preferred for upload (avif if supported, else webp) */
  preferred: "avif" | "webp";
  preferredBlob: Blob;
}

// ── Browser support detection ─────────────────────────────────────────────
const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    // 1×1 AVIF test image
    img.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKBzgADlAgIGkyCR/wAABAAACvcA==";
  });
};

let avifSupported: boolean | null = null;
const getAVIFSupport = async (): Promise<boolean> => {
  if (avifSupported !== null) return avifSupported;
  avifSupported = await supportsAVIF();
  return avifSupported;
};

const hasOffscreenCanvas =
  typeof OffscreenCanvas !== "undefined" &&
  typeof createImageBitmap !== "undefined";

// ── Core resize + multi-format convert ───────────────────────────────────
const resizeToDimensions = async (
  file: File | Blob,
  maxDimension = 1920,
): Promise<{
  canvas: HTMLCanvasElement | OffscreenCanvas;
  bitmap: ImageBitmap;
}> => {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  if (hasOffscreenCanvas) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    if (!ctx) throw new Error("OffscreenCanvas context failed");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return { canvas, bitmap };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, bitmap };
};

const canvasToBlob = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality: number,
): Promise<Blob> => {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to convert canvas to ${type}`));
      },
      type,
      quality,
    );
  });
};

/**
 * Converts any image file/blob to both WebP and AVIF (if browser supports encoding).
 * Returns both blobs + which one is preferred for upload.
 * Frontend-only — no server involved.
 */
export const convertToModernFormats = async (
  file: File | Blob,
  maxDimension = 1920,
  quality = 0.82,
): Promise<ConvertedImageBlobs> => {
  const { canvas, bitmap } = await resizeToDimensions(file, maxDimension);
  bitmap.close();

  const webpBlob = await canvasToBlob(canvas, "image/webp", quality);

  // Try AVIF encoding — not all browsers support encoding even if they support decoding
  let avifBlob: Blob | null = null;
  try {
    const candidate = await canvasToBlob(canvas, "image/avif", quality);
    // Some browsers silently fall back to PNG when AVIF encode fails
    if (
      candidate.type === "image/avif" &&
      candidate.size < webpBlob.size * 1.5
    ) {
      avifBlob = candidate;
    }
  } catch {
    // AVIF encode not supported — fine, use WebP
  }

  const preferred = avifBlob ? "avif" : "webp";
  const preferredBlob = avifBlob ?? webpBlob;

  return { avif: avifBlob, webp: webpBlob, preferred, preferredBlob };
};

export const uploadSingleWithProgress = (
  blob: Blob,
  folder: string,
  filename: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<CloudinaryResult> => {
  return new Promise((resolve, reject) => {
    const getExtFromMime = (type: string) => {
      switch (type) {
        case "image/avif":
          return "avif";
        case "image/webp":
          return "webp";
        case "image/jpeg":
          return "jpg";
        case "image/png":
          return "png";
        default:
          return "bin";
      }
    };

    const ext = getExtFromMime(blob.type);

    const fd = new FormData();
    fd.append("file", blob, `${filename}.${ext}`);
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    );
    xhr.timeout = 120_000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryResult);
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

export const uploadToCloudinaryDirect = async (
  file: File | Blob,
  folder = "uploads",
  onProgress?: (percent: number) => void,
): Promise<CloudinaryResult> => {
  onProgress?.(5);
  const converted = await convertToModernFormats(file);
  onProgress?.(30);

  const result = await uploadSingleWithProgress(
    converted.preferredBlob,
    folder,
    "image",
    (loaded, total) => {
      const uploadPercent = 30 + Math.round((loaded / total) * 70);
      onProgress?.(Math.min(uploadPercent, 99));
    },
  );

  onProgress?.(100);
  return result;
};

/**
 * Multiple file upload with accurate combined progress.
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  options: { folder?: string; onProgress?: (percent: number) => void } = {},
): Promise<CloudinaryResult[]> => {
  const { folder = "uploads", onProgress } = options;

  const convertedFiles: ConvertedImageBlobs[] = [];
  for (let i = 0; i < files.length; i++) {
    const converted = await convertToModernFormats(files[i]);
    convertedFiles.push(converted);
    onProgress?.(Math.round(((i + 1) / files.length) * 30));
  }

  const blobs = convertedFiles.map((c) => c.preferredBlob);
  const totalBytes = blobs.reduce((sum, b) => sum + b.size, 0);
  const results: CloudinaryResult[] = [];

  for (let i = 0; i < blobs.length; i++) {
    const result = await uploadSingleWithProgress(
      blobs[i],
      folder,
      `image_${i}`,
      (loaded) => {
        const prevBytes = blobs.slice(0, i).reduce((s, b) => s + b.size, 0);
        const overall = prevBytes + blobs[i].size * (loaded / blobs[i].size);
        onProgress?.(30 + Math.round((overall / totalBytes) * 70));
      },
    );
    results.push(result);
  }

  onProgress?.(100);
  return results;
};

// ── Cloudinary URL transforms ─────────────────────────────────────────────
export const getCloudinaryOptimizedUrls = (baseUrl: string) => {
  if (!baseUrl || typeof baseUrl !== "string") {
    return { auto: "", avif: "", webp: "", thumb: "", full: "", original: "" };
  }
  const parts = baseUrl.split("/upload/");
  if (parts.length !== 2) {
    return {
      auto: baseUrl,
      avif: baseUrl,
      webp: baseUrl,
      thumb: baseUrl,
      full: baseUrl,
      original: baseUrl,
    };
  }
  const [prefix, suffix] = parts;
  return {
    auto: `${prefix}/upload/f_auto,q_auto/${suffix}`,
    avif: `${prefix}/upload/f_avif,q_auto/${suffix}`,
    webp: `${prefix}/upload/f_webp,q_auto/${suffix}`,
    thumb: `${prefix}/upload/f_auto,q_auto,w_400,c_limit/${suffix}`,
    full: `${prefix}/upload/f_auto,q_auto,w_1200,c_limit/${suffix}`,
    original: baseUrl,
  };
};

export const uploadEditedBlobsToCloudinary = async (
  blobs: Blob[],
  options: { folder?: string; onProgress?: (percent: number) => void } = {},
): Promise<CloudinaryResult[]> => {
  const { folder = "uploads", onProgress } = options;

  if (blobs.length === 0) return [];

  const totalBytes = blobs.reduce((sum, b) => sum + b.size, 0);
  const results: CloudinaryResult[] = [];

  // No conversion needed — blobs are already WebP from the editor
  onProgress?.(5);

  for (let i = 0; i < blobs.length; i++) {
    const result = await uploadSingleWithProgress(
      blobs[i],
      folder,
      `image_${i}`,
      (loaded) => {
        const prevBytes = blobs.slice(0, i).reduce((s, b) => s + b.size, 0);
        const currentProgress = loaded / blobs[i].size;
        const overall =
          (prevBytes + blobs[i].size * currentProgress) / totalBytes;
        onProgress?.(5 + Math.round(overall * 95));
      },
    );
    results.push(result);
  }

  onProgress?.(100);
  return results;
};

/**
 * Render helper — returns the best <source> srcSet for a <picture> element.
 * Usage:
 *   const urls = getCloudinaryOptimizedUrls(imageUrl);
 *   <picture>
 *     <source type="image/avif" srcSet={urls.avif} />
 *     <source type="image/webp" srcSet={urls.webp} />
 *     <img src={urls.original} alt="..." />
 *   </picture>
 */
export { getAVIFSupport };
