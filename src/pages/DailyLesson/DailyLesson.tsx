import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { BookPlus } from "lucide-react";
import toast from "react-hot-toast";
import axiosPublic from "../../hooks/axiosPublic";
import DailyLessonCard from "./DailyLessonCard";
import DatePicker from "../../components/common/Datepicker";
import Skeleton from "../../components/common/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { toBn, toBnDateStr } from "../../utility/Formatters";
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
import { CLASS_COLORS, DEFAULT_CLASS_COLOR } from "../../styles/colors";
import ClassFilterBtns from "../../components/common/ClassFilterBtns";

// ─── Constants ────────────────────────────────────────────────────────────────
const MANAGER_ROLES = ["principal", "admin", "owner"];
const STAFF_ROLES = ["teacher", "principal", "admin", "owner"];
const GUEST_PREVIEW_CLASS = "৬ষ্ঠ শ্রেণি";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const formatDate = (iso: string) => toBnDateStr(new Date(iso));
const todayBn = () => toBnDateStr(new Date());

const isSameDay = (iso: string, reference: Date) => {
  const d = new Date(iso);
  return (
    d.getDate() === reference.getDate() &&
    d.getMonth() === reference.getMonth() &&
    d.getFullYear() === reference.getFullYear()
  );
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
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ─── ClassGroupTitle ──────────────────────────────────────────────────────────
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
    className="relative mb-5 mt-8 overflow-hidden rounded bangla sm:mt-10"
  >
    <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2 border-y border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-4 py-3 sm:mt-5 sm:flex-row sm:gap-x-10 sm:px-5 sm:py-3.5">
      <h2 className="text-lg font-extrabold leading-tight text-[var(--color-text)] sm:text-xl md:text-2xl">
        {className}
      </h2>
      <span className="px-3 text-xs font-black text-[var(--color-gray)] sm:border-x sm:border-[var(--color-gray)]">
        {toBn(String(count))}টি পাঠ
      </span>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DailyLesson = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isGuest } = useGuestPreview();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerValue, setDatePickerValue] = useState<string>(todayBn());
  const [selectedClass, setSelectedClass] = useState<string>("all");
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

  // ─── Query ────────────────────────────────────────────────────────────────
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

  // ─── Derived data ─────────────────────────────────────────────────────────
  const activeDates = useMemo(() => {
    if (!data) return new Set<string>();
    const set = new Set<string>();
    data.forEach((lesson) => {
      const d = new Date(lesson.date);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [data]);

  const dateFilteredData = useMemo(
    () => (data ?? []).filter((l) => isSameDay(l.date, selectedDate)),
    [data, selectedDate],
  );

  const filteredData = useMemo(
    () =>
      selectedClass === "all"
        ? dateFilteredData
        : dateFilteredData.filter((l) => l.class === selectedClass),
    [dateFilteredData, selectedClass],
  );

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

  const totalLessonsForDate = dateFilteredData.length;

  // ─── Permissions ──────────────────────────────────────────────────────────
  const getLessonPermissions = (lesson: DailyLessonData) => {
    if (isGuest) return { canEdit: false, canDelete: false };
    if (isManager) return { canEdit: true, canDelete: true };
    const lessonSlug = resolveTeacherSlug(lesson.teacher, lesson.teacherSlug);
    const isOwn = userRole === "teacher" && lessonSlug === userSlug;
    return { canEdit: isOwn, canDelete: isOwn };
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
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

  // ─── Resets ───────────────────────────────────────────────────────────────
  const handleReset = () => {
    const today = new Date();
    setSelectedDate(today);
    setDatePickerValue(todayBn());
    setSelectedClass("all");
  };

  const getClassLabel = (classId: string) => {
    if (classId.includes("৬ষ্ঠ")) return "ষষ্ঠ";
    if (classId.includes("৭ম")) return "সপ্তম";
    if (classId.includes("৮ম")) return "অষ্টম";
    if (classId.includes("৯ম")) return "নবম";
    if (classId.includes("১০ম")) return "দশম";
    if (classId.includes("এসএসসি") || classId.includes("SSC")) return "এসএসসি";
    return classId;
  };

  // ─── Guest content ────────────────────────────────────────────────────────
  const buildGuestContent = () => {
    const class6Group = groupedByClass.find(
      ({ className }) => className === GUEST_PREVIEW_CLASS,
    );

    if (!class6Group) {
      return (
        <div>
          <p className="py-8 text-center text-sm text-[var(--color-gray)] bangla">
            আজকের ৬ষ্ঠ শ্রেণির কোনো পাঠ পাওয়া যায়নি।
          </p>
          <LoginPromptOverlay />
        </div>
      );
    }

    const { className, lessons } = class6Group;
    const color = CLASS_COLORS[className] ?? DEFAULT_CLASS_COLOR;

    return (
      <div>
        <ClassGroupTitle
          className={className}
          index={0}
          count={lessons.length}
        />
        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
          {lessons.slice(0, 2).map((lesson, i) => (
            <DailyLessonCard
              key={lesson._id}
              lesson={{ ...lesson, date: formatDate(lesson.date) }}
              index={i}
              classColor={color}
              canEdit={false}
              canDelete={false}
            />
          ))}
        </div>
        <LoginPromptOverlay />
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isLoading) return <Skeleton variant="daily-lesson" />;

  return (
    <div className="relative">
      {/* ── Header ── */}
      <header className="mb-6 px-3 text-center bangla sm:mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl font-bold text-[var(--color-text)] sm:text-2xl md:text-5xl"
        >
          আজকের পড়া
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="mt-2 text-sm font-medium text-[var(--color-gray)] sm:text-base md:text-2xl"
        >
          প্রতিদিনের পাঠ্যক্রম ও নির্দেশনা
        </motion.p>

        {/* ── Add lesson button (staff only) ── */}
        <AnimatePresence>
          {!isGuest && isStaff && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.94 }}
              transition={{ delay: 0.18, duration: 0.3, ease: "easeOut" }}
              className="mt-4 flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  /* navigate to add-lesson or open modal */
                }}
                className="group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] bangla sm:px-5 sm:text-base"
                style={{
                  border: "1.5px solid var(--color-brand)",
                  background: "var(--color-brand-soft)",
                  color: "var(--color-brand)",
                }}
              >
                <motion.span
                  className="flex items-center"
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 12 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <BookPlus size={16} strokeWidth={2.2} />
                </motion.span>
                পাঠ যোগ করুন
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Filter Bar ── */}
      <div className="mb-4 flex flex-col items-center justify-between gap-3 px-2 sm:mb-6 sm:gap-4 sm:px-3 md:flex-row md:px-0">
        {/* Date picker */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="w-full sm:w-72"
        >
          <DatePicker
            value={datePickerValue}
            onDateChange={(date) => {
              if (
                !date ||
                Number.isNaN(date.getTime()) ||
                date.getTime() === 0
              ) {
                handleReset();
                return;
              }
              setSelectedDate(date);
              setSelectedClass("all");
            }}
            onChange={(val) => setDatePickerValue(val)}
            placeholder="অন্য তারিখ বেছে নিন"
            maxDate={new Date()}
            activeDates={activeDates}
          />
        </motion.div>

        {/* Class filter buttons */}
        <ClassFilterBtns
          activeId={selectedClass}
          onChange={setSelectedClass}
          data={dateFilteredData}
          disabled={isGuest}
        />

        {/* Lesson count badge */}
        <AnimatePresence mode="wait">
          {totalLessonsForDate > 0 && (
            <motion.div
              key={`${selectedDate.toDateString()}-${selectedClass}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="shrink-0 rounded-full border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3 py-1.5 text-xs text-[var(--color-gray)] bangla sm:text-sm"
            >
              {isGuest ? (
                <>
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
                </>
              ) : selectedClass !== "all" ? (
                <>
                  <span className="font-bold text-[var(--color-text)]">
                    {toBn(String(filteredData.length))}
                  </span>
                  টি পাঠ (মোট{" "}
                  <span className="font-bold text-[var(--color-text)]">
                    {toBn(String(totalLessonsForDate))}
                  </span>
                  টির মধ্যে)
                </>
              ) : (
                <>
                  মোট{" "}
                  <span className="font-bold text-[var(--color-text)]">
                    {toBn(String(totalLessonsForDate))}
                  </span>
                  টি পাঠ
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Staff indicator ── */}
      {!isGuest && isStaff && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mx-2 mb-4 rounded-2xl border border-[var(--color-success-soft)] bg-[var(--color-success-soft)] px-3 py-2.5 sm:mx-0 sm:px-4 sm:py-3"
        >
          <p className="text-center text-xs text-[var(--color-success)] bangla sm:text-left sm:text-sm">
            {isManager
              ? "🔑 আপনি সকল পাঠ সম্পাদনা ও মুছে ফেলতে পারবেন"
              : "✏️ আপনি শুধু নিজের যোগ করা পাঠ সম্পাদনা ও মুছে ফেলতে পারবেন"}
          </p>
        </motion.div>
      )}

      {/* ── Content ── */}
      {isError ? (
        <div className="py-16 text-center text-xs text-[var(--color-danger)] bangla sm:py-20 sm:text-sm">
          ডেটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDate.toDateString()}-${selectedClass}`}
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
                groupedByClass.map(({ className, lessons }, groupIndex) => {
                  const color = CLASS_COLORS[className] ?? DEFAULT_CLASS_COLOR;
                  return (
                    <div key={className}>
                      <ClassGroupTitle
                        className={className}
                        index={groupIndex}
                        count={lessons.length}
                      />
                      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                        {lessons.map((lesson, i) => {
                          const { canEdit, canDelete } =
                            getLessonPermissions(lesson);
                          return (
                            <DailyLessonCard
                              key={lesson._id}
                              lesson={{
                                ...lesson,
                                date: formatDate(lesson.date),
                              }}
                              index={i}
                              classColor={color}
                              canEdit={canEdit}
                              canDelete={canDelete}
                              onEdit={
                                canEdit
                                  ? () => setEditTarget(lesson)
                                  : undefined
                              }
                              onDelete={
                                canDelete
                                  ? () => setDeleteTarget(lesson)
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )
            ) : isGuest ? (
              <div>
                <EmptyState
                  message="এই তারিখে কোনো পাঠ নেই"
                  action={
                    <Button onClick={handleReset}>আজকের পাঠ দেখুন</Button>
                  }
                />
                <LoginPromptOverlay />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 text-center sm:py-16"
              >
                <div className="mb-4 text-5xl">📭</div>
                <p className="mb-4 text-sm text-[var(--color-gray)] bangla sm:text-base">
                  {selectedClass !== "all"
                    ? `${getClassLabel(selectedClass)} শ্রেণির কোনো পাঠ পাওয়া যায়নি`
                    : "এই তারিখে কোনো পাঠ নেই"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedClass !== "all" && (
                    <Button
                      onClick={() => setSelectedClass("all")}
                      variant="secondary"
                      className="bangla"
                    >
                      সকল শ্রেণি দেখুন
                    </Button>
                  )}
                  <Button onClick={handleReset} className="bangla">
                    আজকের পাঠ দেখুন
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Modals ── */}
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
