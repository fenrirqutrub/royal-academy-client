// src/components/WeeklyExam.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import toast from "react-hot-toast";
import WeeklyExamCard from "./WeeklyExamCard";
import ExamPagination from "../../components/common/ExamPagination";
import axiosPublic from "../../hooks/axiosPublic";
import Marquee from "react-fast-marquee";
import Skeleton from "../../components/common/Skeleton";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { Fan } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  DeleteModal,
  EditModal,
  type WeeklyExamData,
} from "./WeeklyExamUpdateModals";
import { useGuestPreview } from "../../hooks/useGuestPreview";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";
import ClassTabs from "../../components/common/ClassTabs";
import { BN_DAYS_FULL, BN_MONTHS, toBn } from "../../utility/Formatters";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NormalizedImage {
  url: string;
  publicId: string;
}

type RawImage = string | { imageUrl?: string; url?: string; publicId?: string };

// ─── Constants ────────────────────────────────────────────────────────────────
const MANAGER_ROLES = ["principal", "admin", "owner"];
const STAFF_ROLES = ["teacher", "principal", "admin", "owner"];

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

// ─── Get most recent Saturday midnight (Dhaka time) ───────────────────────────
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

// ─── Animation Variants ───────────────────────────────────────────────────────
const groupTitleVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
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
    className="relative flex items-center gap-0 mb-5 mt-8 sm:mt-10 overflow-hidden rounded bangla"
  >
    <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-x-10 px-4 sm:px-5 py-3 sm:py-3.5 border-y border-[var(--color-active-border)] mt-3 sm:mt-5 bg-[var(--color-active-bg)]">
      <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold leading-tight text-[var(--color-text)]">
        {className}
      </h2>
      <span className="text-xs font-black px-3 sm:border-x border-[var(--color-gray)] text-[var(--color-gray)]">
        {toBn(String(count))}টি পরীক্ষার ধারণা
      </span>
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
  const [editTarget, setEditTarget] = useState<WeeklyExamData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeeklyExamData | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const userRole = user?.role ?? "student";
  const userSlug = user?.slug ?? "";
  const isManager = MANAGER_ROLES.includes(userRole);
  const isStaff = STAFF_ROLES.includes(userRole);

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
    if (shouldShowNextExam) {
      return [...examNumbers, nextExpectedExamNumber];
    }
    return examNumbers;
  }, [examNumbers, shouldShowNextExam, nextExpectedExamNumber]);

  const activeExamNumber = useMemo(() => {
    if (selectedExamNumber && displayExamNumbers.includes(selectedExamNumber)) {
      return selectedExamNumber;
    }
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

  // ─── Grouped data ─────────────────────────────────────────────────────────
  const groupedByClass = useMemo(() => {
    if (!data || !activeExamNumber) return [];

    let filtered = data.filter((e) => e.ExamNumber === activeExamNumber);
    if (selectedClass !== "all") {
      filtered = filtered.filter((e) => e.class === selectedClass);
    }

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
      .sort(([a], [b]) => {
        const getOrder = (cn: string) => {
          if (cn.includes("৬ষ্ঠ")) return 1;
          if (cn.includes("৭ম")) return 2;
          if (cn.includes("৮ম")) return 3;
          if (cn.includes("৯ম")) return 4;
          if (cn.includes("১০ম")) return 5;
          if (cn.includes("এসএসসি") || cn.includes("SSC")) return 6;
          return 99;
        };
        return getOrder(a) - getOrder(b);
      })
      .map(([className, exams]) => ({ className, exams }));
  }, [data, activeExamNumber, selectedClass]);

  const totalExamsInNumber = useMemo(() => {
    if (!data || !activeExamNumber) return 0;
    return data.filter((e) => e.ExamNumber === activeExamNumber).length;
  }, [data, activeExamNumber]);

  const filteredCount = useMemo(
    () => groupedByClass.reduce((acc, g) => acc + g.exams.length, 0),
    [groupedByClass],
  );

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

  // ─── Card renderer (DRY) ──────────────────────────────────────────────────
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

          {/* Fade overlay at bottom */}
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
    <div className="relative">
      {/* Header */}
      <header className="text-center bangla my-4 px-4">
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--color-text)]">
          সাপ্তাহিক পরীক্ষার ধারণা - {toBn(activeExamNumber ?? "")}
        </h1>
      </header>

      {/* Class Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative flex justify-center mt-4 sm:mt-6 px-2"
      >
        <ClassTabs
          activeId={selectedClass}
          onChange={isGuest ? () => {} : setSelectedClass}
        />
        {/* Guest intercept */}
        {isGuest && (
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={() => setShowLoginPrompt(true)}
          />
        )}
      </motion.div>

      {/* Filter Info */}
      {selectedClass !== "all" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex justify-center mt-3"
        >
          <span className="text-xs sm:text-sm bangla px-3 py-1.5 rounded-full bg-[var(--color-active-bg)] border border-[var(--color-active-border)] text-[var(--color-gray)]">
            {toBn(filteredCount)}টি পরীক্ষা পাওয়া গেছে (মোট{" "}
            {toBn(totalExamsInNumber)}টির মধ্যে)
          </span>
        </motion.div>
      )}

      {/* Marquee */}
      <div className="flex items-stretch rounded overflow-hidden bangla mt-6 sm:mt-8 mx-2 sm:mx-0">
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
      {isStaff && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-4 sm:mt-6 mb-4 mx-2 sm:mx-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[var(--color-active-bg)]"
        >
          <p className="text-xs sm:text-sm text-[var(--color-gray)] text-center sm:text-left">
            {isManager
              ? "🔑  আপনি সকল পরীক্ষা সম্পাদনা ও মুছে ফেলতে পারবেন"
              : "✏️ আপনি শুধু নিজের যোগ করা পরীক্ষা সম্পাদনা ও মুছে ফেলতে পারবেন"}
          </p>
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeExamNumber}-${selectedClass}`}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-6 sm:mt-8 px-2 sm:px-3 md:px-0"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 sm:py-16"
            >
              <div className="flex items-center justify-center gap-x-2 text-[var(--color-gray)] bangla">
                <span className="text-4xl sm:text-5xl">
                  {isAwaitingNextExam ? (
                    <Fan className="w-4 h-4 md:w-6 md:h-6 animate-spin" />
                  ) : (
                    "📭"
                  )}
                </span>
                <span className="text-lg md:text-2xl">
                  {isAwaitingNextExam ? (
                    <>
                      পরীক্ষা নং {toBn(activeExamNumber ?? "")} — এখনো কেউ ধারণা
                      দেয়নি
                    </>
                  ) : selectedClass !== "all" ? (
                    `${
                      selectedClass === "Class 6"
                        ? "ষষ্ঠ"
                        : selectedClass === "Class 7"
                          ? "সপ্তম"
                          : selectedClass === "Class 8"
                            ? "অষ্টম"
                            : selectedClass === "Class 9"
                              ? "নবম"
                              : selectedClass === "Class 10"
                                ? "দশম"
                                : "এসএসসি"
                    } শ্রেণির কোনো পরীক্ষা পাওয়া যায়নি`
                  ) : (
                    "এই পরীক্ষার কোনো তথ্য পাওয়া যায়নি।"
                  )}
                </span>
              </div>
              {selectedClass !== "all" && !isAwaitingNextExam && (
                <button
                  onClick={() => setSelectedClass("all")}
                  className="mt-4 px-4 py-2 rounded-lg text-sm bangla font-medium
                    bg-[var(--color-active-bg)] border border-[var(--color-active-border)]
                    text-[var(--color-text)] hover:bg-[var(--color-active-border)]
                    transition-colors"
                >
                  সকল শ্রেণি দেখুন
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {displayExamNumbers.length > 0 && activeExamNumber && (
        <div className="relative">
          <ExamPagination
            examNumbers={displayExamNumbers}
            selected={activeExamNumber}
            onSelect={isGuest ? () => {} : setSelectedExamNumber}
          />
          {/* Guest intercept */}
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
