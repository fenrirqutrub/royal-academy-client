// src/pages/dashboard/home/MonthlyReport.tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ClipboardList,
  Check,
  X,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import axiosPublic from "../../../hooks/axiosPublic";
import { useAuth } from "../../../context/AuthContext";
import Skeleton from "../../../components/common/Skeleton";

/* ══════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════ */
interface WeeklyExamDoc {
  _id: string;
  teacherSlug: string;
  createdAt: string;
  ExamNumber: string;
  class: string;
  subject: string;
}

interface DailyLessonDoc {
  _id: string;
  teacherSlug: string;
  createdAt: string;
  class: string;
  subject: string;
  chapterNumber?: string;
}

interface TeacherDoc {
  slug: string;
  name: string;
  role?: string;
}

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];
const BN_DAYS_SHORT = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

const toBn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const getDaysOfMonth = (year: number, month: number): Date[] => {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
};

const getWeeksOfMonth = (year: number, month: number) => {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const current = new Date(firstDay);
  current.setDate(current.getDate() - current.getDay());
  let weekNum = 1;
  while (current <= lastDay) {
    const sun = new Date(current);
    const sat = new Date(current);
    sat.setDate(sat.getDate() + 6);
    if (sat >= firstDay && sun <= lastDay) {
      weeks.push({
        start: new Date(sun),
        end: new Date(new Date(sat).setHours(23, 59, 59, 999)),
        label: `সপ্তাহ ${toBn(weekNum)}`,
      });
      weekNum++;
    }
    current.setDate(current.getDate() + 7);
  }
  return weeks;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isInRange = (dateStr: string, start: Date, end: Date) => {
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

// Friday = holiday. Saturday = exam day (working).
const isFriday = (d: Date) => d.getDay() === 5;
const isSaturday = (d: Date) => d.getDay() === 6;
const isHoliday = (d: Date) => isFriday(d);

/* ══════════════════════════════════════════════════
   ANIMATION VARIANTS
══════════════════════════════════════════════════ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.012,
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  }),
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

/* ══════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════ */
const StatCard = ({
  icon: Icon,
  value,
  label,
  index = 0,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  index?: number;
}) => (
  <motion.div
    custom={index}
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    className="rounded-2xl p-4 text-center border border-[var(--color-active-border)] bg-[var(--color-active-bg)]"
  >
    <Icon className="w-4 h-4 mx-auto mb-2 text-[var(--color-gray)]" />
    <p className="text-2xl font-black tabular-nums text-[var(--color-text)]">
      {toBn(value)}
    </p>
    <p className="text-xs mt-1 bangla text-[var(--color-gray)]">{label}</p>
  </motion.div>
);

/* ══════════════════════════════════════════════════
   DAILY CALENDAR GRID
══════════════════════════════════════════════════ */
const DailyCalendar = ({
  year,
  month,
  lessons,
}: {
  year: number;
  month: number;
  lessons: DailyLessonDoc[];
}) => {
  const days = getDaysOfMonth(year, month);
  const firstDayOfWeek = days[0].getDay();
  const emptyCells = Array(firstDayOfWeek).fill(null);
  const lessonDaySet = new Set(
    lessons.map((l) => new Date(l.createdAt).getDate()),
  );
  const totalDone = lessonDaySet.size;
  const workingDays = days.filter((d) => !isHoliday(d)).length;
  const today = new Date();
  const pct = workingDays ? Math.round((totalDone / workingDays) * 100) : 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl overflow-hidden border border-[var(--color-active-border)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-active-bg)] border-b border-[var(--color-active-border)]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--color-gray)]" />
          <span className="text-sm font-semibold bangla text-[var(--color-text)]">
            দৈনিক পড়া — {BANGLA_MONTHS[month]}
          </span>
        </div>
        <span className="text-xs bangla text-[var(--color-gray)]">
          {toBn(totalDone)}/{toBn(workingDays)} দিন
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--color-active-bg)]">
        <motion.div
          className="h-full bg-[var(--color-text)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-3 pb-1">
        {BN_DAYS_SHORT.map((d) => (
          <div
            key={d}
            className={`text-center text-[10px] font-semibold py-1 bangla select-none
              ${d === "শুক্র" ? "text-red-400" : d === "শনি" ? "text-blue-400" : "text-[var(--color-gray)]"}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
        {emptyCells.map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {days.map((day, idx) => {
          const d = day.getDate();
          const done = lessonDaySet.has(d);
          const fri = isFriday(day);
          const sat = isSaturday(day);
          const isToday = sameDay(day, today);

          return (
            <motion.div
              key={d}
              custom={idx}
              variants={popIn}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.12 }}
              className={`flex flex-col items-center justify-center rounded-lg py-1.5 gap-0.5 cursor-default
                ${done ? "bg-[var(--color-text)]" : ""}
                ${fri ? "opacity-40" : ""}
                ${isToday && !done ? " outline-1 outline-[var(--color-active-border)]" : ""}
              `}
            >
              <span
                className={`text-[11px] font-semibold bangla tabular-nums leading-none
                  ${done ? "text-[var(--color-bg)]" : fri ? "text-red-400" : sat ? "text-blue-400" : "text-[var(--color-text)]"}`}
              >
                {toBn(d)}
              </span>
              {done ? (
                <Check className="w-2.5 h-2.5 text-[var(--color-bg)] opacity-60" />
              ) : fri ? (
                <span className="text-[7px] bangla leading-none text-red-400">
                  ছুটি
                </span>
              ) : sat ? (
                <span className="text-[7px] bangla leading-none text-blue-400">
                  পরী
                </span>
              ) : (
                <X className="w-2.5 h-2.5 text-[var(--color-gray)] opacity-25" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-active-border)] flex-wrap">
        <span className="flex items-center gap-1.5 text-[10px] bangla text-[var(--color-gray)]">
          <Check className="w-3 h-3 text-[var(--color-text)]" /> পড়া দিয়েছেন
        </span>
        <span className="flex items-center gap-1.5 text-[10px] bangla text-red-400">
          <X className="w-3 h-3" /> শুক্র = ছুটি
        </span>
        <span className="flex items-center gap-1.5 text-[10px] bangla text-blue-400">
          <ClipboardList className="w-3 h-3" /> শনি = পরীক্ষার দিন
        </span>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════
   WEEKLY EXAM TABLE
══════════════════════════════════════════════════ */
const WeeklyExamTable = ({
  weeks,
  exams,
  month,
  baseDelay = 0,
}: {
  weeks: { start: Date; end: Date; label: string }[];
  exams: WeeklyExamDoc[];
  month: number;
  baseDelay?: number;
}) => {
  const totalDone = weeks.filter((w) =>
    exams.some((e) => isInRange(e.createdAt, w.start, w.end)),
  ).length;
  const pct = weeks.length ? Math.round((totalDone / weeks.length) * 100) : 0;

  return (
    <motion.div
      variants={fadeUp}
      custom={1}
      initial="hidden"
      animate="visible"
      className="rounded-2xl overflow-hidden border border-[var(--color-active-border)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-active-bg)] border-b border-[var(--color-active-border)]">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[var(--color-gray)]" />
          <span className="text-sm font-semibold bangla text-[var(--color-text)]">
            সাপ্তাহিক পরীক্ষা — {BANGLA_MONTHS[month]}
          </span>
        </div>
        <span className="text-xs bangla text-[var(--color-gray)]">
          {toBn(totalDone)}/{toBn(weeks.length)} সপ্তাহ
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--color-active-bg)]">
        <motion.div
          className="h-full bg-[var(--color-text)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: baseDelay + 0.35,
          }}
        />
      </div>

      {/* Week rows */}
      <div className="divide-y divide-[var(--color-active-border)]">
        {weeks.map((w, i) => {
          const done = exams.some((e) =>
            isInRange(e.createdAt, w.start, w.end),
          );
          const weekExams = exams.filter((e) =>
            isInRange(e.createdAt, w.start, w.end),
          );
          const sunStr = w.start.toLocaleDateString("bn-BD", {
            day: "numeric",
            month: "short",
          });
          const satStr = new Date(w.end).toLocaleDateString("bn-BD", {
            day: "numeric",
            month: "short",
          });

          return (
            <motion.div
              key={i}
              custom={i}
              variants={slideRight}
              initial="hidden"
              animate="visible"
              whileHover={{ backgroundColor: "var(--color-active-bg)" }}
              className="px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    animate={done ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0
                      ${
                        done
                          ? "bg-[var(--color-text)]"
                          : "bg-[var(--color-active-bg)] border border-[var(--color-active-border)]"
                      }`}
                  >
                    {done ? (
                      <Check className="w-3 h-3 text-[var(--color-bg)]" />
                    ) : (
                      <X className="w-3 h-3 text-[var(--color-gray)] opacity-30" />
                    )}
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium bangla text-[var(--color-text)]">
                      {w.label}
                    </p>
                    <p className="text-xs bangla mt-0.5 text-[var(--color-gray)]">
                      রবি {sunStr} – শনি {satStr}
                    </p>
                  </div>
                </div>
                {done && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs px-2 py-0.5 rounded-full bangla shrink-0 bg-[var(--color-active-bg)] border border-[var(--color-active-border)] text-[var(--color-gray)]"
                  >
                    {toBn(weekExams.length)}টি
                  </motion.span>
                )}
              </div>

              {/* Exam details */}
              <AnimatePresence>
                {done && weekExams.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 ml-8 space-y-1 overflow-hidden"
                  >
                    {weekExams.map((e) => (
                      <p
                        key={e._id}
                        className="text-xs bangla text-[var(--color-gray)]"
                      >
                        ·{" "}
                        {[
                          e.class,
                          e.subject,
                          e.ExamNumber ? `#${e.ExamNumber}` : "",
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════
   TEACHER OWN REPORT
   — only shows the logged-in teacher's own data
══════════════════════════════════════════════════ */
const TeacherOwnReport = ({
  slug,
  year,
  month,
  weeks,
}: {
  slug: string;
  year: number;
  month: number;
  weeks: { start: Date; end: Date; label: string }[];
}) => {
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["report-my-exams", slug, year, month],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/weekly-exams");
      return data as WeeklyExamDoc[];
    },
    enabled: !!slug,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["report-my-lessons", slug, year, month],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/daily-lesson");
      return (data?.data ?? data) as DailyLessonDoc[];
    },
    enabled: !!slug,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const isLoading = examsLoading || lessonsLoading;

  // Show skeleton while loading
  if (isLoading) return <Skeleton variant="monthly-report" isManager={false} />;

  // Filter strictly to this teacher + this month
  const monthLessons = lessons.filter((l) => {
    const d = new Date(l.createdAt);
    return (
      l.teacherSlug === slug &&
      d.getFullYear() === year &&
      d.getMonth() === month
    );
  });
  const monthExams = exams.filter((e) => {
    const d = new Date(e.createdAt);
    return (
      e.teacherSlug === slug &&
      d.getFullYear() === year &&
      d.getMonth() === month
    );
  });

  const days = getDaysOfMonth(year, month);
  const workingDays = days.filter((d) => !isHoliday(d)).length;
  const lessonDays = new Set(
    monthLessons.map((l) => new Date(l.createdAt).getDate()),
  ).size;
  const examWeeks = weeks.filter((w) =>
    monthExams.some((e) => isInRange(e.createdAt, w.start, w.end)),
  ).length;
  const score = Math.round(
    (lessonDays / (workingDays || 1)) * 50 +
      (examWeeks / (weeks.length || 1)) * 50,
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={BookOpen}
          value={lessonDays}
          label={`পড়া (${toBn(workingDays)} দিনে)`}
          index={0}
        />
        <StatCard
          icon={ClipboardList}
          value={examWeeks}
          label={`Exam (${toBn(weeks.length)} সপ্তাহে)`}
          index={1}
        />
        <StatCard icon={TrendingUp} value={score} label="স্কোর %" index={2} />
      </div>

      {/* Calendar + exam table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DailyCalendar year={year} month={month} lessons={monthLessons} />
        <WeeklyExamTable
          weeks={weeks}
          exams={monthExams}
          month={month}
          baseDelay={0.1}
        />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MANAGER REPORT — shows every teacher's data
══════════════════════════════════════════════════ */
const ManagerReport = ({
  year,
  month,
  weeks,
}: {
  year: number;
  month: number;
  weeks: { start: Date; end: Date; label: string }[];
}) => {
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["report-teachers", year, month],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/users");
      return data as TeacherDoc[];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["report-all-exams", year, month],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/weekly-exams");
      return data as WeeklyExamDoc[];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["report-all-lessons", year, month],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/daily-lesson");
      return (data?.data ?? data) as DailyLessonDoc[];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const isLoading = teachersLoading || examsLoading || lessonsLoading;

  // Show skeleton while loading
  if (isLoading) return <Skeleton variant="monthly-report" isManager={true} />;

  // Exclude owner and student
  const filteredTeachers = teachers.filter((t) => {
    const role = t.role?.toLowerCase();
    return role !== "owner" && role !== "student";
  });

  const monthExams = exams.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const monthLessons = lessons.filter((l) => {
    const d = new Date(l.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const days = getDaysOfMonth(year, month);
  const workingDays = days.filter((d) => !isHoliday(d)).length;

  if (!filteredTeachers.length)
    return (
      <p className="text-center py-10 bangla text-[var(--color-gray)]">
        কোনো শিক্ষক পাওয়া যায়নি
      </p>
    );

  const examSubmitted = new Set(monthExams.map((e) => e.teacherSlug)).size;
  const lessonSubmitted = new Set(monthLessons.map((l) => l.teacherSlug)).size;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          value={filteredTeachers.length}
          label="মোট শিক্ষক"
          index={0}
        />
        <StatCard
          icon={ClipboardList}
          value={examSubmitted}
          label="Exam জমা"
          index={1}
        />
        <StatCard
          icon={BookOpen}
          value={lessonSubmitted}
          label="পড়া জমা"
          index={2}
        />
      </div>

      {/* Per-teacher cards */}
      <div className="space-y-5">
        {filteredTeachers.map((teacher, tIdx) => {
          const tExams = monthExams.filter(
            (e) => e.teacherSlug === teacher.slug,
          );
          const tLessons = monthLessons.filter(
            (l) => l.teacherSlug === teacher.slug,
          );
          const lessonDays = new Set(
            tLessons.map((l) => new Date(l.createdAt).getDate()),
          ).size;
          const examWeeks = weeks.filter((w) =>
            tExams.some((e) => isInRange(e.createdAt, w.start, w.end)),
          ).length;
          const score = Math.round(
            (lessonDays / (workingDays || 1)) * 50 +
              (examWeeks / (weeks.length || 1)) * 50,
          );

          return (
            <motion.div
              key={teacher.slug}
              custom={tIdx}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-2xl overflow-hidden border border-[var(--color-active-border)]"
            >
              {/* Teacher name row */}
              <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-active-bg)] border-b border-[var(--color-active-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 bg-[var(--color-bg)] border border-[var(--color-active-border)] text-[var(--color-text)]">
                    {teacher.name.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold bangla text-[var(--color-text)]">
                    {teacher.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs bangla text-[var(--color-gray)]">
                  <span>
                    {toBn(lessonDays)}/{toBn(workingDays)} পড়া
                  </span>
                  <span>
                    {toBn(examWeeks)}/{toBn(weeks.length)} Exam
                  </span>
                  <span className="font-bold text-[var(--color-text)]">
                    {toBn(score)}%
                  </span>
                  {/* Week dots */}
                  <div className="hidden sm:flex items-center gap-1">
                    {weeks.map((w, wi) => (
                      <motion.div
                        key={wi}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: tIdx * 0.05 + wi * 0.04,
                          type: "spring",
                          stiffness: 300,
                        }}
                        className={`w-2 h-2 rounded-full
                          ${
                            tExams.some((e) =>
                              isInRange(e.createdAt, w.start, w.end),
                            )
                              ? "bg-[var(--color-text)]"
                              : "bg-[var(--color-active-border)] opacity-60"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar + exam table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-active-border)]">
                <div className="p-4">
                  <DailyCalendar year={year} month={month} lessons={tLessons} />
                </div>
                <div className="p-4">
                  <WeeklyExamTable
                    weeks={weeks}
                    exams={tExams}
                    month={month}
                    baseDelay={tIdx * 0.04}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
const MonthlyReport = () => {
  const { user } = useAuth();
  const role = user?.role ?? "teacher";
  const slug = user?.slug ?? "";
  const isManager = ["principal", "admin", "owner"].includes(role);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const weeks = getWeeksOfMonth(year, month);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const days = getDaysOfMonth(year, month);
  const workingDays = days.filter((d) => !isHoliday(d)).length;
  const saturdayCount = days.filter((d) => isSaturday(d)).length;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-10 lg:py-14 max-w-5xl mx-auto">
        {/* ── HEADER ── */}
        <motion.div
          className="mt-10 lg:mt-0 mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-xs bangla mb-4 opacity-60 hover:opacity-100 transition-opacity text-[var(--color-gray)]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            ড্যাশবোর্ড
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bangla text-[var(--color-text)]">
                মাসিক রিপোর্ট
              </h1>
              <p className="mt-1 text-sm bangla text-[var(--color-gray)]">
                {isManager ? "সকল শিক্ষকের জমা ও মিস" : "আপনার জমা ও মিস"}
              </p>
            </div>

            {/* Month navigator */}
            <motion.div
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 shrink-0 bg-[var(--color-active-bg)] border border-[var(--color-active-border)]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.1,
                duration: 0.35,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-[var(--color-gray)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${year}-${month}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-semibold bangla min-w-[7.5rem] text-center text-[var(--color-text)]"
                >
                  {BANGLA_MONTHS[month]} {toBn(year)}
                </motion.span>
              </AnimatePresence>
              <button
                onClick={nextMonth}
                disabled={isCurrentMonth}
                className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-25 text-[var(--color-gray)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Legend */}
          <motion.div
            className="flex items-center gap-4 mt-4 text-xs bangla flex-wrap text-[var(--color-gray)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {BANGLA_MONTHS[month]} {toBn(year)} — {toBn(weeks.length)}টি
              সপ্তাহ, {toBn(workingDays)}টি কার্যদিবস
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--color-text)]" /> জমা
              দিয়েছেন
            </span>
            <span className="flex items-center gap-1.5 opacity-50">
              <X className="w-3.5 h-3.5" /> জমা দেননি
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              শুক্র = ছুটি
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <ClipboardList className="w-3.5 h-3.5" />
              শনি = পরীক্ষার দিন ({toBn(saturdayCount)}টি)
            </span>
          </motion.div>
        </motion.div>

        {/* ── CONTENT (role-gated) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isManager ? (
              <ManagerReport year={year} month={month} weeks={weeks} />
            ) : (
              <TeacherOwnReport
                slug={slug}
                year={year}
                month={month}
                weeks={weeks}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MonthlyReport;
