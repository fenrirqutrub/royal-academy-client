import React, { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Upload,
  CheckCircle,
  XCircle,
  Crop as CropIcon,
  Check,
  ImageIcon,
  Loader2,
} from "lucide-react";

import axiosPublic from "../../../hooks/axiosPublic";
import Button from "../../../components/common/Button";
import {
  uploadToCloudinaryDirect,
  convertToModernFormats,
  type ConvertedImageBlobs,
} from "../../../hooks/useCloudinaryUpload";

// ─── Types ────────────────────────────────────────────────────────────────

interface HeroFormData {
  title: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

// ─── Crop helper ──────────────────────────────────────────────────────────
// No fixed aspect — whatever the user draws is what they get.
// Width is always ≥ height (landscape guard).
const getCroppedBlob = (
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  let w = Math.round(pixelCrop.width * scaleX);
  let h = Math.round(pixelCrop.height * scaleY);

  // Landscape guard: if portrait, swap so width > height
  if (w < h) [w, h] = [h, w];

  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    w,
    h,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/webp",
      0.92,
    );
  });
};

// ─── Format badge component ───────────────────────────────────────────────
const FormatBadge = ({
  format,
  size,
}: {
  format: "avif" | "webp" | "webp-fallback";
  size: number;
}) => {
  const labels: Record<string, { label: string; color: string }> = {
    avif: {
      label: "AVIF",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    webp: {
      label: "WebP",
      color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    },
    "webp-fallback": {
      label: "WebP",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
  };
  const { label, color } = labels[format];
  const kb = (size / 1024).toFixed(1);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      {label} · {kb} KB
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────
const AddHero = () => {
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // After crop confirmation
  const [convertedFormats, setConvertedFormats] =
    useState<ConvertedImageBlobs | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>("");

  const [isCropping, setIsCropping] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HeroFormData>();

  // ── File input ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke old URLs
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setCroppedPreviewUrl("");
    setConvertedFormats(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Default crop on image load ────────────────────────────────────────
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setTimeout(() => {
        const rect = img.getBoundingClientRect();
        const displayW = rect.width;
        const displayH = rect.height;
        if (!displayW || !displayH) return;

        // Default: full width, 16:9 landscape crop centred
        const cropH = Math.min(displayW * (9 / 16), displayH);
        const cropW = cropH < displayH ? displayW : displayH * (16 / 9);
        const x = (displayW - cropW) / 2;
        const y = (displayH - cropH) / 2;

        const initial: PixelCrop = {
          unit: "px",
          x,
          y,
          width: cropW,
          height: cropH,
        };
        setCrop(initial);
        setCompletedCrop(initial);
      }, 50);
    },
    [],
  );

  // ── Confirm crop → convert to avif/webp ──────────────────────────────
  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    try {
      setIsConverting(true);
      const rawBlob = await getCroppedBlob(imgRef.current, completedCrop);

      // Convert to modern formats in-browser
      const formats = await convertToModernFormats(rawBlob, 1920, 0.85);
      setConvertedFormats(formats);

      const previewUrl = URL.createObjectURL(formats.preferredBlob);
      setCroppedPreviewUrl(previewUrl);
      setIsCropping(false);
    } catch (err) {
      console.error("Crop/convert failed:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const createHeroMutation = useMutation({
    mutationFn: async (data: HeroFormData) => {
      if (!convertedFormats)
        throw new Error("Please select and crop an image first");

      setUploadProgress(0);

      // Upload whichever format was generated (avif preferred, webp fallback)
      const cloudResult = await uploadToCloudinaryDirect(
        convertedFormats.preferredBlob,
        "heroes",
        (pct) => setUploadProgress(pct),
      );

      const response = await axiosPublic.post("/api/heroes", {
        title: data.title,
        imageUrl: cloudResult.secure_url,
        imagePublicId: cloudResult.public_id,
        imageFormat: convertedFormats.preferred, // store which format was uploaded
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroes"] });
      reset();
      if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
      setCroppedPreviewUrl("");
      setConvertedFormats(null);
      setRawImageSrc("");
      setUploadProgress(0);
    },
  });

  const onSubmit = (data: HeroFormData) => {
    createHeroMutation.mutate(data);
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full container max-w-2xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-3 text-[var(--color-text)]">
            Create Hero
          </h1>
          <p className="text-[var(--color-gray)] text-base">
            Crop freely · Converts to AVIF / WebP in browser · Uploads direct to
            Cloudinary
          </p>
        </motion.div>

        {/* Status messages */}
        <AnimatePresence mode="wait">
          {createHeroMutation.isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Hero created successfully!
              </p>
            </motion.div>
          )}
          {createHeroMutation.isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3"
            >
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-800 dark:text-red-300 font-medium">
                {(createHeroMutation.error as ApiError)?.response?.data
                  ?.message || "Error creating hero"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
          >
            <label className="block mb-2 text-sm font-semibold text-[var(--color-text)]">
              Hero Title
            </label>
            <input
              type="text"
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 3,
                  message: "Title must be at least 3 characters",
                },
              })}
              placeholder="Enter hero title"
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-active-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-gray)] focus:border-[var(--color-text-hover)] focus:ring-4 focus:ring-[var(--color-active-bg)] transition-all duration-200 outline-none"
            />
            {errors.title && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-500"
              >
                {errors.title.message}
              </motion.p>
            )}
          </motion.div>

          {/* Image upload / preview */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <label className="block mb-2 text-sm font-semibold text-[var(--color-text)]">
              Hero Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="imageUpload"
            />

            {!croppedPreviewUrl ? (
              <label
                htmlFor="imageUpload"
                className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-[var(--color-active-border)] rounded-2xl cursor-pointer bg-[var(--color-active-bg)] hover:border-[var(--color-text-hover)] transition-all duration-200 group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[var(--color-active-border)]/30 flex items-center justify-center mb-4 group-hover:bg-[var(--color-text-hover)]/10 transition-colors">
                    <ImageIcon className="w-8 h-8 text-[var(--color-gray)]" />
                  </div>
                  <p className="text-sm text-[var(--color-text)] font-semibold mb-1">
                    Click to upload any image
                  </p>
                  <p className="text-xs text-[var(--color-gray)]">
                    Any size · Any format · You'll crop it next
                  </p>
                  <p className="text-xs text-[var(--color-gray)] mt-1 opacity-70">
                    Converts to AVIF / WebP in browser before upload
                  </p>
                </motion.div>
              </label>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {/* Preview */}
                <div
                  className="relative w-full rounded-2xl overflow-hidden border-2 border-[var(--color-text-hover)]"
                  style={{ aspectRatio: "16/9" }}
                >
                  <img
                    src={croppedPreviewUrl}
                    alt="Cropped preview"
                    className="w-full h-full object-cover"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  >
                    <CropIcon className="w-8 h-8 text-white mb-2" />
                    <span className="text-white text-sm font-medium">
                      Change / Re-crop
                    </span>
                  </label>
                </div>

                {/* Format info */}
                {convertedFormats && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-2 px-1"
                  >
                    <span className="text-xs text-[var(--color-gray)]">
                      Converted:
                    </span>
                    {convertedFormats.avif && (
                      <FormatBadge
                        format="avif"
                        size={convertedFormats.avif.size}
                      />
                    )}
                    <FormatBadge
                      format={convertedFormats.avif ? "webp" : "webp-fallback"}
                      size={convertedFormats.webp.size}
                    />
                    <span className="text-xs text-[var(--color-gray)] ml-auto">
                      Uploading:{" "}
                      <span className="font-semibold text-[var(--color-text)]">
                        {convertedFormats.preferred.toUpperCase()}
                      </span>
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Upload progress */}
          <AnimatePresence>
            {createHeroMutation.isPending && uploadProgress > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--color-gray)]">
                    {uploadProgress < 30 ? "Converting…" : "Uploading…"}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text)]">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-active-border)]/30 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[var(--color-text)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
            type="submit"
            disabled={createHeroMutation.isPending || !convertedFormats}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] font-bold text-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createHeroMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadProgress < 30
                  ? "Converting…"
                  : `Uploading… ${uploadProgress}%`}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Create Hero
              </>
            )}
          </motion.button>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 text-xs text-[var(--color-gray)]"
        >
          All conversion happens in your browser · Server never sees the
          original file
        </motion.p>
      </motion.div>

      {/* ─── Crop Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCropping && rawImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[var(--color-bg)] rounded-2xl p-6 w-full max-w-3xl shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    Crop Image
                  </h2>
                  <p className="text-sm text-[var(--color-gray)] mt-0.5">
                    Drag freely — any shape works. Width will always be ≥
                    height.
                  </p>
                </div>
                <button
                  onClick={() => setIsCropping(false)}
                  className="text-[var(--color-gray)] hover:text-[var(--color-text)] transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Crop area — NO fixed aspect ratio */}
              <div className="flex justify-center rounded-xl bg-[var(--color-active-bg)] p-2 max-h-[65vh] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  minWidth={80}
                  minHeight={40}
                  // aspect is intentionally NOT set → free crop
                >
                  <img
                    ref={imgRef}
                    src={rawImageSrc}
                    alt="Crop source"
                    onLoad={onImageLoad}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "60vh",
                      objectFit: "contain",
                    }}
                  />
                </ReactCrop>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setIsCropping(false)}
                  className="flex-1 py-3 rounded font-semibold bg-red-500 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCropConfirm}
                  disabled={!completedCrop || isConverting}
                  className="flex-1 py-3 text-md md:text-xl rounded justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Converting…
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirm Crop
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddHero;
