/* eslint-disable react-hooks/rules-of-hooks */
// AddWeeklyExam.tsx
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Loader2,
  ImagePlus,
  X,
  FileText,
  BookOpen,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import type { SelectOption } from "../../../components/common/SelectInput";
import axiosPublic from "../../../hooks/axiosPublic";
import SelectInput from "../../../components/common/SelectInput";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import { useAuth } from "../../../context/AuthContext";
import { CLASS_OPTIONS, getSubjects } from "../../../utility/Constants";
import { uploadMultipleToCloudinary } from "../../../hooks/useCloudinaryUpload";

// ─── Types ────────────────────────────────────────────────
interface WeeklyExamFormData {
  subject: string;
  teacher: string;
  class: string;
  mark: number;
  ExamNumber: string;
  numberType: "pageNumber" | "chapterNumber";
  numberValue: string;
  topics: string;
  question: string;
  slug?: string;
}

interface TeacherItem {
  name: string;
  slug: string;
  role: string;
}

// ─── Bangla numeral helpers ────────────────────────────────
const EN_TO_BN: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

const toBanglaDigits = (str: string): string =>
  str.replace(/[0-9]/g, (d) => EN_TO_BN[d] ?? d);

const toAsciiDigits = (str: string): string =>
  str
    .replace(/০/g, "0")
    .replace(/১/g, "1")
    .replace(/২/g, "2")
    .replace(/৩/g, "3")
    .replace(/৪/g, "4")
    .replace(/৫/g, "5")
    .replace(/৬/g, "6")
    .replace(/৭/g, "7")
    .replace(/৮/g, "8")
    .replace(/৯/g, "9")
    .replace(/।/g, ".")
    .replace(/–/g, "-")
    .replace(/—/g, "-");

const validatePositiveNumber = (
  raw: string,
  fieldLabel: string,
): string | true => {
  if (!raw) return `${fieldLabel} আবশ্যিক`;

  const ascii = toAsciiDigits(raw).trim();
  if (!/^\d+$/.test(ascii)) return "শুধু পূর্ণসংখ্যা দিন (যেমন: ১, ২, ৩)";
  if (parseInt(ascii) <= 0) return "নম্বর ০-এর চেয়ে বড় হতে হবে";

  return true;
};

const validateNumberValue = (
  raw: string,
  fieldLabel: string,
): string | true => {
  if (!raw?.trim()) return `${fieldLabel} আবশ্যিক`;

  const ascii = toAsciiDigits(raw).trim();

  if (!/^[\d.\-–, ]+$/.test(ascii)) {
    return "শুধু সংখ্যা, দশমিক (.), হাইফেন (-) এবং কমা (,) ব্যবহার করুন";
  }

  const parts = ascii
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (!/^\d+\.?\d*$|^\d+\.?\d*-\d+\.?\d*$/.test(part)) {
      return "সঠিক ফরম্যাট দিন। উদাহরণ: ২.৬, ১৫-২০, ২৫-৩০";
    }

    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (isNaN(start) || isNaN(end) || start >= end) {
        return `রেঞ্জ ভুল: ${part} → ছোট সংখ্যা আগে দিন`;
      }
    }
  }

  return true;
};

// ─── Static Data ──────────────────────────────────────────
const MARK_OPTIONS: SelectOption[] = [5, 10, 15, 20, 25, 30, 35, 40].map(
  (n) => ({
    value: String(n),
    label: toBanglaDigits(String(n)),
  }),
);

const NUMBER_TYPE_OPTIONS: SelectOption[] = [
  {
    value: "chapterNumber",
    label: "অধ্যায় নম্বর",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    value: "pageNumber",
    label: "পৃষ্ঠা নম্বর",
    icon: <FileText className="w-4 h-4" />,
  },
];

// ─── Animation Variants ───────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const pulseGlow: Variants = {
  initial: { boxShadow: "0 0 0 0 rgba(139, 92, 246, 0)" },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(139, 92, 246, 0)",
      "0 0 0 8px rgba(139, 92, 246, 0.1)",
      "0 0 0 0 rgba(139, 92, 246, 0)",
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

const shimmer: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: { duration: 1.5, repeat: Infinity, repeatDelay: 0.5 },
  },
};

// ─── Styles ───────────────────────────────────────────────
const inputCls = (
  isError: boolean,
  isValidTouched = false,
  isFocused = false,
) =>
  `w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all duration-300
   focus:outline-none bg-[var(--color-bg)] text-[var(--color-text)] 
   placeholder-[var(--color-gray)]
   ${
     isError
       ? "border-rose-400 focus:border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.1)]"
       : isValidTouched
         ? "border-emerald-400 focus:border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
         : isFocused
           ? "border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
           : "border-[var(--color-active-border)] hover:border-violet-300"
   }`;

const labelCls =
  "flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[var(--color-gray)] mb-2";

const RequiredStar = () => (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 500 }}
    className="text-rose-500 normal-case tracking-normal font-normal"
  >
    *
  </motion.span>
);

const FieldIcon = ({
  isError,
  isValid,
}: {
  isError: boolean;
  isValid: boolean;
}) => (
  <AnimatePresence mode="wait">
    {isError && (
      <motion.span
        key="error"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <AlertCircle className="w-5 h-5 text-rose-500" />
      </motion.span>
    )}
    {isValid && (
      <motion.span
        key="valid"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      </motion.span>
    )}
  </AnimatePresence>
);

const ErrorMsg = ({ msg }: { msg?: string }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: "auto", y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-rose-500 text-xs mt-1.5 flex items-center gap-1.5 bangla"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

// ─── Reusable Bangla number text input ────────────────────
const BanglaNumberInput = ({
  value,
  onChange,
  onBlur,
  isError,
  isValidTouched,
  placeholder = "যেমন: ১, ২.৬, ১৫-২০",
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  isError: boolean;
  isValidTouched: boolean;
  placeholder?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          let input = e.target.value;
          input = input.replace(/[^\d০-৯।.\-–—,]/g, "");
          input = input.replace(/[-–—]{2,}/g, "-");
          input = input.replace(/[.।]{2,}/g, ".");
          onChange(toBanglaDigits(input));
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        className={`${inputCls(isError, isValidTouched, isFocused)} pr-10 bangla`}
      />
      <FieldIcon isError={isError} isValid={isValidTouched} />
    </div>
  );
};

// ─── Animated Card Wrapper ────────────────────────────────
const AnimatedCard = ({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) => (
  <motion.div
    custom={index}
    initial="hidden"
    animate="visible"
    variants={fadeUp}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    className="relative"
  >
    {children}
  </motion.div>
);

// ═════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════
const AddWeeklyExam = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [submitted, setSubmitted] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // ── Fetch teachers ─────────────────────────────────────
  const {
    data: teacherList = [],
    isLoading: teachersLoading,
    isError: teachersError,
  } = useQuery<TeacherItem[]>({
    queryKey: ["teachers-list"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      const payload: TeacherItem[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? []);
      const staff = payload.filter((t) =>
        ["teacher", "principal", "admin"].includes(t.role),
      );
      if (
        user?.name &&
        user?.slug &&
        !staff.some((t) => t.slug === user.slug)
      ) {
        staff.unshift({ name: user.name, slug: user.slug, role: user.role });
      }
      return staff;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const teacherOptions: SelectOption[] = teacherList.map((t) => ({
    value: t.name,
    label: t.name,
    icon: <PiChalkboardTeacherFill />,
  }));

  // ── Form ───────────────────────────────────────────────
  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<WeeklyExamFormData>({
    mode: "onTouched",
    defaultValues: {
      subject: "",
      teacher: "",
      class: "",
      mark: 0,
      ExamNumber: "",
      numberType: "chapterNumber",
      numberValue: "",
      topics: "",
      question: "",
    },
  });

  const selectedClass = watch("class");
  const teacherValue = watch("teacher");
  const numberType = watch("numberType");

  useEffect(() => {
    if (!user?.name) return;
    if (isAdmin && teacherList.length === 0) return;
    if (teacherValue) return;
    setValue("teacher", user.name, { shouldValidate: true, shouldTouch: true });
  }, [user?.name, isAdmin, teacherList.length, teacherValue, setValue]);

  // ── Image handlers ─────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageFiles((p) => [...p, ...files]);
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImageFiles((p) => p.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  };

  // ── Mutation ───────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (data: {
      formData: WeeklyExamFormData;
      images: File[];
    }) => {
      // 1️⃣ Images direct Cloudinary te pathao (Vercel skip!)
      let uploadedImages: { imageUrl: string; publicId: string }[] = [];

      if (data.images.length > 0) {
        const cloudinaryResults = await uploadMultipleToCloudinary(
          data.images,
          { folder: "weekly-exams" },
        );
        uploadedImages = cloudinaryResults.map((r) => ({
          imageUrl: r.secure_url,
          publicId: r.public_id,
        }));
      }

      // 2️⃣ Server e shudhu JSON data + URLs pathao (NO files!)
      const payload = {
        subject: data.formData.subject,
        teacher: data.formData.teacher,
        class: data.formData.class,
        mark: data.formData.mark,
        ExamNumber: toAsciiDigits(data.formData.ExamNumber),
        numberType: data.formData.numberType,
        [data.formData.numberType]: toAsciiDigits(data.formData.numberValue),
        topics: data.formData.topics,
        question: data.formData.question,
        teacherSlug: user?.slug,
        images: uploadedImages,
      };

      const res = await axiosPublic.post("/api/weekly-exams", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("পরীক্ষা সফলভাবে যোগ হয়েছে!");
      qc.invalidateQueries({ queryKey: ["weekly-exams"] });
      reset();
      setImageFiles([]);
      setPreviews([]);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create exam",
      ),
  });

  const onSubmit: SubmitHandler<WeeklyExamFormData> = (data) => {
    if (!isAdmin && user?.name) {
      data.teacher = user.name;
    }
    mutation.mutate({ formData: data, images: imageFiles });
  };

  const handleReset = () => {
    reset();
    setImageFiles([]);
    setPreviews([]);
  };

  // ── Guards ─────────────────────────────────────────────
  if (isAdmin && teachersLoading) return <Skeleton variant="add-lesson" />;
  if (isAdmin && teachersError)
    return (
      <ErrorState message="শিক্ষকের তালিকা লোড হয়নি। পৃষ্ঠাটি রিফ্রেশ করুন।" />
    );

  const numberTypeLabel =
    numberType === "pageNumber" ? "পৃষ্ঠা নম্বর" : "অধ্যায় নম্বর";

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-start justify-center py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full "
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              className="w-1.5 h-10 rounded-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500"
              initial={{ height: 0 }}
              animate={{ height: 40 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight bangla flex items-center gap-2">
                সাপ্তাহিক পরীক্ষা যোগ করুন
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </motion.span>
              </h1>
              <p className="text-sm text-[var(--color-gray)] mt-1 bangla">
                নিচের ফর্মটি পূরণ করুন। সকল{" "}
                <span className="text-rose-500 font-semibold">*</span> চিহ্নিত
                ঘর আবশ্যিক।
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={pulseGlow}
          initial="initial"
          animate="animate"
          className="relative bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-active-border)] 
            overflow-hidden shadow-xl"
        >
          {/* Animated gradient border effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background:
                "linear-gradient(45deg, transparent 30%, rgba(139,92,246,0.1) 50%, transparent 70%)",
              backgroundSize: "200% 200%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          <div className="relative p-6 sm:p-8">
            <motion.form
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {/* ── Row 1: Class + Subject ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AnimatedCard index={0}>
                  <Controller
                    name="class"
                    control={control}
                    rules={{ required: "শ্রেণি আবশ্যিক" }}
                    render={({ field, fieldState }) => (
                      <SelectInput
                        label="শ্রেণি"
                        required
                        placeholder="শ্রেণি বেছে নিন"
                        options={CLASS_OPTIONS}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue("subject", "", { shouldTouch: false });
                        }}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        isTouched={fieldState.isTouched}
                      />
                    )}
                  />
                </AnimatedCard>

                <AnimatedCard index={1}>
                  <Controller
                    name="subject"
                    control={control}
                    rules={{ required: "বিষয় আবশ্যিক" }}
                    render={({ field, fieldState }) => (
                      <SelectInput
                        label="বিষয়"
                        required
                        placeholder={
                          selectedClass
                            ? "বিষয় বেছে নিন"
                            : "আগে শ্রেণি বেছে নিন"
                        }
                        options={getSubjects(selectedClass)}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={!selectedClass}
                        error={fieldState.error?.message}
                        isTouched={fieldState.isTouched}
                      />
                    )}
                  />
                </AnimatedCard>
              </div>

              {/* ── Row 2: Teacher ── */}
              <AnimatedCard index={2}>
                {isAdmin ? (
                  <Controller
                    name="teacher"
                    control={control}
                    rules={{ required: "শিক্ষকের নাম আবশ্যিক" }}
                    render={({ field, fieldState }) => (
                      <SelectInput
                        label="শিক্ষকের নাম"
                        required
                        placeholder="শিক্ষক বেছে নিন"
                        options={teacherOptions}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        isTouched={fieldState.isTouched}
                      />
                    )}
                  />
                ) : (
                  <div>
                    <label className={labelCls}>
                      <PiChalkboardTeacherFill className="w-4 h-4" />
                      শিক্ষকের নাম <RequiredStar />
                    </label>
                    <div
                      className={`${inputCls(false, true)} flex items-center gap-2 opacity-70 cursor-not-allowed`}
                    >
                      <PiChalkboardTeacherFill className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-[var(--color-text)]">
                        {user?.name ?? "..."}
                      </span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 font-semibold uppercase tracking-wide border border-violet-500/20">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                )}
              </AnimatedCard>

              {/* ── Row 3: পরীক্ষা নম্বর + পূর্ণমান ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AnimatedCard index={3}>
                  <label className={labelCls}>
                    <FileText className="w-4 h-4" />
                    পরীক্ষা নম্বর <RequiredStar />
                  </label>
                  <Controller
                    name="ExamNumber"
                    control={control}
                    rules={{
                      validate: (v) =>
                        validatePositiveNumber(v, "পরীক্ষা নম্বর"),
                    }}
                    render={({ field, fieldState }) => (
                      <BanglaNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isError={!!fieldState.error}
                        isValidTouched={
                          fieldState.isTouched && !fieldState.error
                        }
                        placeholder="যেমন: ১, ২, ৩"
                      />
                    )}
                  />
                  <ErrorMsg msg={errors.ExamNumber?.message} />
                </AnimatedCard>

                <AnimatedCard index={4}>
                  <Controller
                    name="mark"
                    control={control}
                    rules={{
                      required: "পূর্ণমান আবশ্যিক",
                      validate: (v) => v > 0 || "পূর্ণমান আবশ্যিক",
                    }}
                    render={({ field, fieldState }) => (
                      <SelectInput
                        label="পূর্ণমান"
                        required
                        placeholder="পূর্ণমান বেছে নিন"
                        options={MARK_OPTIONS}
                        value={field.value ? String(field.value) : ""}
                        onChange={(val) => field.onChange(Number(val))}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        isTouched={fieldState.isTouched}
                      />
                    )}
                  />
                </AnimatedCard>
              </div>

              {/* ── Row 4: Number Type + Number Value ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AnimatedCard index={5}>
                  <Controller
                    name="numberType"
                    control={control}
                    rules={{ required: "টাইপ নির্বাচন করুন" }}
                    render={({ field, fieldState }) => (
                      <SelectInput
                        label="নম্বরের ধরন"
                        required
                        placeholder="ধরন বেছে নিন"
                        options={NUMBER_TYPE_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        isTouched={fieldState.isTouched}
                      />
                    )}
                  />
                </AnimatedCard>

                <AnimatedCard index={6}>
                  <label className={labelCls}>
                    {numberType === "pageNumber" ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                    {numberTypeLabel} <RequiredStar />
                  </label>
                  <Controller
                    name="numberValue"
                    control={control}
                    rules={{
                      validate: (v) => validateNumberValue(v, numberTypeLabel),
                    }}
                    render={({ field, fieldState }) => (
                      <BanglaNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isError={!!fieldState.error}
                        isValidTouched={
                          fieldState.isTouched && !fieldState.error
                        }
                        placeholder={
                          numberType === "pageNumber"
                            ? "যেমন: ১৫-২০, ২৫-৩০"
                            : "যেমন: ২.৬, ৩.১-৩.৫"
                        }
                      />
                    )}
                  />
                  <ErrorMsg msg={errors.numberValue?.message} />
                </AnimatedCard>
              </div>

              {/* ── Row 5: Topics ── */}
              <AnimatedCard index={7}>
                <label className={labelCls}>
                  <BookOpen className="w-4 h-4" />
                  বিষয়বস্তু / নির্দেশনা <RequiredStar />
                </label>
                <Controller
                  name="topics"
                  control={control}
                  rules={{
                    required: "বিষয়বস্তু আবশ্যিক",
                    minLength: { value: 20, message: "কমপক্ষে ২০ অক্ষর লিখুন" },
                  }}
                  render={({ field, fieldState }) => {
                    const [isFocused, setIsFocused] = useState(false);
                    return (
                      <div className="relative">
                        <textarea
                          rows={4}
                          placeholder="পরীক্ষার বিষয়বস্তু লিখুন..."
                          value={field.value}
                          onChange={field.onChange}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => {
                            setIsFocused(false);
                            field.onBlur();
                          }}
                          className={`${inputCls(
                            !!fieldState.error,
                            fieldState.isTouched && !fieldState.error,
                            isFocused,
                          )} resize-none leading-relaxed bangla pr-10`}
                        />
                        <div className="absolute right-3 top-3">
                          <FieldIcon
                            isError={!!fieldState.error}
                            isValid={fieldState.isTouched && !fieldState.error}
                          />
                        </div>
                      </div>
                    );
                  }}
                />
                <ErrorMsg msg={errors.topics?.message} />
              </AnimatedCard>

              {/* ── Row 6: Question (NEW) ── */}
              <AnimatedCard index={8}>
                <label className={labelCls}>
                  <HelpCircle className="w-4 h-4" />
                  প্রশ্ন (ঐচ্ছিক)
                </label>
                <Controller
                  name="question"
                  control={control}
                  render={({ field, fieldState }) => {
                    const [isFocused, setIsFocused] = useState(false);
                    return (
                      <div className="relative">
                        <textarea
                          rows={4}
                          placeholder="পরীক্ষার প্রশ্ন লিখুন (যদি থাকে)..."
                          value={field.value}
                          onChange={field.onChange}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => {
                            setIsFocused(false);
                            field.onBlur();
                          }}
                          className={`${inputCls(
                            !!fieldState.error,
                            fieldState.isTouched &&
                              !fieldState.error &&
                              !!field.value,
                            isFocused,
                          )} resize-none leading-relaxed bangla pr-10`}
                        />
                        {field.value && (
                          <div className="absolute right-3 top-3">
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </motion.span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <p className="text-xs text-[var(--color-gray)] mt-1.5 bangla flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  এই ফিল্ড পূরণ করা বাধ্যতামূলক নয়
                </p>
              </AnimatedCard>

              {/* ── Row 7: Image Upload ── */}
              <AnimatedCard index={9}>
                <label className={labelCls}>
                  <ImagePlus className="w-4 h-4" />
                  ছবি সংযুক্ত করুন (ঐচ্ছিক)
                </label>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-[var(--color-active-border)] 
                    hover:border-violet-400 rounded-xl p-8 flex flex-col items-center gap-3 
                    transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Shimmer effect */}
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
                    <ImagePlus className="w-10 h-10 text-[var(--color-gray)] group-hover:text-violet-500 transition-colors" />
                  </motion.div>
                  <p className="text-sm text-[var(--color-gray)] group-hover:text-violet-500 transition-colors bangla font-medium">
                    ক্লিক করুন বা ছবি টেনে আনুন
                  </p>
                  <p className="text-xs text-[var(--color-gray)] bangla">
                    PNG, JPG, WEBP • একাধিক ছবি বেছে নেওয়া যাবে
                  </p>
                </motion.div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                <AnimatePresence>
                  {previews.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4"
                    >
                      {previews.map((src, i) => (
                        <motion.div
                          key={src}
                          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="relative group aspect-square rounded-xl overflow-hidden 
                            border-2 border-[var(--color-active-border)] hover:border-violet-400 
                            transition-colors"
                        >
                          <img
                            src={src}
                            alt={`preview-${i}`}
                            className="w-full h-full object-cover"
                          />
                          <motion.button
                            type="button"
                            onClick={() => removeImage(i)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 rounded-full 
                              flex items-center justify-center opacity-0 group-hover:opacity-100 
                              transition-all shadow-lg"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {previews.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[var(--color-gray)] mt-2 bangla flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {toBanglaDigits(String(previews.length))}টি ছবি নির্বাচিত
                  </motion.p>
                )}
              </AnimatedCard>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="border-t-2 border-[var(--color-active-border)] pt-2"
              />

              {/* ── Buttons ── */}
              <AnimatedCard index={10}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    type="submit"
                    disabled={!isValid || mutation.isPending}
                    whileHover={
                      isValid && !mutation.isPending
                        ? { scale: 1.02, y: -2 }
                        : {}
                    }
                    whileTap={
                      isValid && !mutation.isPending ? { scale: 0.98 } : {}
                    }
                    className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center 
                      justify-center gap-2 transition-all duration-300 bangla border-2
                      ${
                        isValid && !mutation.isPending
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30"
                          : "bg-[var(--color-active-bg)] text-[var(--color-gray)] border-[var(--color-active-border)] cursor-not-allowed"
                      }`}
                  >
                    <AnimatePresence mode="wait">
                      {mutation.isPending ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          সংরক্ষণ হচ্ছে…
                        </motion.span>
                      ) : submitted ? (
                        <motion.span
                          key="done"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          সফলভাবে যোগ হয়েছে
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          পরীক্ষা যোগ করুন
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleReset}
                    disabled={mutation.isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="sm:w-36 py-3.5 rounded-xl text-sm font-medium border-2 
                      border-[var(--color-active-border)] bg-[var(--color-bg)] 
                      hover:bg-[var(--color-active-bg)] text-[var(--color-text)] 
                      transition-all disabled:opacity-50 bangla"
                  >
                    রিসেট
                  </motion.button>
                </div>
              </AnimatedCard>
            </motion.form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AddWeeklyExam;
