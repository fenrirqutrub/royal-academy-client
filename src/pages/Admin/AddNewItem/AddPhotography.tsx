// src/pages/Admin/AddNewItem/AddPhotography.tsx

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { UploadCloud } from "lucide-react";
import type { AxiosError } from "axios";

import axiosPublic from "../../../hooks/axiosPublic";
import { uploadEditedBlobsToCloudinary } from "../../../hooks/useCloudinaryUpload";
import ImageUploadWithEditor, {
  type EditedImage,
} from "../../../components/common/ImageUploadWithEditor";

export default function AddPhotography() {
  const [images, setImages] = useState<EditedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const qc = useQueryClient();

  // ── Mutation ───────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async () => {
      const uploaded = await uploadEditedBlobsToCloudinary(
        images.map((img) => img.blob),
        {
          folder: "photography",
          onProgress: setUploadProgress,
        },
      );

      const res = await axiosPublic.post("/api/photography/save-urls", {
        images: uploaded.map((r) => ({
          imageUrl: r.secure_url,
          publicId: r.public_id,
          width: r.width,
          height: r.height,
          format: r.format,
          size: r.bytes,
        })),
      });

      return res.data;
    },

    onSuccess: (data) => {
      toast.success(
        `${data.data?.length ?? 0} photo(s) uploaded successfully!`,
      );
      qc.invalidateQueries({ queryKey: ["photos"] });
      qc.invalidateQueries({ queryKey: ["photos-admin"] });
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setUploadProgress(0);
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || "Upload failed");
      setUploadProgress(0);
    },
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[var(--color-text)]">
            Upload Photos
          </h1>
          <p className="text-[var(--color-gray)] text-lg">
            Share your beautiful moments — Upload up to 10 photos at once
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--color-bg)] border border-[var(--color-active-border)] rounded-3xl shadow-2xl p-8 md:p-12"
        >
          <div className="space-y-8">
            {/* Image Upload + Editor */}
            <ImageUploadWithEditor
              images={images}
              onChange={setImages}
              maxImages={10}
              allowSkipEdit={true}
            />

            {/* Upload Progress */}
            <AnimatePresence>
              {mutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm text-[var(--color-gray)]">
                    <span>Uploading to Cloudinary...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--color-active-bg)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || images.length === 0}
              whileHover={{
                scale: images.length > 0 && !mutation.isPending ? 1.02 : 1,
              }}
              whileTap={{
                scale: images.length > 0 && !mutation.isPending ? 0.98 : 1,
              }}
              className={`w-full py-4 px-8 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
                mutation.isPending || images.length === 0
                  ? "bg-[var(--color-gray)] cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-2xl"
              }`}
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-3">
                  <UploadCloud className="w-5 h-5 animate-bounce" />
                  Uploading {images.length} photo{images.length > 1 ? "s" : ""}…{" "}
                  {uploadProgress}%
                </span>
              ) : (
                `Upload ${images.length} Photo${images.length > 1 ? "s" : ""}`
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-[var(--color-active-bg)] border border-[var(--color-active-border)] rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-3">
            📸 Upload Tips
          </h3>
          <ul className="space-y-2 text-sm text-[var(--color-gray)]">
            <li>• Upload multiple photos at once (up to 10 photos)</li>
            <li>• Crop, rotate, and flip each photo before uploading</li>
            <li>• Supported formats: JPG, PNG, WebP, GIF</li>
            <li>• Photos go directly to Cloudinary — no server bottleneck</li>
            <li>• Images are auto-converted to WebP for optimal performance</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
