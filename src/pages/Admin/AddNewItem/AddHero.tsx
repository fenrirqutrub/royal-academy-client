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
} from "lucide-react";
import axiosPublic, { multipartConfig } from "../../../hooks/axiosPublic";
import Button from "../../../components/common/Button";

interface HeroFormData {
  title: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getCroppedBlob = (
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  const rect = image.getBoundingClientRect();
  const scaleX = image.naturalWidth / rect.width;
  const scaleY = image.naturalHeight / rect.height;

  canvas.width = Math.round(pixelCrop.width * scaleX);
  canvas.height = Math.round(pixelCrop.height * scaleY);

  // ✅ Canvas width সবসময় height এর চেয়ে বড় কিনা check
  if (canvas.width < canvas.height) {
    // Portrait হয়ে গেলে swap করো
    [canvas.width, canvas.height] = [canvas.height, canvas.width];
  }

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.95,
    );
  });
};

const AddHero = () => {
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [croppedPreview, setCroppedPreview] = useState<string>("");
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HeroFormData>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCroppedPreview("");
    setCroppedBlob(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;

      setTimeout(() => {
        const rect = img.getBoundingClientRect();
        const displayW = rect.width;
        const displayH = rect.height;

        if (!displayW || !displayH) return;

        // ✅ Landscape crop — width সবসময় height এর চেয়ে বড়
        const cropW = displayW;
        const cropH = displayW * (9 / 16); // 16:9 landscape ratio

        // যদি cropH image এর height এর চেয়ে বড় হয়ে যায়
        const finalCropH = cropH > displayH ? displayH : cropH;
        const finalCropW = cropH > displayH ? displayH * (16 / 9) : cropW;

        const x = (displayW - finalCropW) / 2;
        const y = (displayH - finalCropH) / 2;

        setCrop({
          unit: "px",
          x,
          y,
          width: finalCropW,
          height: finalCropH,
        });

        setCompletedCrop({
          unit: "px",
          x,
          y,
          width: finalCropW,
          height: finalCropH,
        } as PixelCrop);
      }, 50);
    },
    [],
  );

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const previewUrl = URL.createObjectURL(blob);
      setCroppedBlob(blob);
      setCroppedPreview(previewUrl);
      setIsCropping(false);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const createHeroMutation = useMutation({
    mutationFn: async (data: HeroFormData) => {
      if (!croppedBlob) throw new Error("Please crop the image first");

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("img", croppedBlob, "hero.jpg");

      const response = await axiosPublic.post(
        "/api/heroes",
        formData,
        multipartConfig,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroes"] });
      reset();
      setCroppedPreview("");
      setCroppedBlob(null);
      setRawImageSrc("");
    },
  });

  const onSubmit = (data: HeroFormData) => {
    createHeroMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full container"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-3 text-[var(--color-text)]">
            Create Hero
          </h1>
          <p className="text-[var(--color-gray)] text-lg">
            Upload your hero image to Cloudinary
          </p>
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {createHeroMutation.isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Hero created successfully!
              </p>
            </motion.div>
          )}

          {createHeroMutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3"
            >
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-300 font-medium">
                {(createHeroMutation.error as ApiError)?.response?.data
                  ?.message || "Error creating hero"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
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
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-500"
              >
                {errors.title.message}
              </motion.p>
            )}
          </motion.div>

          {/* Image Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
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

            {!croppedPreview ? (
              <label
                htmlFor="imageUpload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[var(--color-active-border)] rounded-xl cursor-pointer bg-[var(--color-active-bg)] hover:border-[var(--color-text-hover)] transition-all duration-200"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-[var(--color-gray)] mb-3" />
                  <p className="text-sm text-[var(--color-text)] font-medium">
                    Click to upload — any orientation
                  </p>
                  <p className="text-xs text-[var(--color-gray)] mt-1">
                    You'll crop after upload • Max 5MB
                  </p>
                </motion.div>
              </label>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full rounded-xl overflow-hidden border-2 border-[var(--color-text-hover)]"
                style={{ aspectRatio: "8/3" }}
              >
                <img
                  src={croppedPreview}
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
              </motion.div>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            type="submit"
            disabled={createHeroMutation.isPending || !croppedBlob}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-[var(--color-text)] text-[var(--color-bg)]  font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createHeroMutation.isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Create Hero
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center mt-6 text-sm text-[var(--color-gray)]"
        >
          Images will be uploaded to Cloudinary • ID auto-generated
        </motion.p>
      </motion.div>

      {/* ─── Crop Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCropping && rawImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--color-bg)] rounded-2xl p-6 w-full max-w-3xl shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    Crop Image
                  </h2>
                  <p className="text-sm text-[var(--color-gray)] mt-0.5">
                    Drag to reposition the crop area
                  </p>
                </div>
                <button
                  onClick={() => setIsCropping(false)}
                  className="text-[var(--color-gray)] hover:text-[var(--color-text)] transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Crop area */}
              <div className="flex justify-center rounded-xl bg-[var(--color-active-bg)] p-2">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  minWidth={100}
                  aspect={16 / 9}
                >
                  <img
                    ref={imgRef}
                    src={rawImageSrc}
                    alt="Crop source"
                    onLoad={onImageLoad}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      objectFit: "contain",
                    }}
                  />
                </ReactCrop>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setIsCropping(false)}
                  className="flex-1 py-3 rounded  font-semibold bg-red-500 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCropConfirm}
                  disabled={!completedCrop}
                  className="flex-1 py-3 text-md md:text-xl rounded justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Check className="w-5 h-5" />
                  Crop
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
