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
import AnimatedFilterPills from "../../components/common/AnimatedFilterPills";
import { BN_DAYS_FULL, BN_MONTHS, toBn } from "../../utility/Formatters";
import { MANAGER_ROLES, STAFF_ROLES } from "../../utility/Constants";
import type { WeeklyExamData } from "../../types/types";
import { useNavigate } from "react-router";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface NormalizedImage {
  url: string;
  publicId: string;
}

type RawImage = string | { imageUrl?: string; url?: string; publicId?: string };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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

const CLASS_ORDER: Record<string, number> = {
  "৬ষ্ঠ শ্রেণি": 1,
  "৭ম শ্রেণি": 2,
  "৮ম শ্রেণি": 3,
  "৯ম শ্রেণি": 4,
  "১০ম শ্রেণি": 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────────────────────────────────────
const groupTitleVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18 },
  },
};

const filterBarVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const badgePulse: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Small UI Components
// ─────────────────────────────────────────────────────────────────────────────
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
    className="mb-4 mt-8 flex items-center justify-between rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-bg)] px-4 py-3 bangla sm:mt-10"
  >
    <h2 className="text-lg font-bold text-[var(--color-text)] sm:text-xl">
      {className}
    </h2>

    <span className="rounded-full bg-[var(--color-active-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-text-hover)] sm:text-sm">
      {toBn(count)}টি
    </span>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const WeeklyExam = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isGuest } = useGuestPreview();
  const navigate = useNavigate();

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

  const handleAddExam = () => {
    const exam = activeExamNumber || nextExpectedExamNumber || "1";
    navigate(`/dashboard/add-weekly-exam?exam=${exam}`);
  };

  // staff হলে default teacher filter নিজের slug হবে
  const defaultTeacherFilter = useMemo(
    () => (STAFF_ROLES.includes(userRole) && userSlug ? userSlug : "all"),
    [userRole, userSlug],
  );

  const prevDefaultRef = useRef("all");

  useEffect(() => {
    const prevDefault = prevDefaultRef.current;

    setSelectedTeacher((prev) =>
      prev === prevDefault ? defaultTeacherFilter : prev,
    );

    prevDefaultRef.current = defaultTeacherFilter;
  }, [defaultTeacherFilter]);

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch
  // ───────────────────────────────────────────────────────────────────────────
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
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Exam numbers
  // ───────────────────────────────────────────────────────────────────────────
  const examNumbers = useMemo(() => {
    if (!data) return [];
    const unique = new Set(data.map((e) => e.ExamNumber));
    return sortExamNumbers(Array.from(unique));
  }, [data]);

  const nextExpectedExamNumber = useMemo(() => {
    if (examNumbers.length === 0) return "1";
    return String(Number(examNumbers[examNumbers.length - 1]) + 1);
  }, [examNumbers]);

  // ───────────────────────────────────────────────────────────────────────────
  // Next exam logic
  // ───────────────────────────────────────────────────────────────────────────
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
    if (selectedExamNumber && displayExamNumbers.includes(selectedExamNumber)) {
      return selectedExamNumber;
    }

    if (shouldShowNextExam) return nextExpectedExamNumber;

    return examNumbers[examNumbers.length - 1] ?? null;
  }, [
    selectedExamNumber,
    displayExamNumbers,
    shouldShowNextExam,
    nextExpectedExamNumber,
    examNumbers,
  ]);

  const isAwaitingNextExam = useMemo(
    () =>
      shouldShowNextExam &&
      activeExamNumber === nextExpectedExamNumber &&
      !examNumbers.includes(nextExpectedExamNumber),
    [shouldShowNextExam, activeExamNumber, nextExpectedExamNumber, examNumbers],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // active exam-এর data
  // ───────────────────────────────────────────────────────────────────────────
  const examNumberFilteredData = useMemo(() => {
    if (!data || !activeExamNumber) return [];
    return data.filter((e) => e.ExamNumber === activeExamNumber);
  }, [data, activeExamNumber]);

  // teacher options
  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();

    examNumberFilteredData.forEach((e) => {
      if (e.teacherSlug && e.teacher) {
        map.set(e.teacherSlug, e.teacher);
      }
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

  // exam number change করলে invalid teacher থাকলে reset
  useEffect(() => {
    const exists = teacherOptions.some((opt) => opt.value === selectedTeacher);

    if (!exists) {
      setSelectedTeacher(defaultTeacherFilter);
    }
  }, [teacherOptions, selectedTeacher, defaultTeacherFilter]);

  // selected teacher অনুযায়ী available class
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

  // teacher + class apply করে grouped data
  const groupedByClass = useMemo(() => {
    let filtered = examNumberFilteredData;

    if (selectedTeacher !== "all") {
      filtered = filtered.filter((e) => e.teacherSlug === selectedTeacher);
    }

    if (selectedClass !== "all") {
      filtered = filtered.filter((e) => e.class === selectedClass);
    }

    const map = new Map<string, WeeklyExamData[]>();

    filtered.forEach((exam) => {
      if (!map.has(exam.class)) {
        map.set(exam.class, []);
      }

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
    let count = 0;

    if (selectedClass !== "all") count++;
    if (selectedTeacher !== defaultTeacherFilter) count++;

    return count;
  }, [selectedClass, selectedTeacher, defaultTeacherFilter]);

  const handleReset = () => {
    setSelectedClass("all");
    setSelectedTeacher(defaultTeacherFilter);
  };

  // teacher change এর পরে current class available না থাকলে class reset
  useEffect(() => {
    if (selectedClass !== "all" && !availableClasses.includes(selectedClass)) {
      setSelectedClass("all");
    }
  }, [availableClasses, selectedClass]);

  // ───────────────────────────────────────────────────────────────────────────
  // Permissions
  // ───────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // Delete mutation
  // ───────────────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosPublic.delete(`/api/weekly-exams/${id}`),
    onSuccess: () => {
      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["weekly-exams"] });
      setDeleteTarget(null);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || err?.message || "মুছতে ব্যর্থ হয়েছে",
      );
    },
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Card renderer
  // ───────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // Guest preview
  // ───────────────────────────────────────────────────────────────────────────
  const buildGuestContent = () => {
    const previewGroup =
      groupedByClass.find(({ className }) => className.includes("৬ষ্ঠ")) ??
      groupedByClass[0];

    if (!previewGroup) return null;

    const visibleExams = previewGroup.exams.slice(0, 2);

    return (
      <>
        <ClassGroupTitle
          className={previewGroup.className}
          index={0}
          count={previewGroup.exams.length}
        />

        <div className="relative mb-8 grid cursor-pointer grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
          <div
            className="absolute inset-0 z-10"
            onClick={() => setShowLoginPrompt(true)}
          />

          {visibleExams.map((exam, i) => renderCard(exam, i))}

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
        </div>
      </>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Loading / Error
  // ───────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <Skeleton variant="daily-lesson" />;
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-sm text-rose-400 bangla">
        ডেটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // JSX
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-8 px-3 text-center bangla sm:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-3 inline-flex rounded-full border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-text-hover)]">
            সাপ্তাহিক আপডেট
          </div>

          <h1 className="text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl md:text-4xl">
            সাপ্তাহিক পরীক্ষার ধারণা
          </h1>

          <p className="mt-3 text-sm text-[var(--color-gray)] sm:text-base">
            প্রতিটি পরীক্ষার বিষয়ভিত্তিক ধারণা ও নির্দেশনা
          </p>
        </motion.div>
      </header>

      {/* Filter Bar */}
      <motion.section
        variants={filterBarVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 rounded-3xl border border-[var(--color-active-border)] bg-[var(--color-bg)] p-4 shadow-sm sm:mb-8 sm:p-5"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr_auto] lg:items-end">
          {/* Teacher Select */}
          <div className="relative min-w-0">
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

          {/* Add exam button */}
          <AnimatePresence>
            {!isGuest && isStaff && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="flex"
              >
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddExam}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-text)] px-5 text-sm font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-text-hover)] bangla"
                >
                  <BookPlus size={16} />
                  ধারণা জমা দিন
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats + Reset */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <AnimatePresence mode="wait">
              {totalExamsInNumber > 0 && (
                <motion.div
                  key={`${activeExamNumber}-${selectedClass}-${selectedTeacher}`}
                  variants={badgePulse}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3.5 py-2 text-sm text-[var(--color-gray)] bangla"
                >
                  {selectedClass !== "all" || selectedTeacher !== "all" ? (
                    <>
                      দেখানো{" "}
                      <span className="font-semibold text-[var(--color-text)]">
                        {toBn(filteredCount)}
                      </span>
                      {" / "}
                      মোট{" "}
                      <span className="font-semibold text-[var(--color-text)]">
                        {toBn(totalExamsInNumber)}
                      </span>
                    </>
                  ) : (
                    <>
                      মোট{" "}
                      <span className="font-semibold text-[var(--color-text)]">
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
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative"
                >
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleReset}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-active-border)] bg-[var(--color-bg)] text-[var(--color-gray)] transition-colors hover:bg-[var(--color-active-bg)] hover:text-[var(--color-text-hover)]"
                    title="ফিল্টার রিসেট করুন"
                  >
                    <RotateCcw size={16} />
                  </motion.button>

                  <ActiveFilterBadge count={activeFilterCount} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Class Filter */}
        <div className="mt-4 border-t border-[var(--color-active-border)] pt-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gray)] bangla">
            <Filter size={13} />
            শ্রেণি
          </div>

          <div className="relative">
            <AnimatedFilterPills
              items={availableClasses}
              activeId={selectedClass}
              onChange={setSelectedClass}
              layoutId="weekly-exam-class-pill"
            />

            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => setShowLoginPrompt(true)}
              />
            )}
          </div>
        </div>
      </motion.section>

      {/* Marquee Notice */}
      <div className="mx-2 mb-6 overflow-hidden rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-bg)] bangla sm:mx-0 sm:mb-8">
        <div className="flex items-stretch">
          <div className="flex shrink-0 items-center justify-center bg-[var(--color-text)] px-4 sm:px-5">
            <span className="text-sm font-black tracking-wide text-[var(--color-bg)] sm:text-base">
              বিজ্ঞপ্তি
            </span>
          </div>

          <div className="flex-1 overflow-hidden bg-[var(--color-active-bg)] py-1">
            <Marquee speed={40} gradient={false} pauseOnHover>
              <span className="flex items-center px-4 text-sm font-medium text-[var(--color-text)] sm:px-6 sm:text-base">
                লিখিত ৭০, বহুনির্বাচনী ৩০; পূর্ণমান ১০০; সময় ৩ ঘণ্টা; পরীক্ষার
                ফি ও অন্যন্য খরচ বাবদ ৩০ টাকা ধার্য করা হয়েছে। নির্ধারিত সময়ের
                মধ্যে উপস্থিত হওয়ার জন্য আদেশ করা হলো{" "}
                <TfiLayoutLineSolid className="h-6 w-12 sm:h-8 sm:w-16" />
              </span>
            </Marquee>
          </div>
        </div>
      </div>

      {/* Staff indicator */}
      <AnimatePresence>
        {!isGuest && isStaff && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-2 mb-5 overflow-hidden rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-4 py-3 sm:mx-0 sm:mb-6"
          >
            <p className="text-center text-xs text-[var(--color-text-hover)] bangla sm:text-left sm:text-sm">
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

                  <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
                    {exams.map((exam, i) => renderCard(exam, i))}
                  </div>
                </div>
              ))
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-dashed border-[var(--color-active-border)] bg-[var(--color-active-bg)] py-16 text-center sm:py-20"
            >
              <div className="mb-4">
                {isAwaitingNextExam ? (
                  <Fan className="mx-auto h-10 w-10 animate-spin text-[var(--color-gray)]" />
                ) : (
                  <span className="text-4xl">📭</span>
                )}
              </div>

              <p className="mb-5 text-sm text-[var(--color-gray)] bangla sm:text-base">
                {isAwaitingNextExam
                  ? `পরীক্ষা নং ${toBn(activeExamNumber ?? "")} — এখনো কেউ ধারণা দেয়নি`
                  : selectedTeacher !== "all"
                    ? "এই শিক্ষকের কোনো ধারণা পাওয়া যায়নি"
                    : selectedClass !== "all"
                      ? "এই শ্রেণির কোনো পরীক্ষা পাওয়া যায়নি"
                      : "এই পরীক্ষার কোনো তথ্য পাওয়া যায়নি।"}
              </p>

              {(selectedClass !== "all" || selectedTeacher !== "all") && (
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-[var(--color-active-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-active-bg)] bangla"
                >
                  সকল ফিল্টার সরান
                </button>
              )}
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
