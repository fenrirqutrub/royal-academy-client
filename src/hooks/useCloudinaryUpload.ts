const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  eager?: Array<{
    secure_url: string;
    format: string;
    width: number;
    height: number;
  }>;
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

// ── Optimize & convert to WebP (no JPEG fallback, resize large images) ──────
const convertToWebP = async (
  file: File | Blob,
): Promise<{ blob: Blob; ext: "webp" }> => {
  const canWebP = await supportsWebP();
  if (!canWebP) {
    // WebP সমর্থন না থাকলে অরিজিনাল ফাইল পাঠানোর পরিবর্তে একটি ত্রুটি ছুঁড়বো,
    // কারণ তুমি JPEG ফ্যালব্যাক চাচ্ছো না।
    throw new Error("Browser does not support WebP encoding.");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // বড় ইমেজের জন্য সর্বোচ্চ মাত্রা নির্ধারণ (মেমরি ও পারফরম্যান্স বাঁচাতে)
      const MAX_WIDTH = 2048;
      const MAX_HEIGHT = 2048;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, ext: "webp" });
          } else {
            reject(new Error("Image conversion to WebP failed"));
          }
        },
        "image/webp",
        0.85, // quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
};

// ── Single file direct Cloudinary upload (with eager AVIF/WebP) ──────────────
export const uploadToCloudinaryDirect = async (
  file: File | Blob,
  folder: string = "uploads",
): Promise<CloudinaryResult> => {
  // WebP-তে কনভার্ট (সাইজ ছোট ও অপ্টিমাইজড)
  const { blob, ext } = await convertToWebP(file);

  const fd = new FormData();
  fd.append("file", blob, `image.${ext}`);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", folder);

  // Cloudinary eager transformations: AVIF এবং WebP ডেরিভেটিভ তৈরি করবে
  fd.append("eager", "f_avif,q_auto");
  fd.append("eager", "f_webp,q_auto");

  // দীর্ঘ আপলোডের জন্য AbortController ব্যবহার করে টাইমআউট বাড়ানো (৬০ সেকেন্ড)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: fd,
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Cloudinary upload failed");
    }

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
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
    avif: `${prefix}/upload/f_avif,q_auto/${suffix}`,
    webp: `${prefix}/upload/f_webp,q_auto/${suffix}`,
    original: baseUrl,
  };
};
