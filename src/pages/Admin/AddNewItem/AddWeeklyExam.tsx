// AddWeeklyExam.tsx
import {
  useForm,
  type SubmitHandler,
  Controller,
  type ControllerRenderProps,
  type ControllerFieldState,
} from "react-hook-form";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Loader2,
  ImagePlus,
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
import axiosPublic from "../../../hooks/axiosPublic";
import SelectInput from "../../../components/common/SelectInput";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import { useAuth } from "../../../context/AuthContext";
import {
  CLASS_OPTIONS,
  getSubjects,
  NUMBER_TYPE_OPTIONS,
} from "../../../utility/Constants";
import { uploadEditedBlobsToCloudinary } from "../../../hooks/useCloudinaryUpload";
import ImageUploadWithEditor, {
  type EditedImage,
} from "../../../components/common/ImageUploadWithEditor";
import type {
  SelectOption,
  TeacherItem,
  WeeklyExamData,
  WeeklyExamFormData,
} from "../../../types/types";
import { toBn, toEn } from "../../../utility/Formatters";

// ─── Validation helpers ────────────────────────────────────
const validatePositiveNumber = (
  raw: string,
  fieldLabel: string,
): string | true => {
  if (!raw) return `${fieldLabel} আবশ্যিক`;
  const ascii = toEn(raw).trim();
  if (!/^\d+$/.test(ascii)) return "শুধু পূর্ণসংখ্যা দিন (যেমন: ১, ২, ৩)";
  if (parseInt(ascii) <= 0) return "নম্বর ০-এর চেয়ে বড় হতে হবে";
  return true;
};

const validateNumberValue = (
  raw: string,
  fieldLabel: string,
): string | true => {
  if (!raw?.trim()) return `${fieldLabel} আবশ্যিক`;

  const ascii = toEn(raw).replace(/[–—]/g, "-").replace(/।/g, ".").trim();

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
    label: toBn(n),
  }),
);

// ─── Helpers ──────────────────────────────────────────────
const sortExamNumbers = (nums: string[]): string[] =>
  [...nums].sort((a, b) => Number(a) - Number(b));

const getLastSaturdayMidnight = (): Date => {
  const dhaka = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  );
  const day = dhaka.getDay();
  const daysBack = day === 6 ? 0 : day + 1;
  const sat = new Date(dhaka);
  sat.setDate(sat.getDate() - daysBack);
  sat.setHours(0, 0, 0, 0);
  return sat;
};

// ─── Animation Variants ───────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

// ─── Small UI helpers ──────────────────────────────────────
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

// ─── TopicsField ───────────────────────────────────────────
interface TextAreaFieldProps {
  field: ControllerRenderProps<WeeklyExamFormData, "topics">;
  fieldState: ControllerFieldState;
}

const TopicsField = ({ field, fieldState }: TextAreaFieldProps) => {
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
};

// ─── QuestionField ─────────────────────────────────────────
interface QuestionFieldProps {
  field: ControllerRenderProps<WeeklyExamFormData, "question">;
  fieldState: ControllerFieldState;
}

const QuestionField = ({ field, fieldState }: QuestionFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <textarea
        rows={4}
        placeholder="পরীক্ষার প্রশ্ন লিখুন (যদি থাকে)..."
        value={toBn(field.value)}
        onChange={field.onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          field.onBlur();
        }}
        className={`${inputCls(
          !!fieldState.error,
          fieldState.isTouched && !fieldState.error && !!field.value,
          isFocused,
        )} resize-none leading-relaxed bangla pr-10`}
      />
      {field.value && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
      )}
    </div>
  );
};

// ─── BanglaNumberInput ────────────────────────────────────
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
          onChange(toBn(input));
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

// ─── AnimatedCard ─────────────────────────────────────────
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
// Main Component
// ═════════════════════════════════════════════════════════
const AddWeeklyExam = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const hasUserEditedExamNumber = useRef(false);
  const qc = useQueryClient();

  // ── Fetch all exams ────────────────────────────────────
  const { data: allExams = [] } = useQuery<WeeklyExamData[]>({
    queryKey: ["weekly-exams"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/weekly-exams");
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Exam number suggestions ────────────────────────────
  const examNumbers = useMemo(() => {
    const unique = new Set(allExams.map((e) => String(e.ExamNumber)));
    return sortExamNumbers(Array.from(unique));
  }, [allExams]);

  const nextExpectedExamNumber = useMemo(() => {
    if (examNumbers.length === 0) return "1";
    return String(Number(examNumbers[examNumbers.length - 1]) + 1);
  }, [examNumbers]);

  const latestExamCreatedAt = useMemo(() => {
    if (!allExams.length || !examNumbers.length) return null;
    const latestNumber = examNumbers[examNumbers.length - 1];
    const examsWithLatestNumber = allExams.filter(
      (e) => String(e.ExamNumber) === latestNumber,
    );
    if (examsWithLatestNumber.length === 0) return null;
    const dates = examsWithLatestNumber
      .map((e) => new Date(e.createdAt).getTime())
      .filter((t) => !Number.isNaN(t));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  }, [allExams, examNumbers]);

  const shouldShowNextExam = useMemo(() => {
    if (!latestExamCreatedAt) return false;
    return latestExamCreatedAt.getTime() < getLastSaturdayMidnight().getTime();
  }, [latestExamCreatedAt]);

  const suggestedExamNumber = useMemo(() => {
    if (examNumbers.length === 0) return "1";
    return shouldShowNextExam
      ? nextExpectedExamNumber
      : examNumbers[examNumbers.length - 1];
  }, [examNumbers, shouldShowNextExam, nextExpectedExamNumber]);

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
        staff.unshift({
          name: user.name,
          slug: user.slug,
          role: user.role,
          _id: "",
        });
      }
      return staff;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  // ✅ slug as value — name as label
  const teacherOptions: SelectOption[] = teacherList.map((t) => ({
    value: t.slug,
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

  // ── Auto set exam number ───────────────────────────────
  useEffect(() => {
    if (hasUserEditedExamNumber.current) return;
    setValue("ExamNumber", toBn(suggestedExamNumber), {
      shouldTouch: false,
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [suggestedExamNumber, setValue]);

  // ── Auto set teacher ───────────────────────────────────
  useEffect(() => {
    if (!user?.slug) return;
    if (isAdmin && teacherList.length === 0) return;
    if (teacherValue) return;
    // ✅ set slug as default value (matches teacherOptions value)
    setValue("teacher", user.slug, {
      shouldValidate: true,
      shouldTouch: true,
    });
  }, [user?.slug, isAdmin, teacherList.length, teacherValue, setValue]);

  // ── Mutation ───────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (data: {
      formData: WeeklyExamFormData;
      images: EditedImage[];
    }) => {
      let uploadedImages: { imageUrl: string; publicId: string }[] = [];

      if (data.images.length > 0) {
        setUploadProgress(0);
        const blobs = data.images.map((img) => img.blob);
        const cloudinaryResults = await uploadEditedBlobsToCloudinary(blobs, {
          folder: "weekly-exams",
          onProgress: setUploadProgress,
        });
        uploadedImages = cloudinaryResults.map((r) => ({
          imageUrl: r.secure_url,
          publicId: r.public_id,
        }));
      }

      // ✅ resolve teacher name + slug from selected slug
      const selectedTeacher = teacherList.find(
        (t) => t.slug === data.formData.teacher,
      );

      const payload = {
        subject: data.formData.subject,
        teacher: selectedTeacher?.name ?? user?.name,
        teacherSlug: selectedTeacher?.slug ?? user?.slug,
        class: data.formData.class,
        mark: data.formData.mark,
        ExamNumber: toEn(data.formData.ExamNumber),
        numberType: data.formData.numberType,
        [data.formData.numberType]: toEn(data.formData.numberValue),
        topics: data.formData.topics,
        question: data.formData.question,
        images: uploadedImages,
      };

      const res = await axiosPublic.post("/api/weekly-exams", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("পরীক্ষা সফলভাবে যোগ হয়েছে!");
      qc.invalidateQueries({ queryKey: ["weekly-exams"] });
      hasUserEditedExamNumber.current = false;
      reset({
        subject: "",
        teacher: user?.slug ?? "",
        class: "",
        mark: 0,
        ExamNumber: toBn(suggestedExamNumber),
        numberType: "chapterNumber",
        numberValue: "",
        topics: "",
        question: "",
      });
      editedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setEditedImages([]);
      setUploadProgress(0);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create exam",
      );
      setUploadProgress(0);
    },
  });

  const onSubmit: SubmitHandler<WeeklyExamFormData> = (data) => {
    // non-admin: override teacher with own slug
    if (!isAdmin && user?.slug) {
      data.teacher = user.slug;
    }
    mutation.mutate({ formData: data, images: editedImages });
  };

  const handleReset = () => {
    hasUserEditedExamNumber.current = false;
    reset({
      subject: "",
      teacher: user?.slug ?? "",
      class: "",
      mark: 0,
      ExamNumber: toBn(suggestedExamNumber),
      numberType: "chapterNumber",
      numberValue: "",
      topics: "",
      question: "",
    });
    editedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setEditedImages([]);
    setUploadProgress(0);
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
        className="w-full"
      >
        {/* ── Header ── */}
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

        {/* ── Card ── */}
        <motion.div
          variants={pulseGlow}
          initial="initial"
          animate="animate"
          className="relative bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-active-border)] overflow-hidden shadow-xl"
        >
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
                        onChange={(v) => {
                          hasUserEditedExamNumber.current = true;
                          field.onChange(v);
                        }}
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
                  <p className="mt-1.5 text-xs text-[var(--color-gray)] bangla">
                    ডিফল্ট: পরীক্ষা {toBn(suggestedExamNumber)} — চাইলে পরিবর্তন
                    করতে পারবেন
                  </p>
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
                    minLength: {
                      value: 5,
                      message: "কমপক্ষে ৫ অক্ষর লিখুন",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <TopicsField field={field} fieldState={fieldState} />
                  )}
                />
                <ErrorMsg msg={errors.topics?.message} />
              </AnimatedCard>

              {/* ── Row 6: Question ── */}
              <AnimatedCard index={8}>
                <label className={labelCls}>
                  <HelpCircle className="w-4 h-4" />
                  প্রশ্ন (ঐচ্ছিক)
                </label>
                <Controller
                  name="question"
                  control={control}
                  render={({ field, fieldState }) => (
                    <QuestionField field={field} fieldState={fieldState} />
                  )}
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
                <ImageUploadWithEditor
                  images={editedImages}
                  onChange={setEditedImages}
                  maxImages={10}
                  allowSkipEdit={true}
                />
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
                    {mutation.isPending ? (
                      <div className="flex flex-col gap-2 w-full px-2">
                        <span className="flex items-center justify-between text-xs bangla">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {editedImages.length > 0
                              ? uploadProgress < 100
                                ? "আপলোড হচ্ছে…"
                                : "ডেটা সংরক্ষণ হচ্ছে…"
                              : "সংরক্ষণ হচ্ছে…"}
                          </span>
                          <span className="font-bold">
                            {editedImages.length > 0
                              ? `${toBn(uploadProgress)}%`
                              : ""}
                          </span>
                        </span>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-white/70"
                            initial={{ width: "0%" }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        পরীক্ষা যোগ করুন
                      </>
                    )}
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
