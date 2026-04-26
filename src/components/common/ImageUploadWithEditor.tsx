// src/components/common/ImageUploadWithEditor.tsx
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, CheckCircle2, Pencil, X, Zap } from "lucide-react";
import ImageEditor from "./ImageEditor";
import { toBn } from "../../utility/Formatters";

export interface EditedImage {
  blob: Blob;
  previewUrl: string;
  originalName: string;
}

interface ImageUploadWithEditorProps {
  images: EditedImage[];
  onChange: (images: EditedImage[]) => void;
  maxImages?: number;
  allowSkipEdit?: boolean; // ← নতুন prop
}

const shimmer = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: { duration: 1.5, repeat: Infinity, repeatDelay: 0.5 },
  },
};

const ImageUploadWithEditor = ({
  images,
  onChange,
  maxImages = 10,
  allowSkipEdit = false,
}: ImageUploadWithEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipInputRef = useRef<HTMLInputElement>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [reEditIndex, setReEditIndex] = useState<number | null>(null);
  const fileQueueRef = useRef<File[]>([]);

  const processFileQueue = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      if (images.length >= maxImages) return;
      fileQueueRef.current = files.slice(1);
      setEditingFile(files[0]);
    },
    [images.length, maxImages],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    processFileQueue([...files]);
  };

  // ── Skip editor: directly add files as-is ────────────────────────────
  const handleSkipEditChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const remaining = maxImages - images.length;
    const toAdd = files.slice(0, remaining);

    const newImages: EditedImage[] = toAdd.map((file) => ({
      blob: file,
      previewUrl: URL.createObjectURL(file),
      originalName: file.name,
    }));

    onChange([...images, ...newImages]);
  };

  const handleEditorConfirm = useCallback(
    (blob: Blob, previewUrl: string) => {
      if (reEditIndex !== null) {
        const updated = [...images];
        URL.revokeObjectURL(updated[reEditIndex].previewUrl);
        updated[reEditIndex] = {
          blob,
          previewUrl,
          originalName: updated[reEditIndex].originalName,
        };
        onChange(updated);
        setReEditIndex(null);
        setEditingFile(null);
        return;
      }

      const newImage: EditedImage = {
        blob,
        previewUrl,
        originalName: editingFile?.name ?? "image",
      };
      const newImages = [...images, newImage];
      onChange(newImages);
      setEditingFile(null);

      if (fileQueueRef.current.length > 0 && newImages.length < maxImages) {
        setTimeout(() => processFileQueue(fileQueueRef.current), 200);
      }
    },
    [editingFile, images, onChange, reEditIndex, maxImages, processFileQueue],
  );

  const handleEditorCancel = useCallback(() => {
    setEditingFile(null);
    setReEditIndex(null);
    fileQueueRef.current = [];
  }, []);

  const removeImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(images[index].previewUrl);
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange],
  );

  const reEditImage = useCallback(
    (index: number) => {
      const img = images[index];
      const file = new File([img.blob], img.originalName, {
        type: img.blob.type || "image/webp",
      });
      setReEditIndex(index);
      setEditingFile(file);
    },
    [images],
  );

  const isFull = images.length >= maxImages;
  const isEditorOpen = editingFile !== null;

  return (
    <div>
      {/* ── Upload Buttons ── */}
      <div
        className={`grid gap-3 ${allowSkipEdit ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Edit করে যোগ করুন */}
        <motion.div
          whileHover={{ scale: isFull ? 1 : 1.01 }}
          whileTap={{ scale: isFull ? 1 : 0.99 }}
          onClick={() => {
            if (!isFull) fileInputRef.current?.click();
          }}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-6
            flex flex-col items-center gap-2 transition-all duration-300
            group relative overflow-hidden
            ${
              isFull
                ? "border-[var(--color-active-border)] opacity-50 cursor-not-allowed"
                : "border-[var(--color-active-border)] hover:border-violet-400"
            }`}
        >
          <motion.div
            variants={shimmer}
            initial="initial"
            animate="animate"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent"
          />
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <ImagePlus className="w-8 h-8 text-[var(--color-gray)] group-hover:text-violet-500 transition-colors" />
          </motion.div>
          <p className="text-sm text-[var(--color-gray)] group-hover:text-violet-500 transition-colors bangla font-medium text-center">
            {allowSkipEdit
              ? "সম্পাদনা করে যোগ করুন"
              : "ক্লিক করুন — ছবি সম্পাদনা করে যোগ করুন"}
          </p>
          {allowSkipEdit && (
            <p className="text-xs text-[var(--color-gray)] bangla text-center">
              ক্রপ, রোটেট, ফ্লিপ সম্ভব
            </p>
          )}
        </motion.div>

        {/* সরাসরি যোগ করুন (full size) */}
        {allowSkipEdit && (
          <motion.div
            whileHover={{ scale: isFull ? 1 : 1.01 }}
            whileTap={{ scale: isFull ? 1 : 0.99 }}
            onClick={() => {
              if (!isFull) skipInputRef.current?.click();
            }}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6
              flex flex-col items-center gap-2 transition-all duration-300
              group relative overflow-hidden
              ${
                isFull
                  ? "border-[var(--color-active-border)] opacity-50 cursor-not-allowed"
                  : "border-[var(--color-active-border)] hover:border-amber-400"
              }`}
          >
            <motion.div
              variants={shimmer}
              initial="initial"
              animate="animate"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Zap className="w-8 h-8 text-[var(--color-gray)] group-hover:text-amber-500 transition-colors" />
            </motion.div>
            <p className="text-sm text-[var(--color-gray)] group-hover:text-amber-500 transition-colors bangla font-medium text-center">
              সরাসরি যোগ করুন
            </p>
            <p className="text-xs text-[var(--color-gray)] bangla text-center">
              ফুল সাইজ · এডিট ছাড়া
            </p>
          </motion.div>
        )}
      </div>

      {isFull && (
        <p className="text-xs text-amber-500 bangla mt-1">
          সর্বোচ্চ {toBn(maxImages)}টি ছবি যোগ করা হয়েছে
        </p>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={skipInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSkipEditChange}
      />

      {/* ── Image Previews Grid ── */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4"
          >
            {images.map((img, i) => (
              <motion.div
                key={img.previewUrl}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="relative group aspect-square rounded-xl overflow-hidden
                  border-2 border-[var(--color-active-border)]
                  hover:border-violet-400 transition-colors"
              >
                <img
                  src={img.previewUrl}
                  alt={`edited-${i}`}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40
                  transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      reEditImage(i);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 bg-amber-500 rounded-full flex items-center
                      justify-center shadow-lg transition-all"
                    title="পুনরায় সম্পাদনা"
                  >
                    <Pencil className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(i);
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-rose-500
                      backdrop-blur-sm text-white flex items-center justify-center
                      transition-colors shadow-md"
                    title="মুছুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                <div
                  className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/60
                  backdrop-blur-sm rounded-full flex items-center justify-center
                  text-white text-xs font-bold border border-white/20"
                >
                  {toBn(i + 1)}
                </div>

                <div
                  className="absolute bottom-1.5 left-1.5 px-2 py-0.5
                  bg-black/60 backdrop-blur-sm rounded-md text-white/80
                  text-[10px] border border-white/10"
                >
                  {(img.blob.size / 1024).toFixed(0)} KB
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {images.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-[var(--color-gray)] mt-2 bangla flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {toBn(images.length)}টি ছবি নির্বাচিত
        </motion.p>
      )}

      {/* ── Image Editor Modal ── */}
      {isEditorOpen && editingFile && (
        <ImageEditor
          key={editingFile.name + editingFile.size + Date.now()}
          file={editingFile}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
};

export default ImageUploadWithEditor;
