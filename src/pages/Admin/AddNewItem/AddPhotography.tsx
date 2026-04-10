// src/pages/Admin/AddNewItem/AddPhotography.tsx

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCloudUploadOutline,
  IoCheckmarkCircle,
  IoTrashOutline,
} from "react-icons/io5";
import toast from "react-hot-toast";
import axiosPublic from "../../../hooks/axiosPublic";
import { UploadCloud } from "lucide-react";
import type { AxiosError } from "axios";

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

export default function AddPhotography() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axiosPublic.post("/api/photography", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const summary = data.summary;
      if (summary) {
        if (summary.failed > 0) {
          toast.success(
            `Uploaded ${summary.successful}/${summary.total} photos successfully`,
            { duration: 4000 },
          );
        } else {
          toast.success(
            `All ${summary.successful} photos uploaded successfully!`,
          );
        }
      } else {
        toast.success("Photos uploaded successfully!");
      }

      qc.invalidateQueries({ queryKey: ["photos"] });
      qc.invalidateQueries({ queryKey: ["photos-admin"] });

      setTimeout(() => {
        resetForm();
      }, 1500);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || "Upload failed";

      toast.error(message);
      console.error("Upload failed:", error);
    },
  });

  const handleFiles = (newFiles: File[]) => {
    const validFiles: FileWithPreview[] = [];
    let hasError = false;

    for (const file of newFiles) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        hasError = true;
        continue;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        hasError = true;
        continue;
      }

      // Check if file already exists
      const exists = files.some((f) => f.file.name === file.name);
      if (exists) {
        toast.error(`${file.name} is already added`);
        hasError = true;
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => {
        const newTotal = prev.length + validFiles.length;
        if (newTotal > 10) {
          toast.error("Maximum 10 images allowed");
          return [...prev, ...validFiles.slice(0, 10 - prev.length)];
        }
        return [...prev, ...validFiles];
      });
    }

    if (!hasError && validFiles.length > 0) {
      toast.success(`${validFiles.length} image(s) added`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) handleFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
      // Reset input
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    toast.success("Image removed");
  };

  const handleSubmit = () => {
    if (files.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    const formData = new FormData();
    files.forEach((fileWithPreview) => {
      formData.append("images", fileWithPreview.file);
    });

    mutation.mutate(formData);
  };

  const resetForm = () => {
    // Revoke all preview URLs
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen ">
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
          <h1 className="text-5xl md:text-6xl font-bold mb-4 ">
            Upload Photos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Share your beautiful moments - Upload up to 10 photos at once
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-8">
            {/* Drag & Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-4 border-dashed rounded-2xl h-64 flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
                isDragging
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105"
                  : files.length > 0
                    ? "border-green-400 dark:border-green-600"
                    : "border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500"
              }`}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center px-6"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {files.length > 0 ? (
                    <IoCheckmarkCircle className="mx-auto text-8xl text-green-500 mb-4" />
                  ) : (
                    <IoCloudUploadOutline className="mx-auto text-8xl text-gray-400 dark:text-gray-500 mb-6" />
                  )}
                </motion.div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {files.length > 0
                    ? `${files.length} photo${files.length > 1 ? "s" : ""} selected`
                    : "Drop your photos here"}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {files.length > 0
                    ? "Click to add more (Max 10 total)"
                    : "or click to browse (Max 5MB each, 10 photos total)"}
                </p>
              </motion.div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* Preview Grid */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                  {files.map((fileWithPreview) => (
                    <motion.div
                      key={fileWithPreview.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300"
                    >
                      <img
                        src={fileWithPreview.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay with filename */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2">
                        <p className="text-white text-xs text-center mb-2 truncate w-full px-2">
                          {fileWithPreview.file.name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(fileWithPreview.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200"
                        >
                          <IoTrashOutline size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                onClick={handleSubmit}
                disabled={mutation.isPending || files.length === 0}
                whileHover={{
                  scale: files.length > 0 && !mutation.isPending ? 1.02 : 1,
                }}
                whileTap={{
                  scale: files.length > 0 && !mutation.isPending ? 0.98 : 1,
                }}
                className={`flex-1 py-4 px-8 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
                  mutation.isPending || files.length === 0
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-2xl hover:scale-105"
                }`}
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <UploadCloud className="mx-auto w-20 h-20 text-gray-400 dark:text-gray-500 mb-6" />
                    Uploading {files.length} photo{files.length > 1 ? "s" : ""}
                    ...
                  </span>
                ) : (
                  `Upload ${files.length} Photo${files.length > 1 ? "s" : ""}`
                )}
              </motion.button>

              {files.length > 0 && (
                <motion.button
                  onClick={resetForm}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-300"
                >
                  Clear All
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-purple-200 dark:border-gray-600"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            📸 Upload Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Upload multiple photos at once (up to 10 photos)</li>
            <li>• Use high-quality images for best results</li>
            <li>• Maximum file size: 5MB per photo</li>
            <li>• Supported formats: JPG, PNG, WebP, GIF</li>
            <li>
              • Photos are automatically optimized and added to the gallery
            </li>
            <li>• You can remove individual photos before uploading</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
