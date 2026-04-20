import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { BookPlus, RotateCcw, CalendarDays, Filter } from "lucide-react";
import toast from "react-hot-toast";

import axiosPublic from "../../hooks/axiosPublic";

import DatePicker from "../../components/common/Datepicker";
import SelectInput from "../../components/common/SelectInput";
import Skeleton from "../../components/common/Skeleton";
import EmptyState from "../../components/common/Emptystate";
import Button from "../../components/common/Button";
import ClassFilterBtns from "../../components/common/ClassFilterBtns";

import { useAuth } from "../../context/AuthContext";
import { useGuestPreview } from "../../hooks/useGuestPreview";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";

import {
  formatBnDate,
  getTodayBnDate,
  isSameCalendarDay,
  toBn,
} from "../../utility/Formatters";
import {
  CLASS_ORDER,
  PRIVILEGED_ROLES,
  STAFF_DASHBOARD_ROLES,
  type UserRole,
} from "../../utility/Constants";
import {
  DeleteModal,
  EditModal,
  resolveTeacherSlug,
  type DailyLessonData,
} from "./DailyLessonUpdateModals";
import DailyLessonCard from "./DailyLessonCard";

const GUEST_PREVIEW_CLASS = "৬ষ্ঠ শ্রেণি";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTeacherDefault = (role?: UserRole, slug?: string) =>
  STAFF_DASHBOARD_ROLES.includes(role as UserRole) && slug ? slug : "all";

// ─── Animation Variants ───────────────────────────────────────────────────────
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

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

const loginPromptVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 6,
    transition: { duration: 0.15 },
  },
};

// ─── GuestLoginPrompt ─────────────────────────────────────────────────────────
const GuestLoginPrompt = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    variants={loginPromptVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="absolute inset-0 z-50 flex items-center justify-center rounded-xl backdrop-blur-[3px]"
    onClick={onClose}
  >
    <div className="absolute inset-0 rounded-xl bg-[var(--color-active-bg)]" />

    <motion.div
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 mx-4 w-full max-w-[260px] rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-bg)] p-5 shadow-xl"
    >
      <div className="mb-3 flex justify-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-active-bg)] text-2xl">
          🔒
        </div>
      </div>

      <p className="mb-1 text-center text-sm font-bold text-[var(--color-text)] bangla">
        লগইন প্রয়োজন
      </p>
      <p className="mb-4 text-center text-xs text-[var(--color-gray)] bangla">
        সকল ফিচার ব্যবহার করতে লগইন করুন
      </p>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] py-2 text-xs font-semibold text-[var(--color-gray)] transition-colors hover:text-[var(--color-text)] bangla"
        >
          বাতিল
        </button>
        <a
          href="/login"
          className="flex-1 rounded-xl bg-[var(--color-text-hover)] py-2 text-center text-xs font-bold text-white transition-opacity hover:opacity-90 bangla"
        >
          লগইন করুন
        </a>
      </div>
    </motion.div>
  </motion.div>
);

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
        {toBn(count)}টি পাঠ
      </motion.span>
    </div>
  </motion.div>
);

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

// ─── Main Component ───────────────────────────────────────────────────────────
const DailyLesson = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isGuest } = useGuestPreview();

  const userRole = (user?.role ?? "student") as UserRole;
  const userSlug = user?.slug ?? "";
  const isManager = PRIVILEGED_ROLES.includes(userRole);
  const isStaff = STAFF_DASHBOARD_ROLES.includes(userRole);

  const defaultTeacherFilter = useMemo(
    () => getTeacherDefault(userRole, userSlug),
    [userRole, userSlug],
  );

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerValue, setDatePickerValue] =
    useState<string>(getTodayBnDate());

  const [selectedClass, setSelectedClass] = useState<string>("all");

  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const prevDefaultRef = useRef("all");

  const [editTarget, setEditTarget] = useState<DailyLessonData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyLessonData | null>(
    null,
  );

  // ─── Guest prompt state ───
  const [guestPromptArea, setGuestPromptArea] = useState<
    "date" | "class" | "teacher" | null
  >(null);
  const closeGuestPrompt = useCallback(() => setGuestPromptArea(null), []);

  // ── Sync teacher filter when auth loads ──
  useEffect(() => {
    const prevDefault = prevDefaultRef.current;

    setSelectedTeacher((prev) =>
      prev === prevDefault ? defaultTeacherFilter : prev,
    );

    prevDefaultRef.current = defaultTeacherFilter;
  }, [defaultTeacherFilter]);

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

  // ─── Derived ──────────────────────────────────────────────────────────────
  const activeDates = useMemo(() => {
    if (!data) return new Set<string>();
    const set = new Set<string>();
    data.forEach((l) => {
      const d = new Date(l.date);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [data]);

  const dateFilteredData = useMemo(
    () => (data ?? []).filter((l) => isSameCalendarDay(l.date, selectedDate)),
    [data, selectedDate],
  );

  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();

    dateFilteredData.forEach((l) => {
      const name =
        typeof l.teacher === "object" && l.teacher?.name
          ? l.teacher.name
          : typeof l.teacher === "string"
            ? l.teacher
            : "";

      const slug = resolveTeacherSlug(l.teacher, l.teacherSlug);

      if (name && slug) map.set(slug, name);
    });

    if (userSlug && !map.has(userSlug)) {
      map.set(userSlug, user?.name || "আমার পাঠ");
    }

    return [
      { value: "all", label: "সকল শিক্ষক" },
      ...Array.from(map.entries()).map(([slug, name]) => ({
        value: slug,
        label: name,
      })),
    ];
  }, [dateFilteredData, userSlug, user?.name]);

  const filteredData = useMemo(() => {
    let result = dateFilteredData;
    if (selectedClass !== "all")
      result = result.filter((l) => l.class === selectedClass);
    if (selectedTeacher !== "all")
      result = result.filter(
        (l) => resolveTeacherSlug(l.teacher, l.teacherSlug) === selectedTeacher,
      );
    return result;
  }, [dateFilteredData, selectedClass, selectedTeacher]);

  const groupedByClass = useMemo(() => {
    const map = new Map<string, DailyLessonData[]>();
    filteredData.forEach((l) => {
      if (!map.has(l.class)) map.set(l.class, []);
      map.get(l.class)!.push(l);
    });
    map.forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    return Array.from(map.entries())
      .sort(([a], [b]) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99))
      .map(([className, lessons]) => ({ className, lessons }));
  }, [filteredData]);

  const totalLessonsForDate = dateFilteredData.length;

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (selectedClass !== "all") c++;
    if (selectedTeacher !== defaultTeacherFilter) c++;
    return c;
  }, [selectedClass, selectedTeacher, defaultTeacherFilter]);

  // ─── Permissions ──────────────────────────────────────────────────────────
  const getLessonPermissions = (lesson: DailyLessonData) => {
    if (isGuest) return { canEdit: false, canDelete: false };
    if (isManager) return { canEdit: true, canDelete: true };
    const slug = resolveTeacherSlug(lesson.teacher, lesson.teacherSlug);
    const isOwn = userRole === "teacher" && slug === userSlug;
    return { canEdit: isOwn, canDelete: isOwn };
  };

  // ─── Delete mutation ──────────────────────────────────────────────────────
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
    setSelectedDate(new Date());
    setDatePickerValue(getTodayBnDate());
    setSelectedClass("all");
    setSelectedTeacher(defaultTeacherFilter);
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
    const class6 = groupedByClass.find(
      ({ className }) => className === GUEST_PREVIEW_CLASS,
    );

    if (!class6) {
      return (
        <div>
          <p className="py-8 text-center text-sm text-[var(--color-gray)] bangla">
            আজকের ৬ষ্ঠ শ্রেণির কোনো পাঠ পাওয়া যায়নি।
          </p>
          <LoginPromptOverlay />
        </div>
      );
    }

    return (
      <div>
        <ClassGroupTitle
          className={class6.className}
          index={0}
          count={class6.lessons.length}
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3"
        >
          {class6.lessons.slice(0, 2).map((lesson, i) => (
            <motion.div key={lesson._id} variants={fadeUp}>
              <DailyLessonCard
                lesson={{ ...lesson, date: formatBnDate(lesson.date) }}
                index={i}
                canEdit={false}
                canDelete={false}
              />
            </motion.div>
          ))}
        </motion.div>
        <LoginPromptOverlay />
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isLoading) return <Skeleton variant="daily-lesson" />;

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* ── Header ── */}
      <header className="mb-8 px-3 text-center bangla sm:mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative inline-block"
        >
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl md:text-4xl lg:text-5xl">
            আজকের পড়া
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
          প্রতিদিনের পাঠ্যক্রম ও নির্দেশনা
        </motion.p>

        {/* Add lesson (staff) */}
        <AnimatePresence>
          {!isGuest && isStaff && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.94 }}
              transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
              className="mt-5 flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="group flex items-center gap-2.5 rounded-full border-[1.5px] border-[var(--color-text-hover)] bg-[var(--color-active-bg)] px-5 py-2.5 text-sm font-bold text-[var(--color-text-hover)] shadow-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-text-hover)] focus-visible:ring-offset-2 bangla sm:px-6 sm:text-base"
              >
                <motion.span
                  className="flex items-center"
                  whileHover={{ rotate: 12 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <BookPlus size={17} strokeWidth={2.2} />
                </motion.span>
                পাঠ যোগ করুন
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Filter Bar ── */}
      <motion.div
        variants={filterBarVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] p-3 shadow-sm sm:mb-8 sm:p-4 md:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          {/* ── Date picker ── */}
          <div className="relative min-w-0 flex-1 sm:max-w-[260px]">
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-gray)] bangla sm:text-xs">
              <CalendarDays size={12} className="opacity-60" />
              তারিখ
            </label>
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
                setSelectedTeacher(defaultTeacherFilter);
              }}
              onChange={(val) => setDatePickerValue(val)}
              placeholder="তারিখ বেছে নিন"
              maxDate={new Date()}
              activeDates={activeDates}
            />

            {/* Guest intercept */}
            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                onClick={() => setGuestPromptArea("date")}
                aria-label="লগইন প্রয়োজন"
              />
            )}
            <AnimatePresence>
              {isGuest && guestPromptArea === "date" && (
                <GuestLoginPrompt onClose={closeGuestPrompt} />
              )}
            </AnimatePresence>
          </div>

          {/* ── Teacher filter ── */}
          <div className="relative min-w-0 flex-1 sm:max-w-[260px]">
            <SelectInput
              label="শিক্ষক"
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              placeholder="শিক্ষক বাছুন"
              options={teacherOptions}
              disabled={isGuest || teacherOptions.length <= 1}
            />

            {/* Guest intercept */}
            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                onClick={() => setGuestPromptArea("teacher")}
                aria-label="লগইন প্রয়োজন"
              />
            )}
            <AnimatePresence>
              {isGuest && guestPromptArea === "teacher" && (
                <GuestLoginPrompt onClose={closeGuestPrompt} />
              )}
            </AnimatePresence>
          </div>

          {/* Badge + Reset */}
          <div className="flex items-end gap-2.5 sm:ml-auto">
            <AnimatePresence mode="wait">
              {totalLessonsForDate > 0 && (
                <motion.div
                  key={`${selectedDate.toDateString()}-${selectedClass}-${selectedTeacher}`}
                  variants={badgePulse}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="whitespace-nowrap rounded-full border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3.5 py-2 text-xs text-[var(--color-gray)] bangla sm:text-sm"
                >
                  {isGuest ? (
                    <>
                      ৬ষ্ঠ শ্রেণির{" "}
                      <span className="font-bold text-[var(--color-text)]">
                        {toBn(
                          groupedByClass.find(
                            ({ className }) =>
                              className === GUEST_PREVIEW_CLASS,
                          )?.lessons.length ?? 0,
                        )}
                      </span>
                      টি পাঠ
                    </>
                  ) : selectedClass !== "all" || selectedTeacher !== "all" ? (
                    <>
                      <span className="font-bold text-[var(--color-text)]">
                        {toBn(filteredData.length)}
                      </span>
                      টি পাঠ{" "}
                      <span className="hidden sm:inline">
                        (মোট{" "}
                        <span className="font-bold text-[var(--color-text)]">
                          {toBn(totalLessonsForDate)}
                        </span>
                        টি)
                      </span>
                    </>
                  ) : (
                    <>
                      মোট{" "}
                      <span className="font-bold text-[var(--color-text)]">
                        {toBn(totalLessonsForDate)}
                      </span>
                      টি পাঠ
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

        {/* ── Class filter pills ── */}
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
            <ClassFilterBtns
              activeId={selectedClass}
              onChange={setSelectedClass}
              data={dateFilteredData}
              disabled={isGuest}
            />

            {/* Guest intercept */}
            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                onClick={() => setGuestPromptArea("class")}
                aria-label="লগইন প্রয়োজন"
              />
            )}
            <AnimatePresence>
              {isGuest && guestPromptArea === "class" && (
                <GuestLoginPrompt onClose={closeGuestPrompt} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Staff indicator ── */}
      <AnimatePresence>
        {!isGuest && isStaff && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="mx-2 mb-5 overflow-hidden rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-4 py-3 sm:mx-0 sm:mb-6"
          >
            <p className="text-center text-xs text-[var(--color-text-hover)] bangla sm:text-left sm:text-sm">
              {isManager
                ? "🔑 আপনি সকল পাঠ সম্পাদনা ও মুছে ফেলতে পারবেন"
                : "✏️ আপনি শুধু নিজের যোগ করা পাঠ সম্পাদনা ও মুছে ফেলতে পারবেন"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      {isError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bangla sm:py-20"
        >
          <div className="mb-3 text-4xl">⚠️</div>
          <p className="text-sm text-[var(--color-gray)] sm:text-base">
            ডেটা লোড করতে সমস্যা হয়েছে।
          </p>
          <Button
            onClick={() => qc.refetchQueries({ queryKey: ["daily-lessons"] })}
            className="mt-4 bangla"
          >
            পুনরায় চেষ্টা করুন
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDate.toDateString()}-${selectedClass}-${selectedTeacher}`}
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
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {groupedByClass.map(({ className, lessons }, groupIndex) => (
                    <motion.div key={className} variants={fadeUp}>
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
                            <motion.div
                              key={lesson._id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: i * 0.04 + groupIndex * 0.08,
                                  duration: 0.35,
                                  ease: [0.22, 1, 0.36, 1],
                                },
                              }}
                            >
                              <DailyLessonCard
                                lesson={{
                                  ...lesson,
                                  date: formatBnDate(lesson.date),
                                }}
                                index={i}
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
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
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
                  📭
                </motion.div>
                <p className="mb-5 text-sm text-[var(--color-gray)] bangla sm:text-base">
                  {selectedTeacher !== "all"
                    ? "এই শিক্ষকের কোনো পাঠ পাওয়া যায়নি"
                    : selectedClass !== "all"
                      ? `${getClassLabel(selectedClass)} শ্রেণির কোনো পাঠ পাওয়া যায়নি`
                      : "এই তারিখে কোনো পাঠ নেই"}
                </p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {(selectedClass !== "all" || selectedTeacher !== "all") && (
                    <Button
                      onClick={() => {
                        setSelectedClass("all");
                        setSelectedTeacher("all");
                      }}
                      variant="secondary"
                      className="bangla"
                    >
                      সকল ফিল্টার সরান
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
