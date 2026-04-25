// src/pages/dashboard/heroes/AddHero.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";

import axiosPublic from "../../../hooks/axiosPublic";
import { uploadEditedBlobsToCloudinary } from "../../../hooks/useCloudinaryUpload";
import ImageUploadWithEditor, {
  type EditedImage,
} from "../../../components/common/ImageUploadWithEditor";

// ─── Types ────────────────────────────────────────────────

interface HeroFormData {
  title: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

// ─── Component ────────────────────────────────────────────

const AddHero = () => {
  const [images, setImages] = useState<EditedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<HeroFormData>();

  // ── Submit ───────────────────────────────────────────────
  const createHeroMutation = useMutation({
    mutationFn: async (data: HeroFormData) => {
      if (!images.length)
        throw new Error("Please select and crop an image first");

      setUploadProgress(0);

      const [cloudResult] = await uploadEditedBlobsToCloudinary(
        [images[0].blob],
        {
          folder: "heroes",
          onProgress: setUploadProgress,
        },
      );

      const response = await axiosPublic.post("/api/heroes", {
        title: data.title,
        imageUrl: cloudResult.secure_url,
        imagePublicId: cloudResult.public_id,
        imageFormat: "webp",
      });

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroes"] });
      reset();
      // Revoke old preview URLs
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setUploadProgress(0);
    },
  });

  const onSubmit = (data: HeroFormData) => createHeroMutation.mutate(data);

  // ─── Render ───────────────────────────────────────────────
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
            Crop freely · Converts to WebP in browser · Uploads direct to
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
              Hero Title{" "}
              <span className="text-[var(--color-gray)] font-normal text-xs">
                (ঐচ্ছিক)
              </span>
            </label>
            <input
              type="text"
              {...register("title", {
                minLength: {
                  value: 3,
                  message: "Title must be at least 3 characters",
                },
              })}
              placeholder="Enter hero title"
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-active-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-gray)] focus:border-[var(--color-text-hover)] focus:ring-4 focus:ring-[var(--color-active-bg)] transition-all duration-200 outline-none"
            />
          </motion.div>

          {/* Image upload */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <label className="block mb-2 text-sm font-semibold text-[var(--color-text)]">
              Hero Image
            </label>
            <ImageUploadWithEditor
              images={images}
              onChange={setImages}
              maxImages={1}
            />
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
                    {uploadProgress < 10 ? "Preparing…" : "Uploading…"}
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
            disabled={createHeroMutation.isPending || !images.length}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] font-bold text-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createHeroMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadProgress < 10
                  ? "Preparing…"
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
    </div>
  );
};

export default AddHero;
