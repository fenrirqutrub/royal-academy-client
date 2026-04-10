import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import axiosPublic from "../../../hooks/axiosPublic";

const AddRoutine = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("pdf", file!); // title সরানো
      const res = await axiosPublic.post("/api/routines", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-routine"] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      setFile(null);
      setError("");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "আপলোড ব্যর্থ হয়েছে");
    },
  });

  const handleSubmit = () => {
    if (!file) return setError("PDF ফাইল সিলেক্ট করুন"); // title check সরানো
    mutate();
  };

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setError("শুধুমাত্র PDF ফাইল গ্রহণযোগ্য");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("ফাইলের সাইজ সর্বোচ্চ ২০MB হতে হবে");
      return;
    }
    setError("");
    setFile(f);
  };

  return (
    <div className="max-w-xl mx-auto pt-6 px-4 bangla">
      <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">
        রুটিন যোগ করুন
      </h2>

      {/* PDF Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed cursor-pointer
          transition-colors p-8 flex flex-col items-center gap-3 text-center
          ${
            dragOver
              ? "border-[var(--color-text)] bg-[var(--color-active-bg)]"
              : "border-[var(--color-active-border)] hover:border-[var(--color-text)] hover:bg-[var(--color-active-bg)]"
          }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-4xl">📄</span>
              <p className="text-sm font-medium text-[var(--color-text)]">
                {file.name}
              </p>
              <p className="text-xs opacity-50">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-xs opacity-50 hover:opacity-100 underline transition-opacity"
              >
                পরিবর্তন করুন
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 opacity-50"
            >
              <span className="text-4xl">📁</span>
              <p className="text-sm text-[var(--color-text)]">
                PDF ড্র্যাগ করুন অথবা ক্লিক করুন
              </p>
              <p className="text-xs text-[var(--color-text)]">সর্বোচ্চ ২০MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {isSuccess && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-green-500"
          >
            ✓ রুটিন সফলভাবে যোগ হয়েছে
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={isPending}
        whileTap={{ scale: 0.97 }}
        className="mt-5 w-full py-3 rounded-xl font-semibold text-sm
          bg-[var(--color-text)] text-[var(--color-bg)]
          disabled:opacity-40 transition-opacity"
      >
        {isPending ? "আপলোড হচ্ছে... (একটু সময় লাগবে)" : "আপলোড করুন"}
      </motion.button>

      <p className="mt-3 text-xs opacity-40 text-center">
        PDF এর প্রতিটি পৃষ্ঠা WebP ছবিতে রূপান্তর হয়ে Cloudinary তে সংরক্ষিত
        হবে
      </p>
    </div>
  );
};

export default AddRoutine;
