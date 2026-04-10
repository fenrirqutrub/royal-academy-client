import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import toast from "react-hot-toast";
import WeeklyExamCard from "./WeeklyExamCard";
import ExamPagination from "../../components/common/ExamPagination";
import axiosPublic from "../../hooks/axiosPublic";
import Marquee from "react-fast-marquee";
import Skeleton from "../../components/common/Skeleton";
import { BN_DAYS_FULL, BN_MONTHS } from "../../components/common/Datepicker";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  DeleteModal,
  EditModal,
  type WeeklyExamData,
} from "./WeeklyExamUpdateModals";
import { useGuestPreview } from "../../hooks/useGuestPreview";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NormalizedImage {
  url: string;
  publicId: string;
}

type RawImage = string | { imageUrl?: string; url?: string; publicId?: string };

// ─── Constants ────────────────────────────────────────────────────────────────
const MANAGER_ROLES = ["principal", "admin", "owner"];
const STAFF_ROLES = ["teacher", "principal", "admin", "owner"];

const CLASS_ORDER: Record<string, number> = {
  "৬ষ্ঠ শ্রেণি": 1,
  "৭ম শ্রেণি": 2,
  "৮ম শ্রেণি": 3,
  "৯ম শ্রেণি": 4,
  "১০ম শ্রেণি": 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toBn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const formatCreatedAt = (iso: string): string => {
  const d = new Date(iso);
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBn(d.getFullYear())}`;
};

const normalizeImages = (images: RawImage[]): NormalizedImage[] =>
  images.map((img) => {
    if (typeof img === "string") return { url: img, publicId: "" };
    return { url: img.imageUrl ?? img.url ?? "", publicId: img.publicId ?? "" };
  });

const classOrder = (cls: string) => CLASS_ORDER[cls] ?? 99;

const sortExamNumbers = (nums: string[]): string[] =>
  [...nums].sort((a, b) => Number(a) - Number(b));

// ─── Custom Hook for Responsive Guest Limit ───────────────────────────────────
const useResponsiveGuestLimit = (): number => {
  const [limit, setLimit] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640 ? 2 : 3;
    }
    return 3;
  });

  useEffect(() => {
    const handleResize = () => {
      setLimit(window.innerWidth < 640 ? 2 : 3);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return limit;
};

// ─── Animation Variants ───────────────────────────────────────────────────────
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

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

const actionButtonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
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

// ─── Enhanced Exam Card ───────────────────────────────────────────────────────
const EnhancedExamCard = ({
  exam,
  normalizedImages,
  date,
  index,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  exam: WeeklyExamData;
  normalizedImages: NormalizedImage[];
  date: string;
  index: number;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const showActions = canEdit || canDelete;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative group"
    >
      {showActions && (
        <motion.div
          variants={actionButtonVariants}
          initial="hidden"
          animate="visible"
          className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex items-center gap-1 sm:gap-1.5"
        >
          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-violet-500/90 hover:bg-violet-600 text-white shadow-lg transition-colors"
              title="সম্পাদনা করুন"
            >
              <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </motion.button>
          )}
          {canDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-rose-500/90 hover:bg-rose-600 text-white shadow-lg transition-colors"
              title="মুছে ফেলুন"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </motion.button>
          )}
        </motion.div>
      )}

      <WeeklyExamCard
        exam={{
          ...exam,
          date,
          images: normalizedImages,
        }}
        index={index}
      />
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const WeeklyExam = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isGuest } = useGuestPreview();
  const responsiveLimit = useResponsiveGuestLimit();

  const [selectedExamNumber, setSelectedExamNumber] = useState<string | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<WeeklyExamData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeeklyExamData | null>(null);

  const userRole = user?.role ?? "student";
  const userSlug = user?.slug ?? "";
  const isManager = MANAGER_ROLES.includes(userRole);
  const isStaff = STAFF_ROLES.includes(userRole);

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

  const examNumbers = useMemo(() => {
    if (!data) return [];
    const unique = new Set(data.map((e) => e.ExamNumber));
    return sortExamNumbers(Array.from(unique));
  }, [data]);

  const activeExamNumber = useMemo(() => {
    if (selectedExamNumber && examNumbers.includes(selectedExamNumber))
      return selectedExamNumber;
    return examNumbers[examNumbers.length - 1] ?? null;
  }, [examNumbers, selectedExamNumber]);

  const groupedByClass = useMemo(() => {
    if (!data || !activeExamNumber) return [];
    const filtered = data.filter((e) => e.ExamNumber === activeExamNumber);
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
      .sort(([a], [b]) => classOrder(a) - classOrder(b))
      .map(([className, exams]) => ({ className, exams }));
  }, [data, activeExamNumber]);

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

  // ✅ Guest preview content builder
  const buildGuestContent = () => {
    let cardCount = 0;
    const elements: React.ReactNode[] = [];

    for (const { className, exams } of groupedByClass) {
      if (cardCount >= responsiveLimit) break;

      const remaining = responsiveLimit - cardCount;
      const visibleExams = exams.slice(0, remaining);
      cardCount += visibleExams.length;

      elements.push(
        <div key={className}>
          <ClassGroupTitle
            className={className}
            index={elements.length}
            count={exams.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
            {visibleExams.map((exam, i) => (
              <EnhancedExamCard
                key={exam._id}
                exam={exam}
                normalizedImages={normalizeImages(exam.images)}
                date={formatCreatedAt(exam.createdAt)}
                index={i}
                canEdit={false}
                canDelete={false}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>,
      );
    }

    return (
      <div className="relative">
        {elements}
        <LoginPromptOverlay />
      </div>
    );
  };

  if (isLoading) return <Skeleton variant="daily-lesson" />;

  if (isError) {
    return (
      <div className="text-center py-20 text-rose-400 text-sm bangla">
        ডেটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <header className="text-center bangla my-4 px-4">
        <h1 className="text-xl sm:text-2xl md:text-5xl font-bold text-[var(--color-text)]">
          সাপ্তাহিক পরীক্ষার ধারণা
        </h1>
        <p className="text-base sm:text-lg md:text-3xl font-bold text-[var(--color-gray)] my-2 sm:my-3">
          সাপ্তাহিক পরীক্ষা নং - {toBn(activeExamNumber ?? "")}
        </p>
      </header>

      {/* Marquee */}
      <div className="flex items-stretch rounded overflow-hidden bangla mt-6 sm:mt-10 mx-2 sm:mx-0">
        <div className="shrink-0 flex items-center justify-center px-3 sm:px-5 bg-[var(--color-text)]">
          <span className="text-[var(--color-bg)] font-black text-sm sm:text-lg md:text-xl tracking-wide">
            বিজ্ঞপ্তি
          </span>
        </div>
        <div className="flex-1 bg-[var(--color-active-bg)] overflow-hidden py-1 md:py-2 flex items-center">
          <Marquee speed={40} gradient={false} pauseOnHover>
            <span className="flex items-center text-[var(--color-text)] text-sm sm:text-lg md:text-xl font-medium px-4 sm:px-6">
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
          className="mt-4 sm:mt-6 mb-4 mx-2 sm:mx-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
        >
          <p className="text-xs sm:text-sm text-violet-700 dark:text-violet-300 bangla text-center sm:text-left">
            {isManager
              ? "🔑 আপনি সকল পরীক্ষা সম্পাদনা ও মুছে ফেলতে পারবেন"
              : "✏️ আপনি শুধু নিজের যোগ করা পরীক্ষা সম্পাদনা ও মুছে ফেলতে পারবেন"}
          </p>
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeExamNumber}
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
                    {exams.map((exam, i) => (
                      <EnhancedExamCard
                        key={exam._id}
                        exam={exam}
                        normalizedImages={normalizeImages(exam.images)}
                        date={formatCreatedAt(exam.createdAt)}
                        index={i}
                        canEdit={canEditExam(exam)}
                        canDelete={canDeleteExam(exam)}
                        onEdit={() => setEditTarget(exam)}
                        onDelete={() => setDeleteTarget(exam)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )
          ) : (
            <p className="text-[var(--color-gray)] text-center py-12 sm:py-16 bangla text-sm sm:text-base">
              এই পরীক্ষার কোনো তথ্য পাওয়া যায়নি।
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {examNumbers.length > 0 && activeExamNumber && (
        <ExamPagination
          examNumbers={examNumbers}
          selected={activeExamNumber}
          onSelect={isGuest ? () => {} : setSelectedExamNumber}
        />
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
    </div>
  );
};

export default WeeklyExam;
