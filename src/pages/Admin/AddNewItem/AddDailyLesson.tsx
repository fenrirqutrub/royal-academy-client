// AddDailyLesson.tsx
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Loader2, BookOpen, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import SelectInput from "../../../components/common/SelectInput";
import axiosPublic from "../../../hooks/axiosPublic";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import { useAuth } from "../../../context/AuthContext";
import {
  CLASS_OPTIONS,
  getSubjects,
  toLocalIso,
} from "../../../utility/Constants";
import DatePicker from "../../../components/common/Datepicker";
import {
  BN_DAYS_FULL,
  BN_MONTHS,
  toBn,
  toEn,
} from "../../../utility/Formatters";
import type {
  DailyLessonFormData,
  ReferenceType,
  SelectOption,
  TeacherItem,
} from "../../../types/types";

// ─── Bangla numeral helpers ────────────────────────────────────────────────────

const normaliseInput = (raw: string): string =>
  toBn(raw.replace(/[^0-9০-৯.,\-\s]/g, ""));

const isValidToken = (token: string): boolean => {
  const n = toEn(token.trim());
  return /^\d+(\.\d+)?$/.test(n) && parseFloat(n) > 0;
};

// ✅ FIX: Multiple-hyphen validation (e.g. ১-২-৩ now correctly rejected)
const validateReference = (raw: string): string | true => {
  if (!raw?.trim()) return true;

  const segments = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    const parts = seg.split("-").map((p) => p.trim());

    if (parts.length === 1) {
      if (!isValidToken(parts[0])) {
        return "সঠিক নম্বর লিখুন (যেমন: ১, ৫, ২.৫)";
      }
      continue;
    }

    // ✅ FIX: Reject triple-hyphen like ১-২-৩
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return "রেঞ্জ সঠিক নয় (যেমন: ১০-১৫)";
    }

    const [a, b] = parts;

    if (!isValidToken(a) || !isValidToken(b)) {
      return "রেঞ্জ সঠিক নয় (যেমন: ১০-১৫)";
    }

    if (parseFloat(toEn(b)) <= parseFloat(toEn(a))) {
      return "শেষ নম্বর শুরুর চেয়ে বড় হতে হবে";
    }
  }

  return true;
};

// ─── Bangla date formatter ────────────────────────────────────────────────────
const formatBnDate = (date: Date): string =>
  `${BN_DAYS_FULL[date.getDay()]}, ${toBn(
    date.getDate().toString(),
  )} ${BN_MONTHS[date.getMonth()]} ${toBn(date.getFullYear().toString())}`;

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.38, ease: "easeOut" },
  }),
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, x: 8, scale: 0.97, transition: { duration: 0.18 } },
};

// ─── Style helpers ─────────────────────────────────────────────────────────────
const inputCls = (isError: boolean, isValid = false) =>
  [
    "w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:border-transparent",
    "bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-gray)]",
    isError
      ? "border-rose-400 focus:ring-rose-400"
      : isValid
        ? "border-emerald-400 focus:ring-emerald-400"
        : "border-[var(--color-active-border)] focus:ring-violet-500",
  ].join(" ");

const labelCls =
  "block text-xs font-semibold tracking-wide uppercase text-[var(--color-gray)] mb-1.5";

const RequiredStar = () => (
  <span className="text-rose-500 normal-case font-normal">*</span>
);

const ErrorMsg = ({ msg }: { msg?: string }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="text-rose-500 text-xs mt-1 bangla"
      >
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

// ─── Chapter / Page Toggle ─────────────────────────────────────────────────────
interface ReferenceToggleProps {
  value: ReferenceType;
  onChange: (v: ReferenceType) => void;
}

const ReferenceToggle = ({ value, onChange }: ReferenceToggleProps) => {
  const tabs: { id: ReferenceType; label: string; icon: React.ReactNode }[] = [
    {
      id: "chapter",
      label: "অধ্যায়",
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      id: "page",
      label: "পৃষ্ঠা",
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--color-active-bg)] border border-[var(--color-active-border)]">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            whileTap={{ scale: 0.94 }}
            className={[
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
              "tracking-wide bangla transition-colors duration-150 select-none",
              active
                ? "text-[var(--color-bg)]"
                : "text-[var(--color-gray)] hover:text-[var(--color-text)]",
            ].join(" ")}
          >
            {active && (
              <motion.span
                layoutId="refToggleBg"
                className="absolute inset-0 rounded-lg bg-[var(--color-text)] shadow-md"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

// ─── Hint chips ────────────────────────────────────────────────────────────────
interface HintChipsProps {
  refType: ReferenceType;
  onPick: (hint: string) => void;
}

const HintChips = ({ refType, onPick }: HintChipsProps) => {
  const examples =
    refType === "chapter"
      ? ["১", "২.৫", "১, ৩", "১-৩", "৪, ৬-৮"]
      : ["১০", "১০-১৫", "২০, ২২", "৫-৮, ১২"];

  return (
    <motion.div
      key={refType}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap gap-1.5 mt-2"
    >
      {examples.map((ex) => (
        <motion.button
          key={ex}
          type="button"
          whileHover={{ scale: 1.06, y: -1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onPick(ex)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bangla border
            border-[var(--color-active-border)] bg-[var(--color-active-bg)]
            text-[var(--color-gray)] hover:border-violet-500 hover:text-violet-500
            transition-colors duration-150 select-none"
        >
          {ex}
        </motion.button>
      ))}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
const AddDailyLesson = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const [submitted, setSubmitted] = useState(false);
  const [refType, setRefType] = useState<ReferenceType>("chapter");

  // ✅ FIX: Date refs typed as nullable
  const rawDateRef = useRef<Date | null>(new Date());
  const [pickerDate, setPickerDate] = useState<Date | null>(new Date());

  // ✅ FIX: Timer cleanup ref
  const submittedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const qc = useQueryClient();

  // ✅ FIX: Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (submittedTimerRef.current) clearTimeout(submittedTimerRef.current);
    };
  }, []);

  // ── Teacher list ─────────────────────────────────────────────────────────────
  const {
    data: teacherList = [],
    isLoading: teachersLoading,
    isError: teachersError,
  } = useQuery<TeacherItem[]>({
    // ✅ FIX: Include user.id in queryKey so cache refreshes on user change
    queryKey: ["teachers-list", user?.id],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      const payload: TeacherItem[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? []);
      const staff = payload.filter((t) =>
        ["teacher", "principal", "admin"].includes(t.role),
      );

      if (
        user?.id &&
        user?.name &&
        user?.slug &&
        !staff.some((t) => t._id === user.id)
      ) {
        staff.unshift({
          _id: user.id,
          name: user.name,
          slug: user.slug,
          role: user.role,
        });
      }
      return staff;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  // ✅ FIX: Memoize teacher options
  const teacherOptions: SelectOption[] = useMemo(
    () =>
      teacherList.map((t) => ({
        value: t._id,
        label: t.name,
        icon: <PiChalkboardTeacherFill />,
      })),
    [teacherList],
  );

  // ── Form ──────────────────────────────────────────────────────────────────────
  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    clearErrors,
    resetField,
    formState: { errors, isValid },
  } = useForm<DailyLessonFormData>({
    mode: "onTouched",
    defaultValues: {
      subject: "",
      teacher: "",
      class: "",
      chapterNumber: "",
      topics: "",
      date: "",
    },
  });

  const selectedClass = watch("class");
  const teacherValue = watch("teacher");

  const applyDate = useCallback(
    (date: Date) => {
      rawDateRef.current = date;
      setPickerDate(date);
      setValue("date", formatBnDate(date), {
        shouldValidate: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  // Run only on mount
  useEffect(() => {
    applyDate(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-set teacher for non-admin or when list is ready
  useEffect(() => {
    if (!user?.id) return;
    if (teacherValue) return;
    if (isAdmin && teacherList.length === 0) return;
    setValue("teacher", user.id, {
      shouldValidate: true,
      shouldTouch: true,
    });
  }, [user?.id, isAdmin, teacherList.length, teacherValue, setValue]);

  // Clear chapterNumber value AND errors on refType switch
  const handleRefTypeChange = useCallback(
    (v: ReferenceType) => {
      setRefType(v);
      setValue("chapterNumber", "", {
        shouldTouch: false,
        shouldValidate: false,
      });
      clearErrors("chapterNumber");
    },
    [setValue, clearErrors],
  );

  // ── Mutation ──────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (fd: FormData) => axiosPublic.post("/api/daily-lesson", fd),
    onSuccess: () => {
      toast.success("প্রতিদিনের পড়া সফলভাবে যোগ হয়েছে!");
      qc.invalidateQueries({ queryKey: ["daily-lessons"] });

      // ✅ FIX: Full reset including refType
      const now = new Date();
      reset();
      setRefType("chapter");
      applyDate(now);

      // ✅ FIX: Auto-set teacher after reset for non-admin
      if (!isAdmin && user?.id) {
        setValue("teacher", user.id, {
          shouldValidate: true,
          shouldTouch: true,
        });
      }

      setSubmitted(true);
      // ✅ FIX: Cleanup previous timer before setting new one
      if (submittedTimerRef.current) clearTimeout(submittedTimerRef.current);
      submittedTimerRef.current = setTimeout(() => setSubmitted(false), 2500);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to create daily lesson",
      ),
  });

  // ── onSubmit ──────────────────────────────────────────────────────────────────
  const onSubmit: SubmitHandler<DailyLessonFormData> = (data) => {
    // ✅ FIX: Null-check rawDateRef
    if (!rawDateRef.current) {
      toast.error("তারিখ নির্বাচন করুন।");
      return;
    }

    const teacherId = isAdmin ? data.teacher : user?.id;

    if (!teacherId || !/^[a-f\d]{24}$/i.test(teacherId)) {
      toast.error("শিক্ষকের তথ্য পাওয়া যায়নি। পৃষ্ঠা রিফ্রেশ করুন।");
      return;
    }

    const fd = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date: _date, teacher: _teacher, ...rest } = data;
    const normalised = { ...rest };

    if (data.chapterNumber?.trim()) {
      normalised.chapterNumber = toEn(data.chapterNumber);
    }
    (Object.keys(normalised) as (keyof typeof normalised)[]).forEach((k) => {
      if (normalised[k] !== undefined && normalised[k] !== "")
        fd.append(k, String(normalised[k]));
    });

    fd.append("teacher", teacherId);

    // ✅ FIX: Use toLocalIso to prevent timezone shift bugs
    fd.append("date", toLocalIso(rawDateRef.current));

    fd.append("referenceType", refType);

    // ✅ FIX: Derive slug from selected teacher (admin) or logged-in user
    if (isAdmin) {
      const selectedTeacher = teacherList.find((t) => t._id === teacherId);
      if (selectedTeacher?.slug) fd.append("teacherSlug", selectedTeacher.slug);
    } else {
      if (user?.slug) fd.append("teacherSlug", user.slug);
    }

    mutation.mutate(fd);
  };

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (isAdmin && teachersLoading) return <Skeleton variant="add-lesson" />;
  if (isAdmin && teachersError)
    return (
      <ErrorState message="শিক্ষকের তালিকা লোড হয়নি। পৃষ্ঠাটি রিফ্রেশ করুন।" />
    );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-start justify-center py-10">
      <div className="w-full">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
            <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight bangla">
              আজকের পড়া যোগ করুন
            </h1>
          </div>
          <p className="text-sm text-[var(--color-gray)] ml-4 pl-3 bangla">
            নিচের ফর্মটি পূরণ করুন। কিছু ঘর{" "}
            <span className="text-rose-500">*</span> চিহ্নিত ঘর আবশ্যিক।
          </p>
        </motion.div>

        {/* ── Form Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[var(--color-bg)] rounded-2xl shadow-sm border border-[var(--color-active-border)] p-6 sm:p-8"
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Row 0 — তারিখ */}
            <motion.div
              custom={-1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <Controller
                name="date"
                control={control}
                rules={{ required: "তারিখ আবশ্যিক" }}
                render={({ field, fieldState }) => (
                  <DatePicker
                    label="তারিখ"
                    required
                    value={field.value}
                    selectedDate={pickerDate}
                    onChange={field.onChange}
                    onDateChange={(date) => {
                      // ✅ FIX: Handle null from DatePicker clear
                      rawDateRef.current = date;
                      setPickerDate(date);
                    }}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </motion.div>

            {/* Row 1 — শ্রেণি + বিষয় */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
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
                        // ✅ FIX: Use resetField for proper validation state reset
                        resetField("subject", { defaultValue: "" });
                      }}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      isTouched={fieldState.isTouched}
                    />
                  )}
                />
              </motion.div>

              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Controller
                  name="subject"
                  control={control}
                  rules={{ required: "বিষয় আবশ্যিক" }}
                  render={({ field, fieldState }) => (
                    <SelectInput
                      label="বিষয়"
                      required
                      placeholder={
                        selectedClass ? "বিষয় বেছে নিন" : "আগে শ্রেণি বেছে নিন"
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
              </motion.div>
            </div>

            {/* Row 2 — শিক্ষক + অধ্যায়/পৃষ্ঠা */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Teacher */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
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
                      শিক্ষকের নাম <RequiredStar />
                    </label>
                    <div
                      className={`${inputCls(false, true)} flex items-center gap-2 opacity-70 cursor-not-allowed`}
                    >
                      <PiChalkboardTeacherFill className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-[var(--color-text)]">
                        {user?.name ?? "..."}
                      </span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-active-bg)] text-violet-500 font-medium uppercase tracking-wide">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* ── Chapter / Page reference ── */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                  <label className={`${labelCls} mb-0`}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={refType}
                        variants={slideIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="inline-block"
                      >
                        {refType === "chapter"
                          ? "অধ্যায় নং (ঐচ্ছিক)"
                          : "পৃষ্ঠা নং (ঐচ্ছিক)"}
                      </motion.span>
                    </AnimatePresence>{" "}
                  </label>

                  <ReferenceToggle
                    value={refType}
                    onChange={handleRefTypeChange}
                  />
                </div>

                <Controller
                  name="chapterNumber"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value?.trim()) return true;
                      return validateReference(value);
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <div>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={refType}
                              initial={{
                                opacity: 0,
                                rotate: -15,
                                scale: 0.7,
                              }}
                              animate={{ opacity: 1, rotate: 0, scale: 1 }}
                              exit={{ opacity: 0, rotate: 15, scale: 0.7 }}
                              transition={{ duration: 0.22 }}
                              className="text-violet-500 block"
                            >
                              {refType === "chapter" ? (
                                <BookOpen className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </div>

                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={
                            refType === "chapter"
                              ? "যেমন: ১  /  ১, ৩  /  ১-৩"
                              : "যেমন: ১০  /  ১০-১৫  /  ২০, ২২"
                          }
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(normaliseInput(e.target.value))
                          }
                          onBlur={field.onBlur}
                          className={`${inputCls(
                            !!fieldState.error,
                            fieldState.isTouched && !fieldState.error,
                          )} pl-10 bangla`}
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        {!field.value && (
                          <HintChips
                            refType={refType}
                            onPick={(h) => {
                              field.onChange(h);
                              field.onBlur?.();
                            }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                />
                <ErrorMsg msg={errors.chapterNumber?.message} />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-[11px] text-[var(--color-gray)] mt-1.5 bangla leading-relaxed"
                >
                  <span className="font-medium text-violet-400">কমা</span> দিয়ে
                  একাধিক,{" "}
                  <span className="font-medium text-fuchsia-400">হাইফেন</span>{" "}
                  দিয়ে রেঞ্জ লিখুন
                </motion.p>
              </motion.div>
            </div>

            {/* Row 3 — বিষয়বস্তু */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <label className={labelCls}>
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
                  <textarea
                    rows={5}
                    placeholder="পড়ার বিষয়বস্তু লিখুন..."
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={`${inputCls(
                      !!fieldState.error,
                      fieldState.isTouched && !fieldState.error,
                    )} resize-none leading-relaxed bangla`}
                  />
                )}
              />
              <ErrorMsg msg={errors.topics?.message} />
            </motion.div>

            <div className="border-t border-[var(--color-active-border)] pt-2" />

            {/* Buttons */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                type="submit"
                disabled={!isValid || mutation.isPending}
                className={[
                  "flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2",
                  "transition-all duration-200 bangla",
                  isValid && !mutation.isPending
                    ? "bg-[var(--color-text)] text-[var(--color-bg)] shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-[var(--color-active-bg)] text-[var(--color-gray)] cursor-not-allowed",
                ].join(" ")}
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
                      <Loader2 className="w-4 h-4 animate-spin" /> সংরক্ষণ
                      হচ্ছে…
                    </motion.span>
                  ) : submitted ? (
                    <motion.span
                      key="done"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      ✓ সফলভাবে যোগ হয়েছে
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      পড়া যোগ করুন
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button
                type="button"
                onClick={() => {
                  reset();
                  // ✅ FIX: Also reset refType and re-apply teacher
                  setRefType("chapter");
                  applyDate(new Date());
                  if (!isAdmin && user?.id) {
                    setValue("teacher", user.id, {
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                  }
                }}
                disabled={mutation.isPending}
                className="sm:w-32 py-3 rounded-xl text-sm font-medium bg-[var(--color-active-bg)] hover:bg-[var(--color-active-border)] text-[var(--color-text)] transition-all disabled:opacity-50 bangla"
              >
                রিসেট
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddDailyLesson;
