import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Quote, User, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import axiosPublic from "../../../hooks/axiosPublic";
import { AxiosError } from "axios";

type QuoteFormData = {
  content: string;
  author?: string;
};

interface ErrorResponse {
  message?: string;
}

const AddQuote = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuoteFormData>({
    defaultValues: {
      content: "",
      author: "",
    },
  });

  const addQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const response = await axiosPublic.post("/api/quotes", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Quote added successfully! 🎉", { duration: 4000 });
      reset();
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    addQuoteMutation.mutate(data);
  };

  return (
    <div className="min-h-screen ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0C0D12] dark:bg-[#E9EBED] mb-4"
          >
            <Quote className="w-8 h-8 text-[#E9EBED] dark:text-[#0C0D12]" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0C0D12] dark:text-[#E9EBED] mb-2">
            Add Your Quote
          </h1>
          <p className="text-[#0C0D12]/60 dark:text-[#E9EBED]/60 text-lg">
            Share wisdom that inspires you
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-[#1a1b23] rounded-3xl shadow-lg p-8 md:p-10"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Quote Content Field */}
            <div>
              <label className="flex items-center gap-2 text-[#0C0D12] dark:text-[#E9EBED] font-medium mb-3">
                <Quote className="w-5 h-5" />
                Quote *
              </label>
              <textarea
                {...register("content", {
                  required: "Quote is required",
                  minLength: {
                    value: 10,
                    message: "Quote must be at least 10 characters",
                  },
                  maxLength: {
                    value: 600,
                    message: "Quote must not exceed 600 characters",
                  },
                })}
                rows={6}
                placeholder="Write something inspiring..."
                className={`w-full px-4 py-3 rounded-2xl border-2 resize-none 
                  bg-[#E9EBED] dark:bg-[#0C0D12] 
                  text-[#0C0D12] dark:text-[#E9EBED]
                  placeholder:text-[#0C0D12]/40 dark:placeholder:text-[#E9EBED]/40
                  focus:outline-none transition-all
                  ${
                    errors.content
                      ? "border-red-500 focus:border-red-500"
                      : "border-[#0C0D12]/10 dark:border-[#E9EBED]/10 focus:border-[#0C0D12] dark:focus:border-[#E9EBED]"
                  }`}
              />
              {errors.content && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-red-500 text-sm flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.content.message}
                </motion.p>
              )}
            </div>

            {/* Author Field */}
            <div>
              <label className="flex items-center gap-2 text-[#0C0D12] dark:text-[#E9EBED] font-medium mb-3">
                <User className="w-5 h-5" />
                Author (optional)
              </label>
              <input
                {...register("author", {
                  maxLength: {
                    value: 100,
                    message: "Author name is too long",
                  },
                })}
                type="text"
                placeholder="e.g. Anonymous, Rumi, Steve Jobs"
                className="w-full px-4 py-3 rounded-2xl border-2
                  bg-[#E9EBED] dark:bg-[#0C0D12] 
                  text-[#0C0D12] dark:text-[#E9EBED]
                  placeholder:text-[#0C0D12]/40 dark:placeholder:text-[#E9EBED]/40
                  border-[#0C0D12]/10 dark:border-[#E9EBED]/10
                  focus:outline-none focus:border-[#0C0D12] dark:focus:border-[#E9EBED] transition-all"
              />
              {errors.author && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-red-500 text-sm flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.author.message}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting || addQuoteMutation.isPending}
              className="w-full py-4 px-6 rounded-2xl font-semibold text-lg
                bg-[#0C0D12] dark:bg-[#E9EBED] 
                text-[#E9EBED] dark:text-[#0C0D12]
                hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-3 
                shadow-lg transition-all duration-200"
            >
              {addQuoteMutation.isPending || isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding Quote...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Add Quote
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AddQuote;
