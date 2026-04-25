import { LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosPublic from "../../../hooks/axiosPublic";

interface AddComplainProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddComplain = ({ isOpen, onClose }: AddComplainProps) => {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;

    try {
      setIsSubmitting(true);
      await axiosPublic.post("/api/complain", { description });
      setDescription("");
      onClose();
    } catch (err) {
      console.error("অভিযোগ জমা দিতে সমস্যা হয়েছে:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[200000000] bg-black/60 flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--color-bg)] rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-active-border)]">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--color-text)] mb-0.5">
                  সহায়তা কেন্দ্র
                </p>
                <h2 className="text-[1.25rem] font-semibold text-[var(--color-text)]">
                  অভিযোগ জানান
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-red-500 hover:animate-spin transition-colors"
              >
                <X className="text-white w-4 h-4 " />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                  বিস্তারিত বিবরণ
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="আপনার অভিযোগ বিস্তারিতভাবে লিখুন..."
                  className="w-full py-2.5 px-3 rounded border-2 border-[var(--color-active-border)] bg-[var(--color-active-bg)] text-[var(--color-text)] placeholder:text-[var(--color-gray)] outline-none text-sm transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!description.trim() || isSubmitting}
                className="w-full py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] rounded text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? <LoaderCircle className="w-4 h-4" /> + "জমা দেওয়া হচ্ছে..."
                  : "জমা দিন"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddComplain;
