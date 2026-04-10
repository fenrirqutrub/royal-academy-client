import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import toast from "react-hot-toast";
import axiosPublic from "../../hooks/axiosPublic";
import DailyLessonCard from "./DailyLessonCard";
import DatePicker, {
  BN_DAYS_FULL,
  BN_MONTHS,
} from "../../components/common/Datepicker";
import Skeleton from "../../components/common/Skeleton";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CLASS_COLORS, DEFAULT_CLASS_COLOR, toBn } from "../../utility/shared";
import { CLASS_ORDER } from "../../utility/Constants";
import EmptyState from "../../components/common/Emptystate";
import Button from "../../components/common/Button";
import {
  DeleteModal,
  EditModal,
  resolveTeacherSlug,
  type DailyLessonData,
} from "./DailyLessonUpdateModals";
import { useGuestPreview } from "../../hooks/useGuestPreview";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";

// ─── Constants ────────────────────────────────────────────────────────────────
const MANAGER_ROLES = ["principal", "admin", "owner"];
const STAFF_ROLES = ["teacher", "principal", "admin", "owner"];

// The class shown to guests
const GUEST_PREVIEW_CLASS = "৬ষ্ঠ শ্রেণি";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(String(d.getDate()))} ${BN_MONTHS[d.getMonth()]} ${toBn(String(d.getFullYear()))}`;
};

const todayBn = () => {
  const d = new Date();
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(String(d.getDate()))} ${BN_MONTHS[d.getMonth()]}`;
};

const isSameDay = (iso: string, reference: Date) => {
  const d = new Date(iso);
  return (
    d.getDate() === reference.getDate() &&
    d.getMonth() === reference.getMonth() &&
    d.getFullYear() === reference.getFullYear()
  );
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
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: "easeOut" },
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

// ─── ClassGroupTitle ───────────────────────────────────────
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
        {toBn(String(count))}টি পাঠ
      </span>
    </div>
  </motion.div>
);

// ─── Enhanced Lesson Card ─────────────────────────────────────────────────────
const EnhancedLessonCard = ({
  lesson,
  index,
  classColor,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  lesson: DailyLessonData;
  index: number;
  classColor: typeof DEFAULT_CLASS_COLOR;
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
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-emerald-500/90 hover:bg-emerald-600 text-white shadow-lg transition-colors"
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

      <DailyLessonCard
        lesson={{
          ...lesson,
          date: formatDate(lesson.date),
        }}
        index={index}
        classColor={classColor}
      />
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────
const DailyLesson = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isGuest } = useGuestPreview();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerValue, setDatePickerValue] = useState<string>(todayBn());
  const [editTarget, setEditTarget] = useState<DailyLessonData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyLessonData | null>(
    null,
  );

  const userRole = user?.role ?? "student";
  const userSlug = user?.slug ?? "";
  const isManager = MANAGER_ROLES.includes(userRole);
  const isStaff = STAFF_ROLES.includes(userRole);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const { data, isLoading, isError } = useQuery<DailyLessonData[]>({
    queryKey: ["daily-lessons"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/daily-lesson");
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  const activeDates = useMemo(() => {
    if (!data) return new Set<string>();
    const set = new Set<string>();
    data.forEach((lesson) => {
      const d = new Date(lesson.date);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((lesson) => isSameDay(lesson.date, selectedDate));
  }, [data, selectedDate]);

  const groupedByClass = useMemo(() => {
    const map = new Map<string, DailyLessonData[]>();
    filteredData.forEach((lesson) => {
      if (!map.has(lesson.class)) map.set(lesson.class, []);
      map.get(lesson.class)!.push(lesson);
    });
    map.forEach((lessons) =>
      lessons.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    return Array.from(map.entries())
      .sort(([a], [b]) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99))
      .map(([className, lessons]) => ({ className, lessons }));
  }, [filteredData]);

  const canEditLesson = (lesson: DailyLessonData): boolean => {
    if (isGuest) return false;
    if (isManager) return true;
    const lessonSlug = resolveTeacherSlug(lesson.teacher, lesson.teacherSlug);
    if (userRole === "teacher" && lessonSlug === userSlug) return true;
    return false;
  };

  const canDeleteLesson = (lesson: DailyLessonData): boolean => {
    if (isGuest) return false;
    if (isManager) return true;
    const lessonSlug = resolveTeacherSlug(lesson.teacher, lesson.teacherSlug);
    if (userRole === "teacher" && lessonSlug === userSlug) return true;
    return false;
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosPublic.delete(`/api/daily-lesson/${id}`),
    onSuccess: () => {
      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["daily-lessons"] });
      setDeleteTarget(null);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message || err?.message || "মুছতে ব্যর্থ হয়েছে",
      ),
  });

  const handleReset = () => {
    setSelectedDate(new Date());
    setDatePickerValue(todayBn());
  };

  // ─── Guest Preview Builder ───────────────────────────────────────────────
  // Shows only Class 6, max 3 items, then LoginPromptOverlay
  const buildGuestContent = () => {
    // Find Class 6 group only
    const class6Group = groupedByClass.find(
      ({ className }) => className === GUEST_PREVIEW_CLASS,
    );

    if (!class6Group) {
      // Class 6 has no lessons today → still show overlay
      return (
        <div>
          <p className="text-[var(--color-gray)] text-center py-8 bangla text-sm">
            আজকের ৬ষ্ঠ শ্রেণির কোনো পাঠ পাওয়া যায়নি।
          </p>
          <LoginPromptOverlay />
        </div>
      );
    }

    const { className, lessons } = class6Group;
    const color = CLASS_COLORS[className] ?? DEFAULT_CLASS_COLOR;

    // Take at most previewLimit (2) items

    const visibleLessons = lessons.slice(0, 2);

    return (
      <div>
        <ClassGroupTitle
          className={className}
          index={0}
          count={lessons.length}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {visibleLessons.map((lesson, i) => (
            <EnhancedLessonCard
              key={lesson._id}
              lesson={lesson}
              index={i}
              classColor={color}
              canEdit={false}
              canDelete={false}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
        {/* Login prompt below the preview cards */}
        <LoginPromptOverlay />
      </div>
    );
  };

  if (isLoading) return <Skeleton variant="daily-lesson" />;

  return (
    <div className="relative">
      {/* Header */}
      <header className="text-center bangla mb-6 sm:mb-8 px-3">
        <motion.h1
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl sm:text-2xl md:text-5xl font-bold text-[var(--color-text)]"
        >
          আজকের পড়া
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="text-sm sm:text-base md:text-2xl font-medium text-[var(--color-gray)] mt-2"
        >
          প্রতিদিনের পাঠ্যক্রম ও নির্দেশনা
        </motion.p>
      </header>

      {/* Date Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="flex flex-wrap items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-0 mb-4 sm:mb-6 bangla"
      >
        <div className="w-full sm:w-72 relative">
          <DatePicker
            value={datePickerValue}
            onDateChange={(date) => setSelectedDate(date)}
            onChange={(val) => setDatePickerValue(val)}
            placeholder="অন্য তারিখ বেছে নিন"
            maxDate={new Date()}
            activeDates={activeDates}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* guests only see Class 6 count, logged-in see full count */}
          {filteredData.length > 0 && (
            <motion.span
              key={selectedDate.toDateString()}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="ml-auto text-xs sm:text-sm text-[var(--color-gray)]"
            >
              {isGuest ? (
                <div>
                  ৬ষ্ঠ শ্রেণির{" "}
                  <span className="font-bold text-[var(--color-text)]">
                    {toBn(
                      String(
                        groupedByClass.find(
                          ({ className }) => className === GUEST_PREVIEW_CLASS,
                        )?.lessons.length ?? 0,
                      ),
                    )}
                  </span>
                  টি পাঠ
                </div>
              ) : (
                <div>
                  মোট{" "}
                  <span className="font-bold text-[var(--color-text)]">
                    {toBn(String(filteredData.length))}
                  </span>
                  টি পাঠ
                </div>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Staff indicator — logged in staff only */}
      {!isGuest && isStaff && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mb-4 mx-2 sm:mx-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
        >
          <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 bangla text-center sm:text-left">
            {isManager
              ? "🔑 আপনি সকল পাঠ সম্পাদনা ও মুছে ফেলতে পারবেন"
              : "✏️ আপনি শুধু নিজের যোগ করা পাঠ সম্পাদনা ও মুছে ফেলতে পারবেন"}
          </p>
        </motion.div>
      )}

      {/* Content */}
      {isError ? (
        <div className="text-center py-16 sm:py-20 text-rose-400 text-xs sm:text-sm bangla">
          ডেটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate.toDateString()}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="px-2 sm:px-3 md:px-0"
          >
            {groupedByClass.length > 0 ? (
              // ✅ Guest → preview only, logged-in → full content
              isGuest ? (
                buildGuestContent()
              ) : (
                groupedByClass.map(({ className, lessons }, groupIndex) => {
                  const color = CLASS_COLORS[className] ?? DEFAULT_CLASS_COLOR;
                  return (
                    <div key={className}>
                      <ClassGroupTitle
                        className={className}
                        index={groupIndex}
                        count={lessons.length}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        {lessons.map((lesson, i) => (
                          <EnhancedLessonCard
                            key={lesson._id}
                            lesson={lesson}
                            index={i}
                            classColor={color}
                            canEdit={canEditLesson(lesson)}
                            canDelete={canDeleteLesson(lesson)}
                            onEdit={() => setEditTarget(lesson)}
                            onDelete={() => setDeleteTarget(lesson)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )
            ) : // Empty state — guests also see this with overlay
            isGuest ? (
              <div>
                <EmptyState
                  message="এই তারিখে কোনো পাঠ নেই"
                  action={
                    <Button onClick={handleReset} className="btn">
                      আজকের পাঠ দেখুন
                    </Button>
                  }
                />
                <LoginPromptOverlay />
              </div>
            ) : (
              <EmptyState
                message="এই তারিখে কোনো পাঠ নেই"
                action={
                  <Button onClick={handleReset} className="btn">
                    আজকের পাঠ দেখুন
                  </Button>
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Edit / Delete Modals — logged-in users only */}
      <AnimatePresence>
        {editTarget && !isGuest && (
          <EditModal
            key="edit"
            record={editTarget}
            onClose={() => setEditTarget(null)}
            onSuccess={() =>
              qc.invalidateQueries({ queryKey: ["daily-lessons"] })
            }
          />
        )}
        {deleteTarget && !isGuest && (
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

export default DailyLesson;
