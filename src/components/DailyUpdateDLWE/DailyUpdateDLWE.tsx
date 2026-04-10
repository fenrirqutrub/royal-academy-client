import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { BookOpen, FileText, GraduationCap, Folder } from "lucide-react";
import { BN_DAYS_FULL, BN_MONTHS } from "../common/Datepicker";
import { CLASS_COLORS, DEFAULT_CLASS_COLOR, toBn } from "../../utility/shared";

import axiosPublic from "../../hooks/axiosPublic";
import { CLASS_ORDER, EXAM_COLORS } from "../../utility/Constants";
import type { DailyLessonData } from "../../pages/DailyLesson/DailyLessonUpdateModals";

// ─── Types ────────────────────────────────────────────────
interface WeeklyExamRaw {
  _id: string;
  subject: string;
  teacher: string;
  class: string;
  mark: number;
  ExamNumber: string;
  topics: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────

// Thursday 2pm থেকে Saturday 9am পর্যন্ত weekly exam দেখাবে
const shouldShowExam = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 4=Thursday, 5=Friday, 6=Saturday
  const hour = now.getHours();

  // Thursday 2pm (14:00) এর পরে
  if (day === 4 && hour >= 14) return true;

  // Friday সারাদিন
  if (day === 5) return true;

  // Saturday 9am এর আগে
  if (day === 6 && hour < 9) return true;

  return false;
};

const todayBn = () => {
  const d = new Date();
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(String(d.getDate()))} ${BN_MONTHS[d.getMonth()]}`;
};

const getCurrentWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
};

// ─── Lesson Card (Text Only) ──────────────────────────────
const LessonCard = ({
  lesson,
  index,
  onClick,
}: {
  lesson: DailyLessonData;
  index: number;
  onClick: () => void;
}) => {
  const color = CLASS_COLORS[lesson.class] ?? DEFAULT_CLASS_COLOR;
  const Icon = lesson.referenceType === "page" ? FileText : BookOpen;
  const refLabel = lesson.referenceType === "page" ? "পৃষ্ঠা" : "অধ্যায়";
  const teacherName =
    typeof lesson.teacher === "string"
      ? lesson.teacher
      : ((lesson.teacher as { name: string }).name ?? "—");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="relative flex-shrink-0 w-[280px] h-[140px] rounded-xl overflow-hidden cursor-pointer bangla"
      style={{
        border: "1px solid var(--color-active-border)",
        background: "var(--color-bg)",
      }}
    >
      {/* accent top bar */}
      <div
        className="h-[3px] w-full"
        style={{
          background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
        }}
      />

      <div className="p-4 flex flex-col gap-2 h-[calc(100%-3px)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-bold text-[var(--color-text)] leading-tight line-clamp-1">
              {lesson.subject}
            </h4>
            <p className="text-[12px] text-[var(--color-gray)] mt-1 flex items-center gap-1.5 truncate">
              <Folder className="w-3.5 h-3.5 shrink-0" />
              {teacherName}
            </p>
          </div>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0"
            style={{ background: `${color.from}18`, color: color.from }}
          >
            {lesson.class.replace(" শ্রেণি", "")}
          </span>
        </div>

        {/* Ref pill */}
        <span
          className="inline-flex items-center gap-1.5 self-start text-[12px] font-semibold px-2.5 py-1 rounded-md"
          style={{ background: `${color.from}12`, color: color.from }}
        >
          <Icon className="w-3.5 h-3.5" />
          {refLabel} {toBn(lesson.chapterNumber)}
        </span>

        {/* Topics */}
        <p className="text-[12px] leading-relaxed text-[var(--color-gray)] line-clamp-2 whitespace-pre-line flex-1">
          {lesson.topics}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Exam Card (Text Only - No Images) ────────────────────
const ExamCard = ({
  exam,
  index,
  onClick,
}: {
  exam: WeeklyExamRaw;
  index: number;
  onClick: () => void;
}) => {
  const color = EXAM_COLORS[index % EXAM_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="relative flex-shrink-0 w-[280px] h-[140px] rounded-xl overflow-hidden cursor-pointer bangla"
      style={{
        border: "1px solid var(--color-active-border)",
        background: "var(--color-bg)",
      }}
    >
      {/* accent top bar */}
      <div
        className="h-[3px] w-full"
        style={{
          background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
        }}
      />

      <div className="px-4 py-1 flex flex-col gap-1 h-[calc(100%-3px)]">
        {/* Header */}
        <div className="flex flex-col items-cener justify-center">
          <h4 className="text-md text-center font-bold text-[var(--color-text)] ">
            {exam.subject}
          </h4>

          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-[var(--color-gray)] gap-x-1">
              পরীক্ষা নং {toBn(exam.ExamNumber)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--color-active-bg)] text-[var(--color-gray)]">
              <GraduationCap className="w-3.5 h-3.5" />
              {exam.class}
            </span>
            <span className="text-xs font-bold  rounded-md shrink-0 text-[var(--color-gray)]">
              পূর্ণমান- {toBn(String(exam.mark))}
            </span>
          </div>
        </div>

        {/* Topics */}
        <p className="text-[12px] leading-relaxed text-[var(--color-gray)] line-clamp-2 whitespace-pre-line flex-1">
          {exam.topics}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Dot separator ────────────────────────────────────────
const Dot = ({ color }: { color: string }) => (
  <div className="flex items-center px-4 shrink-0">
    <div
      className="w-1.5 h-1.5 rounded-full opacity-40"
      style={{ background: color }}
    />
  </div>
);

const DailyUpdateDLWE = () => {
  const navigate = useNavigate();

  const showExam = shouldShowExam();

  const { data: lessonData } = useQuery<DailyLessonData[]>({
    queryKey: ["daily-lessons"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/daily-lesson");
      const p = res.data;
      return Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    enabled: !showExam,
  });

  const { data: examData } = useQuery<WeeklyExamRaw[]>({
    queryKey: ["weekly-exams"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/weekly-exams");
      const p = res.data;
      return Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : [];
    },
    staleTime: 1000 * 60,
    enabled: showExam,
  });

  const todayLessons = useMemo(() => {
    if (!lessonData) return [];
    const today = new Date();
    return lessonData.filter((l) => {
      const d = new Date(l.date);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });
  }, [lessonData]);

  const thisWeekExams = useMemo(() => {
    if (!examData) return [];
    const { monday, sunday } = getCurrentWeekRange();
    const thisWeekNums = new Set(
      examData
        .filter((e) => {
          const d = new Date(e.createdAt);
          return d >= monday && d <= sunday;
        })
        .map((e) => e.ExamNumber),
    );
    const targetNums =
      thisWeekNums.size > 0
        ? thisWeekNums
        : new Set([
            [...examData].sort(
              (a, b) => Number(b.ExamNumber) - Number(a.ExamNumber),
            )[0]?.ExamNumber,
          ]);

    return examData
      .filter((e) => targetNums.has(e.ExamNumber))
      .sort(
        (a, b) => (CLASS_ORDER[a.class] ?? 99) - (CLASS_ORDER[b.class] ?? 99),
      );
  }, [examData]);

  const isLesson = !showExam;
  const items = isLesson ? todayLessons : thisWeekExams;
  const accentColor = isLesson ? "#6366f1" : "#f59e0b";
  const currentExamNumber = thisWeekExams[0]?.ExamNumber ?? "";

  if (items.length === 0) return null;

  const repeated = [...items, ...items, ...items];

  const handleNavigate = () =>
    navigate(isLesson ? "/dailylesson" : "/weekly-exam");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bangla mt-8"
    >
      {/* ── Header ── */}
      <div
        className="flex flex-col items-center cursor-pointer mb-4"
        onClick={handleNavigate}
      >
        <span className="text-2xl md:text-4xl font-bold text-[var(--color-text)]">
          {isLesson
            ? "আজকের পড়া"
            : `সাপ্তাহিক পরীক্ষার ধারণা নং-${toBn(currentExamNumber)}`}
        </span>

        <span className="text-xl md:text-2xl text-[var(--color-text)]">
          {todayBn()}
        </span>

        <span className="text-lg md:text-xl text-[var(--color-gray)]">
          মোট{" "}
          <span className="font-bold text-[var(--color-text)]">
            {toBn(String(items.length))}
          </span>
          {isLesson ? "টি পাঠ" : "টি বিষয়"}
        </span>
      </div>

      {/* ── Marquee ── */}
      <div className="relative rounded-b-xl py-2 overflow-hidden">
        <Marquee speed={35} gradient={false} direction="left">
          <div className="flex items-stretch gap-0 px-2">
            {repeated.map((item, i) =>
              isLesson ? (
                <div key={`${item._id}-${i}`} className="flex items-center">
                  <LessonCard
                    lesson={item as DailyLessonData}
                    index={i % items.length}
                    onClick={handleNavigate}
                  />
                  <Dot color={accentColor} />
                </div>
              ) : (
                <div key={`${item._id}-${i}`} className="flex items-center">
                  <ExamCard
                    exam={item as WeeklyExamRaw}
                    index={i % items.length}
                    onClick={handleNavigate}
                  />
                  <Dot color={accentColor} />
                </div>
              ),
            )}
          </div>
        </Marquee>
      </div>
    </motion.div>
  );
};

export default DailyUpdateDLWE;
