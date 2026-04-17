// DailyLessonUpdateModals.tsx
import { useMemo } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Trash2, X, Loader2 } from "lucide-react";
import axiosPublic from "../../hooks/axiosPublic";
import SelectInput from "../../components/common/SelectInput";
import { CLASS_OPTIONS, getSubjects } from "../../utility/Constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TeacherObj {
  _id: string;
  name: string;
  slug?: string;
  avatar?: { url: string | null } | string | null;
}

export interface DailyLessonData {
  _id: string;
  slug?: string;
  subject: string;
  teacher: TeacherObj | string;
  teacherSlug?: string;
  class: string;
  mark: number;
  referenceType: "chapter" | "page";
  chapterNumber: string;
  topics: string;
  images: { url: string; public_id: string }[];
  date: string;
  createdAt: string;
}

interface EditFormValues {
  subject: string;
  class: string;
  chapterNumber: string;
  referenceType: string;
  topics: string;
  teacherSlug: string;
  teacher: string;
}

interface TeacherOption {
  slug: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const REFERENCE_TYPE_OPTIONS = [
  { value: "chapter", label: "অধ্যায়" },
  { value: "page", label: "পৃষ্ঠা" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const resolveTeacherName = (
  teacher: TeacherObj | string | null | undefined,
): string => {
  if (!teacher) return "—";
  if (typeof teacher === "string") return teacher || "—";
  return teacher.name?.trim() || "—";
};

export const resolveTeacherSlug = (
  teacher: TeacherObj | string | null | undefined,
  teacherSlug?: string,
): string => {
  if (typeof teacher === "object" && teacher !== null && teacher.slug) {
    return teacher.slug;
  }
  return teacherSlug ?? "";
};

export const resolveTeacherId = (
  teacher: TeacherObj | string | null | undefined,
): string => {
  if (typeof teacher === "object" && teacher !== null && teacher._id) {
    return teacher._id;
  }
  if (typeof teacher === "string") return teacher;
  return "";
};

// ─── Style helpers ────────────────────────────────────────────────────────────
const inputCls = (isError: boolean, isValidTouched = false) =>
  `w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all duration-200
   focus:outline-none focus:ring-2 focus:border-transparent
   bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-gray)]
   ${
     isError
       ? "border-rose-400 focus:ring-rose-400"
       : isValidTouched
         ? "border-emerald-400 focus:ring-emerald-400"
         : "border-[var(--color-active-border)] focus:ring-violet-500"
   }`;

const labelCls =
  "block text-xs font-semibold tracking-wide uppercase text-[var(--color-gray)] mb-1.5";

const scrollbarHideClass = `
  [&::-webkit-scrollbar]:hidden 
  [-ms-overflow-style:none] 
  [scrollbar-width:none]
`;

// ─── Animation Variants ───────────────────────────────────────────────────────
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 16,
    transition: { duration: 0.2 },
  },
};

// ─── Small Components ─────────────────────────────────────────────────────────
const RequiredStar = () => (
  <span className="text-rose-500 normal-case tracking-normal font-normal ml-0.5">
    *
  </span>
);

const ErrMsg = ({ msg }: { msg?: string }) => (
  <AnimatePresence mode="wait">
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

// ─── Delete Modal ─────────────────────────────────────────────────────────────
export const DeleteModal = ({
  record,
  onConfirm,
  onCancel,
  isPending,
}: {
  record: DailyLessonData;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) => (
  <motion.div
    variants={overlayVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ duration: 0.2 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4"
    onClick={onCancel}
  >
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-[var(--color-bg)] rounded-2xl shadow-xl border border-[var(--color-active-border)] p-4 sm:p-6 w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-[var(--color-text)] bangla">
            মুছে ফেলুন
          </h3>
          <p className="text-[10px] sm:text-xs text-[var(--color-gray)] bangla">
            এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-active-bg)] rounded-xl p-2.5 sm:p-3 mb-4 sm:mb-5 text-sm border border-[var(--color-active-border)]">
        <p className="font-medium text-sm sm:text-base text-[var(--color-text)] bangla truncate">
          {record.subject} — {record.class}
        </p>
        <p className="text-[var(--color-gray)] text-[10px] sm:text-xs mt-0.5 bangla">
          {record.referenceType === "chapter" ? "অধ্যায়" : "পৃষ্ঠা"} #
          {record.chapterNumber} • {resolveTeacherName(record.teacher)}
        </p>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all disabled:opacity-50 bangla"
        >
          বাতিল
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-60 bangla"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span>মুছুন</span>
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────
export const EditModal = ({
  record,
  onClose,
  onSuccess,
}: {
  record: DailyLessonData;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  // Fetch teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<
    TeacherOption[]
  >({
    queryKey: ["teachers-for-select"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      const list: Record<string, unknown>[] = Array.isArray(res.data)
        ? res.data
        : [];
      return list
        .filter(
          (u) =>
            ["teacher", "principal", "admin", "owner"].includes(
              u.role as string,
            ) && u.slug,
        )
        .map((u) => ({ slug: u.slug as string, name: u.name as string }));
    },
  });

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: t.slug, label: t.name })),
    [teachers],
  );

  const currentTeacherSlug = useMemo(() => {
    return resolveTeacherSlug(record.teacher, record.teacherSlug);
  }, [record]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid, isDirty, touchedFields },
  } = useForm<EditFormValues>({
    mode: "onTouched",
    defaultValues: {
      subject: record.subject,
      class: record.class,
      chapterNumber: record.chapterNumber,
      referenceType: record.referenceType || "chapter",
      topics: record.topics,
      teacherSlug: currentTeacherSlug,
      teacher: resolveTeacherName(record.teacher),
    },
  });

  const selectedClass = watch("class");
  const selectedReferenceType = watch("referenceType");

  const mutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const teacherId = resolveTeacherId(record.teacher);

      return axiosPublic.patch(`/api/daily-lesson/${record._id}`, {
        subject: data.subject,
        class: data.class,
        chapterNumber: data.chapterNumber,
        referenceType: data.referenceType,
        topics: data.topics,
        teacher: teacherId,
        teacherSlug: data.teacherSlug,
      });
    },
    onSuccess: () => {
      toast.success("সফলভাবে আপডেট হয়েছে!");
      onSuccess();
      onClose();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message || err?.message || "আপডেট ব্যর্থ হয়েছে",
      ),
  });

  const onSubmit: SubmitHandler<EditFormValues> = (data) =>
    mutation.mutate(data);

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`bg-[var(--color-bg)] w-screen h-screen overflow-y-auto ${scrollbarHideClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-active-border)] bg-[var(--color-bg)]">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-1 h-5 sm:h-6 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
            <h2 className="font-bold text-[var(--color-text)] bangla text-sm sm:text-base">
              পাঠ সম্পাদনা করুন
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white transition-colors"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-3 sm:p-6 space-y-3 sm:space-y-5"
          noValidate
        >
          {/* Class + Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
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
                  onChange={(v) => {
                    field.onChange(v);
                    setValue("subject", "", { shouldTouch: false });
                  }}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  isTouched={fieldState.isTouched}
                />
              )}
            />
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
          </div>

          {/* Teacher + Reference Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <Controller
              name="teacherSlug"
              control={control}
              rules={{ required: "শিক্ষক বাছাই করুন" }}
              render={({ field, fieldState }) => (
                <SelectInput
                  label="শিক্ষক"
                  required
                  placeholder={
                    isLoadingTeachers ? "লোড হচ্ছে..." : "শিক্ষক বেছে নিন"
                  }
                  options={teacherOptions}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    const selected = teachers.find((t) => t.slug === v);
                    if (selected) {
                      setValue("teacher", selected.name, { shouldDirty: true });
                    }
                  }}
                  onBlur={field.onBlur}
                  disabled={isLoadingTeachers}
                  error={fieldState.error?.message}
                  isTouched={fieldState.isTouched}
                />
              )}
            />

            <Controller
              name="referenceType"
              control={control}
              rules={{ required: "রেফারেন্স টাইপ আবশ্যিক" }}
              render={({ field, fieldState }) => (
                <SelectInput
                  label="রেফারেন্স টাইপ"
                  required
                  placeholder="টাইপ বেছে নিন"
                  options={REFERENCE_TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  isTouched={fieldState.isTouched}
                />
              )}
            />
          </div>

          {/* Chapter/Page number */}
          <div>
            <label className={labelCls}>
              {selectedReferenceType === "page" ? "পৃষ্ঠা" : "অধ্যায়"} নম্বর{" "}
              <RequiredStar />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="যেমন: ১, ৫, ২.৫"
              {...register("chapterNumber", {
                required: `${selectedReferenceType === "page" ? "পৃষ্ঠা" : "অধ্যায়"} নম্বর আবশ্যিক`,
                minLength: { value: 1, message: "সঠিক নম্বর দিন" },
              })}
              className={`${inputCls(
                !!errors.chapterNumber,
                !!touchedFields.chapterNumber && !errors.chapterNumber,
              )} ring-1 ring-transparent focus:ring-2 focus:ring-emerald-500 bangla`}
            />
            <ErrMsg msg={errors.chapterNumber?.message} />
          </div>

          {/* Topics */}
          <div>
            <label className={labelCls}>
              বিষয়বস্তু <RequiredStar />
            </label>
            <textarea
              rows={4}
              placeholder="বিষয়বস্তু লিখুন..."
              {...register("topics", {
                required: "বিষয়বস্তু আবশ্যিক",
                minLength: { value: 6, message: "কমপক্ষে ৬ অক্ষর লিখুন" },
              })}
              className={`${inputCls(
                !!errors.topics,
                !!touchedFields.topics && !errors.topics,
              )} resize-none leading-relaxed bangla ring-1 ring-transparent focus:ring-2 focus:ring-emerald-500`}
            />
            <ErrMsg msg={errors.topics?.message} />
          </div>

          {/* Hidden teacher name field */}
          <input type="hidden" {...register("teacher")} />

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[var(--color-active-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="w-full sm:w-32 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all disabled:opacity-50 bangla"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={!isValid || !isDirty || mutation.isPending}
              className={`flex-1 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 bangla
                ${
                  isValid && isDirty && !mutation.isPending
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-[var(--color-active-bg)] text-[var(--color-gray)] cursor-not-allowed"
                }`}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span>আপডেট হচ্ছে…</span>
                </>
              ) : (
                "আপডেট করুন"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
