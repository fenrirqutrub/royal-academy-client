// AddNotice.tsx  →  route: /dashboard/notices/add
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import axiosPublic from "../../../hooks/axiosPublic";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NoticeFormData {
  notice: string;
  durationDays: number;
}

interface NoticeApiResponse {
  message: string;
  data: {
    noticeSlug: string;
    notice: string;
    durationDays: number;
    expiresAt: string;
    createdAt: string;
  };
}

// ── Templates ─────────────────────────────────────────────────────────────────
interface NoticeTemplate {
  label: string;
  icon: string;
  notice: string;
  durationDays: number;
}

const NOTICE_TEMPLATES: NoticeTemplate[] = [
  {
    label: "ছুটির নোটিশ",
    icon: "🏖️",
    notice:
      "এতদ্বারা সকলের অবগতির জন্য জানানো যাচ্ছে যে, আগামি [তারিখ-সাল-বার] তারিখ থেকে [তারিখ-সাল-বার] পর্যন্ত [উপলক্ষ্য] উপলক্ষে রয়েল একাডেমির বেলকুচি শাখার ছুটি ঘোষণা করা হলো। আগামি [তারিখ-সাল-বার] তারিখ থেকে যথারীতি ক্লাস পুনরায় শুরু হবে।",
    durationDays: 3,
  },
  {
    label: "পরীক্ষার নোটিশ",
    icon: "📝",
    notice:
      "এতদ্বারা সকলের অবগতির জন্য জানানো যাচ্ছে যে, আগামি [তারিখ-সাল-বার] তারিখ থেকে  [পরীক্ষার নাম] পরীক্ষা অনুষ্ঠিত হবে। সকল শিক্ষার্থীকে নির্ধারিত সময়ের কমপক্ষে ১৫ মিনিট পূর্বে উপস্থিত থাকার জন্য আদেশ করা হইলো",
    durationDays: 2,
  },
  {
    label: "অভিভাবক সভা",
    icon: "👨‍👩‍👧",
    notice:
      "এতদ্বারা রয়েল একাডেমির শিক্ষার্থীদের অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, [তারিখ-ফুল] তারিখে বিকাল [সময়] ঘটিকায় একাডেমি প্রাঙ্গণে একটি গুরুত্বপূর্ণ অভিভাবক সভা অনুষ্ঠিত হবে। শিক্ষার্থীদের সার্বিক অগ্রগতি বিষয়ে আলোচনার জন্য সকল অভিভাবকের উপস্থিতি একান্তভাবে কাম্য।",
    durationDays: 5,
  },
  {
    label: "ফলাফল প্রকাশ",
    icon: "🏆",
    notice:
      "এতদ্বারা রয়েল একাডেমির সকল শিক্ষার্থী ও অভিভাবকদের জানানো যাচ্ছে যে, [পরীক্ষার নাম] পরীক্ষার ফলাফল [তারিখ-ফুল] তারিখে প্রকাশ করা হবে। শিক্ষার্থীরা নির্ধারিত সময়ে একাডেমি অফিস থেকে তাদের ফলাফল সংগ্রহ করতে পারবে।",
    durationDays: 14,
  },
  {
    label: "বিশেষ বিজ্ঞপ্তি",
    icon: "📢",
    notice:
      "এতদ্বারা রয়েল একাডেমির সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, [বিস্তারিত]। এ বিষয়ে প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য অনুরোধ করা হলো। অতিরিক্ত তথ্যের জন্য একাডেমি অফিসে যোগাযোগ করুন।",
    durationDays: 7,
  },
];

// ── Preview slug ───────────────────────────────────────────────────────────────
const previewSlug = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `Royal-Notice-${yy}${mm}${dd}-??`;
};

// ── Component ─────────────────────────────────────────────────────────────────
const AddNotice = () => {
  const queryClient = useQueryClient();
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  // ── Apply template ────────────────────────────────────────────────────────
  const applyTemplate = (idx: number) => {
    const tpl = NOTICE_TEMPLATES[idx];
    setValue("notice", tpl.notice, { shouldValidate: true });
    setValue("durationDays", tpl.durationDays, { shouldValidate: true });
    setActiveTemplate(idx);
  };

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createMutation = useMutation<
    { data: NoticeApiResponse },
    AxiosError<{ message: string }>,
    NoticeFormData
  >({
    mutationFn: (data: NoticeFormData) =>
      axiosPublic.post<NoticeApiResponse>("/api/notices", {
        notice: data.notice,
        durationDays: data.durationDays,
      }),
    onSuccess: (res) => {
      const slug = res.data.data.noticeSlug;
      toast.success(`নোটিশ প্রকাশিত হয়েছে!\nID: ${slug}`, {
        duration: 4000,
        style: {
          background: "var(--color-active-bg)",
          color: "var(--color-text)",
          border: "1px solid rgba(16,185,129,0.4)",
        },
        iconTheme: { primary: "#10b981", secondary: "#fff" },
      });
      reset();
      setActiveTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["active-notice"] });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ??
        "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
      toast.error(msg, {
        duration: 4000,
        style: {
          background: "var(--color-active-bg)",
          color: "var(--color-text)",
          border: "1px solid rgba(239,68,68,0.4)",
        },
        iconTheme: { primary: "#ef4444", secondary: "#fff" },
      });
    },
  });

  const onSubmit = (data: NoticeFormData) => createMutation.mutate(data);

  // ── Render ────────────────────────────────────────────────────────────────
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

      {/* ── Templates ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="w-full mb-6"
      >
        <p
          className="text-xs uppercase tracking-widest font-semibold mb-3"
          style={{ color: "var(--color-gray)" }}
        >
          টেমপ্লেট বেছে নিন
        </p>
        <div className="flex flex-wrap gap-2">
          {NOTICE_TEMPLATES.map((tpl, idx) => (
            <motion.button
              key={idx}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => applyTemplate(idx)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{
                backgroundColor:
                  activeTemplate === idx
                    ? "var(--color-text)"
                    : "var(--color-active-bg)",
                color:
                  activeTemplate === idx
                    ? "var(--color-bg)"
                    : "var(--color-text)",
                border:
                  activeTemplate === idx
                    ? "1px solid var(--color-text)"
                    : "1px solid var(--color-active-border)",
              }}
            >
              <span>{tpl.icon}</span>
              <span>{tpl.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Active template hint */}
        <AnimatePresence>
          {activeTemplate !== null && (
            <motion.p
              key="tpl-hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs mt-2"
              style={{ color: "var(--color-gray)" }}
            >
              ✦ টেমপ্লেট ফর্মে পেস্ট হয়েছে — এডিট করে পাঠান
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Form Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full rounded p-6 sm:p-8 md:p-10 bg-[var(--color-active-bg)] border border-[var(--color-active-border)] "
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Notice textarea */}
          <div className="mb-7">
            <label className="flex justify-between text-[var(--color-gray)]  text-sm sm:text-base font-semibold mb-3 tracking-widest uppercase">
              নোটিশের বিষয়বস্তু{" "}
              <span className="bg-[var(--color-bg)] border border-[var(--color-active-border)] px-3 py-1 rounded-2xl">
                {previewSlug()}
              </span>
            </label>
            <div className="relative">
              <textarea
                {...register("notice", {
                  required: "নোটিশের বিষয়বস্তু আবশ্যক।",
                  minLength: {
                    value: 5,
                    message: "কমপক্ষে ১০টি অক্ষর লিখুন।",
                  },
                  maxLength: {
                    value: 1000,
                    message: "সর্বোচ্চ ১০০০ অক্ষর।",
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
                    required: "সময়কাল আবশ্যক।",
                    min: { value: 1, message: "কমপক্ষে ১ দিন।" },
                    max: { value: 365, message: "সর্বোচ্চ ৩৬৫ দিন।" },
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
      </motion.div>
    </div>
  );
};

export default AddNotice;
