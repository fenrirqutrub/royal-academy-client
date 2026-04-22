// src/components/WeeklyExam.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import toast from "react-hot-toast";
import WeeklyExamCard from "./WeeklyExamCard";
import ExamPagination from "../../components/common/ExamPagination";
import axiosPublic from "../../hooks/axiosPublic";
import Marquee from "react-fast-marquee";
import Skeleton from "../../components/common/Skeleton";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { BookPlus, Fan, Filter, RotateCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DeleteModal, EditModal } from "./WeeklyExamUpdateModals";
import { useGuestPreview } from "../../hooks/useGuestPreview";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";
import SelectInput from "../../components/common/SelectInput";
import { BN_DAYS_FULL, BN_MONTHS, toBn } from "../../utility/Formatters";
import { MANAGER_ROLES, STAFF_ROLES } from "../../utility/Constants";
import { LayoutGrid } from "lucide-react";
import { LayoutGroup } from "framer-motion";
import type { WeeklyExamData } from "../../types/types";
import { useNavigate } from "react-router";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NormalizedImage {
  url: string;
  publicId: string;
}

type RawImage = string | { imageUrl?: string; url?: string; publicId?: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCreatedAt = (iso: string): string => {
  const d = new Date(iso);
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBn(d.getFullYear())}`;
};

const normalizeImages = (images: RawImage[]): NormalizedImage[] =>
  images.map((img) => {
    if (typeof img === "string") return { url: img, publicId: "" };
    return {
      url: img.imageUrl ?? img.url ?? "",
      publicId: img.publicId ?? "",
    };
  });

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

// ─── CLASS ORDER ──────────────────────────────────────────────────────────────
const CLASS_ORDER: Record<string, number> = {
  "৬ষ্ঠ শ্রেণি": 1,
  "৭ম শ্রেণি": 2,
  "৮ম শ্রেণি": 3,
  "৯ম শ্রেণি": 4,
  "১০ম শ্রেণি": 5,
};

// ─── Animation Variants ───────────────────────────────────────────────────────
const groupTitleVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const filterBarVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

const badgePulse: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.15 } },
};

// pill animation variants (same as ClassFilterBtns)
const pillContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
};

const pillItemVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.88 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

const dotVariants: Variants = {
  inactive: { scale: 1, opacity: 0.7 },
  active: {
    scale: 1.1,
    opacity: 0.95,
    transition: { type: "spring", stiffness: 500, damping: 24 },
  },
  hover: { scale: 1.18, opacity: 1 },
  tap: { scale: 0.9 },
};

// ─── ActiveFilterBadge ────────────────────────────────────────────────────────
const ActiveFilterBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-text-hover)] text-[10px] font-bold text-[var(--color-bg)] shadow-lg"
    >
      {toBn(count)}
    </motion.span>
  );
};

// ─── Inline ClassFilterBtns for WeeklyExam ────────────────────────────────────
const ExamClassFilterBtns = ({
  activeId,
  onChange,
  classes,
  disabled = false,
}: {
  activeId: string;
  onChange: (id: string) => void;
  classes: string[];
  disabled?: boolean;
}) => {
  if (classes.length === 0) return null;

  const getButtonClass = ({
    isActive,
    isAll = false,
  }: {
    isActive: boolean;
    isAll?: boolean;
  }) =>
    [
      "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-xs font-bold outline-none transition-colors duration-150 sm:px-3.5 sm:text-sm cursor-pointer focus-visible:ring-2",
      isActive
        ? isAll
          ? "border-[1.5px] border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]"
          : "border-[1.5px] border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
        : "border-[1.5px] border-[var(--color-active-border)] bg-[var(--color-active-bg)] text-[var(--color-gray)]",
    ].join(" ");

  const isAllActive = activeId === "all";

  return (
    <LayoutGroup id="weekly-exam-class-filter">
      <motion.div
        variants={pillContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center justify-center gap-1.5 bangla sm:gap-2"
      >
        {/* All button */}
        <motion.button
          variants={pillItemVariants}
          whileHover={!disabled ? { x: 1.5 } : undefined}
          whileTap={!disabled ? { scale: 0.96 } : undefined}
          onClick={() => !disabled && onChange("all")}
          disabled={disabled}
          aria-pressed={isAllActive}
          className={getButtonClass({ isActive: isAllActive, isAll: true })}
        >
          {isAllActive && (
            <motion.span
              layoutId="we-cfb-pill"
              className="absolute inset-0 rounded-full bg-[var(--color-text)]"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1">
            <LayoutGrid
              size={12}
              strokeWidth={2.5}
              className="shrink-0 sm:size-3.5"
            />
            সকল
          </span>
        </motion.button>

        {/* Class buttons */}
        {classes.map((cls) => {
          const isActive = activeId === cls;
          return (
            <motion.button
              key={cls}
              variants={pillItemVariants}
              animate={isActive ? "active" : "inactive"}
              whileHover={!disabled ? "hover" : undefined}
              whileTap={!disabled ? "tap" : undefined}
              onClick={() => !disabled && onChange(cls)}
              disabled={disabled}
              aria-pressed={isActive}
              className={getButtonClass({ isActive })}
            >
              {isActive && (
                <motion.span
                  layoutId="we-cfb-pill"
                  className="absolute inset-0 rounded-full bg-[var(--color-brand-soft)]"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <motion.span
                  variants={dotVariants}
                  className={[
                    "block h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2",
                    isActive
                      ? "bg-[var(--color-brand)]"
                      : "bg-[var(--color-gray)]",
                  ].join(" ")}
                />
                {cls}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </LayoutGroup>
  );
};

// ─── Class Group Title ────────────────────────────────────────────────────────
const ClassGroupTitle = ({
  className,
  index,
  count,
}: {
  className: string;
  index: number;
  count: number;
}) => (
  <motion.div
    custom={index}
    variants={groupTitleVariants}
    initial="hidden"
    animate="visible"
    className="relative mb-5 mt-8 overflow-hidden rounded-xl bangla sm:mt-10"
  >
    <div className="flex flex-1 flex-col items-center justify-center gap-2 border-y border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-4 py-3.5 sm:flex-row sm:gap-x-10 sm:px-5 sm:py-4">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          delay: index * 0.07 + 0.2,
          duration: 0.6,
          ease: "easeOut",
        }}
        className="absolute left-0 top-0 h-0.5 w-full origin-left bg-gradient-to-r from-[var(--color-text-hover)] to-transparent"
      />
      <h2 className="text-lg font-extrabold leading-tight text-[var(--color-text)] sm:text-xl md:text-2xl">
        {className}
      </h2>
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: index * 0.07 + 0.3,
          type: "spring",
          stiffness: 500,
        }}
        className="rounded-full border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3 py-0.5 text-xs font-black text-[var(--color-text-hover)] sm:text-sm"
      >
        {toBn(count)}টি পরীক্ষার ধারণা
      </motion.span>
    </div>
  </motion.div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
const WeeklyExam = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isGuest } = useGuestPreview();

  const [selectedExamNumber, setSelectedExamNumber] = useState<string | null>(
    null,
  );
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<WeeklyExamData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeeklyExamData | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const userRole = user?.role ?? "student";
  const userSlug = user?.slug ?? "";
  const isManager = MANAGER_ROLES.includes(userRole);
  const isStaff = STAFF_ROLES.includes(userRole);
  const navigate = useNavigate();

  const handleAddExam = () => {
    navigate("/dashboard/add-weekly-exam"); // ← তোমার actual route দাও
  };

  // default teacher filter: staff sees their own, others see "all"
  const defaultTeacherFilter = useMemo(
    () => (STAFF_ROLES.includes(userRole) && userSlug ? userSlug : "all"),
    [userRole, userSlug],
  );

  const prevDefaultRef = useRef("all");

  // sync teacher filter when auth loads (same pattern as DailyLesson)
  useEffect(() => {
    const prevDefault = prevDefaultRef.current;
    setSelectedTeacher((prev) =>
      prev === prevDefault ? defaultTeacherFilter : prev,
    );
    prevDefaultRef.current = defaultTeacherFilter;
  }, [defaultTeacherFilter]);

  // ─── Fetch exams ─────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<WeeklyExamData[]>({
    queryKey: ["weekly-exams"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/weekly-exams");
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // ─── Exam numbers ─────────────────────────────────────────────────────────
  const examNumbers = useMemo(() => {
    if (!data) return [];
    const unique = new Set(data.map((e) => e.ExamNumber));
    return sortExamNumbers(Array.from(unique));
  }, [data]);

  const nextExpectedExamNumber = useMemo(() => {
    if (examNumbers.length === 0) return "1";
    return String(Number(examNumbers[examNumbers.length - 1]) + 1);
  }, [examNumbers]);

  // ─── Core Logic ───────────────────────────────────────────────────────────
  const latestExamCreatedAt = useMemo(() => {
    if (!data || examNumbers.length === 0) return null;
    const latestNumber = examNumbers[examNumbers.length - 1];
    const examsWithLatestNumber = data.filter(
      (e) => e.ExamNumber === latestNumber,
    );
    if (examsWithLatestNumber.length === 0) return null;
    const dates = examsWithLatestNumber.map((e) =>
      new Date(e.createdAt).getTime(),
    );
    return new Date(Math.max(...dates));
  }, [data, examNumbers]);

  const shouldShowNextExam = useMemo(() => {
    if (!latestExamCreatedAt) return false;
    const lastSat = getLastSaturdayMidnight();
    return latestExamCreatedAt.getTime() < lastSat.getTime();
  }, [latestExamCreatedAt]);

  const displayExamNumbers = useMemo(() => {
    if (shouldShowNextExam) return [...examNumbers, nextExpectedExamNumber];
    return examNumbers;
  }, [examNumbers, shouldShowNextExam, nextExpectedExamNumber]);

  const activeExamNumber = useMemo(() => {
    if (selectedExamNumber && displayExamNumbers.includes(selectedExamNumber))
      return selectedExamNumber;
    if (shouldShowNextExam) return nextExpectedExamNumber;
    return examNumbers[examNumbers.length - 1] ?? null;
  }, [
    examNumbers,
    displayExamNumbers,
    selectedExamNumber,
    shouldShowNextExam,
    nextExpectedExamNumber,
  ]);

  const isAwaitingNextExam = useMemo(
    () =>
      shouldShowNextExam &&
      activeExamNumber === nextExpectedExamNumber &&
      !examNumbers.includes(nextExpectedExamNumber),
    [shouldShowNextExam, activeExamNumber, nextExpectedExamNumber, examNumbers],
  );

  // ─── Data filtered by active exam number only (for teacher options) ───────
  const examNumberFilteredData = useMemo(() => {
    if (!data || !activeExamNumber) return [];
    return data.filter((e) => e.ExamNumber === activeExamNumber);
  }, [data, activeExamNumber]);

  // teacherOptions এ teacherName → teacher দিয়ে replace করো
  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();
    examNumberFilteredData.forEach((e) => {
      if (e.teacherSlug && e.teacher) map.set(e.teacherSlug, e.teacher); // ← e.teacherName → e.teacher
    });
    if (userSlug && !map.has(userSlug)) {
      map.set(userSlug, user?.name || "আমার পরীক্ষা");
    }
    return [
      { value: "all", label: "সকল শিক্ষক" },
      ...Array.from(map.entries()).map(([slug, name]) => ({
        value: slug,
        label: name,
      })),
    ];
  }, [examNumberFilteredData, userSlug, user?.name]);

  // ─── Available classes (after teacher filter) ────────────────────────────
  const availableClasses = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    examNumberFilteredData
      .filter(
        (e) => selectedTeacher === "all" || e.teacherSlug === selectedTeacher,
      )
      .forEach((e) => {
        if (!seen.has(e.class)) {
          seen.add(e.class);
          result.push(e.class);
        }
      });
    return result.sort(
      (a, b) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99),
    );
  }, [examNumberFilteredData, selectedTeacher]);

  // ─── Grouped data (with teacher + class filter) ───────────────────────────
  const groupedByClass = useMemo(() => {
    let filtered = examNumberFilteredData;
    if (selectedTeacher !== "all")
      filtered = filtered.filter((e) => e.teacherSlug === selectedTeacher);
    if (selectedClass !== "all")
      filtered = filtered.filter((e) => e.class === selectedClass);

    const map = new Map<string, WeeklyExamData[]>();
    filtered.forEach((exam) => {
      if (!map.has(exam.class)) map.set(exam.class, []);
      map.get(exam.class)!.push(exam);
    });
    map.forEach((exams) =>
      exams.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    );

    return Array.from(map.entries())
      .sort(([a], [b]) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99))
      .map(([className, exams]) => ({ className, exams }));
  }, [examNumberFilteredData, selectedTeacher, selectedClass]);

  const totalExamsInNumber = examNumberFilteredData.length;

  const filteredCount = useMemo(
    () => groupedByClass.reduce((acc, g) => acc + g.exams.length, 0),
    [groupedByClass],
  );

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (selectedClass !== "all") c++;
    if (selectedTeacher !== defaultTeacherFilter) c++;
    return c;
  }, [selectedClass, selectedTeacher, defaultTeacherFilter]);

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedClass("all");
    setSelectedTeacher(defaultTeacherFilter);
  };

  // reset class if no longer available after teacher change
  useEffect(() => {
    if (selectedClass !== "all" && !availableClasses.includes(selectedClass)) {
      setSelectedClass("all");
    }
  }, [availableClasses, selectedClass]);

  // ─── Permissions ──────────────────────────────────────────────────────────
  const canEditExam = (exam: WeeklyExamData): boolean => {
    if (isManager) return true;
    if (userRole === "teacher" && exam.teacherSlug === userSlug) return true;
    return false;
  };

  const canDeleteExam = (exam: WeeklyExamData): boolean => {
    if (isManager) return true;
    if (userRole === "teacher" && exam.teacherSlug === userSlug) return true;
    return false;
  };

  // ─── Delete mutation ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosPublic.delete(`/api/weekly-exams/${id}`),
    onSuccess: () => {
      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["weekly-exams"] });
      setDeleteTarget(null);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message || err?.message || "মুছতে ব্যর্থ হয়েছে",
      ),
  });

  // ─── Card renderer ────────────────────────────────────────────────────────
  const renderCard = (exam: WeeklyExamData, i: number) => (
    <WeeklyExamCard
      key={exam._id}
      exam={{
        ...exam,
        date: formatCreatedAt(exam.createdAt),
        images: normalizeImages(exam.images),
      }}
      index={i}
      activeExamNumber={activeExamNumber}
      canEdit={canEditExam(exam)}
      canDelete={canDeleteExam(exam)}
      onEdit={() => setEditTarget(exam)}
      onDelete={() => setDeleteTarget(exam)}
    />
  );

  // ─── Guest content ────────────────────────────────────────────────────────
  const buildGuestContent = () => {
    const class6 = groupedByClass.find(({ className }) =>
      className.includes("৬ষ্ঠ"),
    );
    if (!class6) return null;
    const visibleExams = class6.exams.slice(0, 2);
    return (
      <>
        <ClassGroupTitle
          className={class6.className}
          index={0}
          count={class6.exams.length}
        />
        <div
          className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10 cursor-pointer"
          onClick={() => setShowLoginPrompt(true)}
        >
          {visibleExams.map((exam, i) => renderCard(exam, i))}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--color-bg)] to-transparent pointer-events-none" />
        </div>
      </>
    );
  };

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (isLoading) return <Skeleton variant="daily-lesson" />;
  if (isError) {
    return (
      <div className="text-center py-20 text-rose-400 text-sm bangla">
        ডেটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।
      </div>
    );
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-8 px-3 text-center bangla sm:mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative inline-block"
        >
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl md:text-4xl lg:text-5xl">
            সাপ্তাহিক পরীক্ষার ধারণা
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-2 h-0.5 w-16 origin-center rounded-full bg-gradient-to-r from-transparent via-[var(--color-text-hover)] to-transparent sm:w-20"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="mt-3 text-sm font-medium text-[var(--color-gray)] sm:text-base md:text-lg"
        >
          প্রতিটি পরীক্ষার বিষয়ভিত্তিক ধারণা ও নির্দেশনা
        </motion.p>
      </header>

      {/* ── Filter Bar ── */}
      <motion.div
        variants={filterBarVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] p-3 shadow-sm sm:mb-8 sm:p-4 md:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          {/* Teacher filter */}
          <div className="relative min-w-0 flex-1 sm:max-w-[260px]">
            <SelectInput
              label="শিক্ষক"
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              placeholder="শিক্ষক বাছুন"
              options={teacherOptions}
              disabled={teacherOptions.length <= 1}
            />
            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => setShowLoginPrompt(true)}
              />
            )}
          </div>
          {/* Add exam (staff) */}
          <AnimatePresence>
            {!isGuest && isStaff && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.94 }}
                transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
                className="flex-1 justify-center items-center w-full"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="group flex items-center gap-2.5 rounded bg-[var(--color-text)] px-5 py-3 text-sm font-bold text-[var(--color-bg)] shadow-sm outline-none transition-all duration-200 sm:px-6 sm:text-base bangla"
                  onClick={handleAddExam}
                >
                  <motion.span
                    className="flex items-center"
                    whileHover={{ rotate: 12 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  >
                    <BookPlus size={17} strokeWidth={2.2} />
                  </motion.span>
                  ধারণা জমা দিন
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badge + Reset */}
          <div className="flex items-end gap-2.5 sm:ml-auto">
            <AnimatePresence mode="wait">
              {totalExamsInNumber > 0 && (
                <motion.div
                  key={`${activeExamNumber}-${selectedClass}-${selectedTeacher}`}
                  variants={badgePulse}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="whitespace-nowrap rounded-full border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3.5 py-2 text-xs text-[var(--color-gray)] bangla sm:text-sm"
                >
                  {selectedClass !== "all" || selectedTeacher !== "all" ? (
                    <>
                      <span className="font-bold text-[var(--color-text)]">
                        {toBn(filteredCount)}
                      </span>
                      টি ধারণা{" "}
                      <span className="hidden sm:inline">
                        (মোট{" "}
                        <span className="font-bold text-[var(--color-text)]">
                          {toBn(totalExamsInNumber)}
                        </span>
                        টি)
                      </span>
                    </>
                  ) : (
                    <>
                      মোট{" "}
                      <span className="font-bold text-[var(--color-text)]">
                        {toBn(totalExamsInNumber)}
                      </span>
                      টি ধারণা
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative"
                >
                  <motion.button
                    whileHover={{ scale: 1.08, rotate: -15 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleReset}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] text-[var(--color-gray)] shadow-sm transition-colors hover:border-[var(--color-text-hover)] hover:text-[var(--color-text-hover)] sm:h-10 sm:w-10"
                    title="ফিল্টার রিসেট করুন"
                  >
                    <RotateCcw size={15} />
                  </motion.button>
                  <ActiveFilterBadge count={activeFilterCount} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Class filter pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 border-t border-[var(--color-active-border)] pt-3 sm:mt-4 sm:pt-4"
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <Filter size={11} className="text-[var(--color-gray)] opacity-50" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-gray)] bangla sm:text-xs">
              শ্রেণি
            </span>
          </div>
          <div className="relative">
            <ExamClassFilterBtns
              activeId={selectedClass}
              onChange={setSelectedClass}
              classes={availableClasses}
              disabled={false}
            />
            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => setShowLoginPrompt(true)}
              />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Marquee */}
      <div className="flex items-stretch rounded overflow-hidden bangla mb-6 sm:mb-8 mx-2 sm:mx-0">
        <div className="shrink-0 flex items-center justify-center px-3 sm:px-5 bg-[var(--color-text)]">
          <span className="text-[var(--color-bg)] font-black text-md md:text-lg tracking-wide">
            বিজ্ঞপ্তি
          </span>
        </div>
        <div className="flex-1 bg-[var(--color-active-bg)] overflow-hidden py-1 flex items-center">
          <Marquee speed={40} gradient={false} pauseOnHover>
            <span className="flex items-center text-[var(--color-text)] text-md md:text-lg font-medium px-4 sm:px-6">
              লিখিত ৭০, বহুনির্বাচনী ৩০; পূর্ণমান ১০০; সময় ৩ ঘণ্টা; পরীক্ষার ফি
              ও অন্যন্য খরচ বাবদ ৩০ টাকা ধার্য করা হয়েছে। নির্ধারিত সময়ের
              মধ্যে উপস্থিত হওয়ার জন্য আদেশ করা হলো{" "}
              <TfiLayoutLineSolid className="w-12 sm:w-20 h-6 sm:h-10" />
            </span>
          </Marquee>
        </div>
      </div>

      {/* Staff indicator */}
      <AnimatePresence>
        {!isGuest && isStaff && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mx-2 mb-5 overflow-hidden rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-4 py-3 sm:mx-0 sm:mb-6"
          >
            <p className="text-xs sm:text-sm text-[var(--color-text-hover)] text-center sm:text-left bangla">
              {isManager
                ? "🔑 আপনি সকল পরীক্ষা সম্পাদনা ও মুছে ফেলতে পারবেন"
                : "✏️ আপনি শুধু নিজের যোগ করা পরীক্ষা সম্পাদনা ও মুছে ফেলতে পারবেন"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeExamNumber}-${selectedClass}-${selectedTeacher}`}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="px-2 sm:px-3 md:px-0"
        >
          {groupedByClass.length > 0 ? (
            isGuest ? (
              buildGuestContent()
            ) : (
              groupedByClass.map(({ className, exams }, groupIndex) => (
                <div key={className}>
                  <ClassGroupTitle
                    className={className}
                    index={groupIndex}
                    count={exams.length}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                    {exams.map((exam, i) => renderCard(exam, i))}
                  </div>
                </div>
              ))
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="py-14 text-center sm:py-20"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
                className="mb-5 text-5xl sm:text-6xl"
              >
                {isAwaitingNextExam ? (
                  <Fan className="mx-auto w-10 h-10 md:w-14 md:h-14 animate-spin text-[var(--color-gray)]" />
                ) : (
                  "📭"
                )}
              </motion.div>
              <p className="mb-5 text-sm text-[var(--color-gray)] bangla sm:text-base">
                {isAwaitingNextExam
                  ? `পরীক্ষা নং ${toBn(activeExamNumber ?? "")} — এখনো কেউ ধারণা দেয়নি`
                  : selectedTeacher !== "all"
                    ? "এই শিক্ষকের কোনো ধারণা পাওয়া যায়নি"
                    : selectedClass !== "all"
                      ? "এই শ্রেণির কোনো পরীক্ষা পাওয়া যায়নি"
                      : "এই পরীক্ষার কোনো তথ্য পাওয়া যায়নি।"}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {(selectedClass !== "all" || selectedTeacher !== "all") && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg text-sm bangla font-medium bg-[var(--color-active-bg)] border border-[var(--color-active-border)] text-[var(--color-text)] hover:bg-[var(--color-active-border)] transition-colors"
                  >
                    সকল ফিল্টার সরান
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {displayExamNumbers.length > 0 && activeExamNumber && (
        <div className="relative mt-8">
          <ExamPagination
            examNumbers={displayExamNumbers}
            selected={activeExamNumber}
            onSelect={isGuest ? () => {} : setSelectedExamNumber}
          />
          {isGuest && (
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={() => setShowLoginPrompt(true)}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editTarget && (
          <EditModal
            key="edit"
            record={editTarget}
            onClose={() => setEditTarget(null)}
            onSuccess={() =>
              qc.invalidateQueries({ queryKey: ["weekly-exams"] })
            }
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete"
            record={deleteTarget}
            onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Guest Login Prompt */}
      <LoginPromptOverlay
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  );
};

export default WeeklyExam;
