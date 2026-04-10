// AddNotice.tsx  →  route: /dashboard/notices/add
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosPublic from "../../../hooks/axiosPublic";

interface NoticeFormData {
  notice: string;
  durationDays: number;
}

// ── preview slug with new format: Royal-Notice-YYMMDD-01 ─────────────────────
const previewSlug = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `Royal-Notice-${yy}${mm}${dd}-??`;
};

const AddNotice = () => {
  const queryClient = useQueryClient();
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NoticeFormData>({
    defaultValues: { notice: "", durationDays: 1 },
  });

  const noticeValue = watch("notice");
  const daysValue = watch("durationDays");

  const expiryPreview = (() => {
    const d = parseInt(String(daysValue), 10);
    if (!d || d < 1) return null;
    const date = new Date();
    date.setDate(date.getDate() + d);
    return date.toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  })();

  const createMutation = useMutation({
    mutationFn: (data: NoticeFormData) =>
      axiosPublic.post("/api/notices", {
        notice: data.notice,
        durationDays: data.durationDays, // ← explicitly send both fields
      }),
    onSuccess: (res) => {
      setSuccessSlug(res.data.data.noticeSlug);
      reset();
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["active-notice"] });
      setTimeout(() => setSuccessSlug(null), 4000);
    },
  });

  const onSubmit = (data: NoticeFormData) => createMutation.mutate(data);

  return (
    <div
      className="min-h-screen bangla w-full px-4 sm:px-8 py-10"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-1 h-9 rounded-full"
            style={{ backgroundColor: "var(--color-text)" }}
          />
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            নোটিশ যোগ করুন
          </h1>
        </div>
        <p
          className="ml-4 pl-3 text-base sm:text-lg"
          style={{ color: "var(--color-gray)" }}
        >
          নতুন নোটিশ তৈরি করুন এবং সময়কাল নির্ধারণ করুন
        </p>
      </motion.div>

      {/* ── Form Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full rounded-2xl p-6 sm:p-8 md:p-10"
        style={{
          backgroundColor: "var(--color-active-bg)",
          border: "1px solid var(--color-active-border)",
        }}
      >
        {/* Auto ID badge */}
        <div className="flex items-center gap-3 mb-7">
          <span
            className="text-sm tracking-widest uppercase font-semibold"
            style={{ color: "var(--color-gray)" }}
          >
            Auto ID
          </span>
          <span
            className="text-sm font-bold px-4 py-1.5 rounded-full tracking-widest"
            style={{
              backgroundColor: "var(--color-bg)",
              color: "rgba(245,197,66,0.9)",
              border: "1px solid var(--color-active-border)",
            }}
          >
            {previewSlug()}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Notice textarea */}
          <div className="mb-7">
            <label
              className="block text-sm sm:text-base font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "var(--color-gray)" }}
            >
              নোটিশের বিষয়বস্তু <span style={{ color: "#f87171" }}>*</span>
            </label>
            <div className="relative">
              <textarea
                {...register("notice", {
                  required: "Notice content is required.",
                  minLength: { value: 10, message: "At least 10 characters." },
                  maxLength: {
                    value: 1000,
                    message: "Maximum 1000 characters.",
                  },
                })}
                rows={6}
                placeholder="এখানে অফিসিয়াল নোটিশ লিখুন…"
                className="w-full rounded-xl px-5 py-4 text-base sm:text-lg resize-none outline-none transition-all duration-200"
                style={{
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                  border: errors.notice
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid var(--color-active-border)",
                }}
              />
              <span
                className="absolute bottom-4 right-4 text-xs sm:text-sm tabular-nums"
                style={{
                  color:
                    (noticeValue?.length ?? 0) > 900
                      ? "#f87171"
                      : "var(--color-gray)",
                }}
              >
                {noticeValue?.length ?? 0}/1000
              </span>
            </div>
            <AnimatePresence>
              {errors.notice && (
                <motion.p
                  key="n-err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-sm mt-2"
                >
                  ⚠ {errors.notice.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Duration input */}
          <div className="mb-8">
            <label
              className="block text-sm sm:text-base font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "var(--color-gray)" }}
            >
              সময়কাল (দিন) <span style={{ color: "#f87171" }}>*</span>
            </label>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="number"
                  min={1}
                  max={365}
                  {...register("durationDays", {
                    required: "Duration is required.",
                    min: { value: 1, message: "Minimum 1 day." },
                    max: { value: 365, message: "Maximum 365 days." },
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl px-5 py-4 text-base sm:text-lg outline-none transition-all duration-200 appearance-none"
                  style={{
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text)",
                    border: errors.durationDays
                      ? "1px solid rgba(239,68,68,0.6)"
                      : "1px solid var(--color-active-border)",
                  }}
                  placeholder="যেমন: ৭"
                />
                <span
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                  style={{ color: "var(--color-gray)" }}
                >
                  days
                </span>
              </div>

              {/* Expiry preview pill */}
              <AnimatePresence mode="wait">
                {expiryPreview && (
                  <motion.div
                    key={expiryPreview}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 rounded-xl px-4 py-4"
                    style={{
                      backgroundColor: "var(--color-bg)",
                      border: "1px solid var(--color-active-border)",
                    }}
                  >
                    <span
                      className="text-xs sm:text-sm uppercase tracking-wider"
                      style={{ color: "var(--color-gray)" }}
                    >
                      মেয়াদ শেষ
                    </span>
                    <span
                      className="text-sm sm:text-base font-bold"
                      style={{ color: "#f5c542" }}
                    >
                      {expiryPreview}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {errors.durationDays && (
                <motion.p
                  key="d-err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-sm mt-2"
                >
                  ⚠ {errors.durationDays.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full font-bold text-base sm:text-lg py-4 rounded-xl tracking-widest uppercase transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-text)",
              color: "var(--color-bg)",
            }}
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-3">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    ease: "linear",
                  }}
                  className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full"
                  style={{
                    borderColor: "var(--color-bg)",
                    borderTopColor: "transparent",
                  }}
                />
                প্রকাশ করা হচ্ছে…
              </span>
            ) : (
              "✦ নোটিশ প্রকাশ করুন"
            )}
          </motion.button>
        </form>

        {/* Success */}
        <AnimatePresence>
          {successSlug && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-5 rounded-xl px-5 py-4 flex items-start gap-4"
              style={{
                backgroundColor: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <span className="text-emerald-400 text-2xl leading-none">✓</span>
              <div>
                <p className="text-emerald-400 text-base sm:text-lg font-semibold">
                  নোটিশ সফলভাবে প্রকাশিত হয়েছে!
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-gray)" }}
                >
                  ID:{" "}
                  <span className="font-mono" style={{ color: "#f5c542" }}>
                    {successSlug}
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API error */}
        <AnimatePresence>
          {createMutation.isError && (
            <motion.div
              key="api-err"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 rounded-xl px-5 py-4 text-base"
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
              }}
            >
              ✗{" "}
              {(createMutation.error as any)?.response?.data?.message ||
                "Something went wrong."}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AddNotice;
