import { LoaderCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, type SubmitHandler } from "react-hook-form";
import axiosPublic from "../../../hooks/axiosPublic";
import toast from "react-hot-toast";

interface AddComplainProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  description: string;
}

const AddComplain = ({ isOpen, onClose }: AddComplainProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      description: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await axiosPublic.post("/api/complain", data);
      toast.success("অভিযোগ সফলভাবে জমা হয়েছে");
      reset();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("অভিযোগ জমা দিতে সমস্যা হয়েছে");
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
          onClick={!isSubmitting ? onClose : undefined}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
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
                <p className="text-xs uppercase tracking-widest text-[var(--color-gray)] mb-0.5">
                  সহায়তা কেন্দ্র
                </p>
                <h2 className="text-[1.25rem] font-semibold text-[var(--color-text)]">
                  অভিযোগ জানান
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-full bg-red-500 hover:rotate-90 transition-transform duration-300"
              >
                <X className="text-white w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-5 flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[var(--color-gray)] mb-1.5"
                >
                  বিস্তারিত বিবরণ
                </label>

                <textarea
                  id="description"
                  rows={4}
                  placeholder="আপনার অভিযোগ বিস্তারিতভাবে লিখুন..."
                  {...register("description", {
                    required: "অভিযোগ লিখুন",
                    minLength: {
                      value: 10,
                      message: "কমপক্ষে ১০ অক্ষর লিখুন",
                    },
                  })}
                  className="w-full py-2.5 px-3 rounded border-2 border-[var(--color-active-border)] bg-[var(--color-active-bg)] text-[var(--color-text)] placeholder:text-[var(--color-gray)] outline-none text-sm transition-colors resize-none whitespace-pre-line"
                />

                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] rounded text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    জমা দেওয়া হচ্ছে...
                  </span>
                ) : (
                  "জমা দিন"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddComplain;
