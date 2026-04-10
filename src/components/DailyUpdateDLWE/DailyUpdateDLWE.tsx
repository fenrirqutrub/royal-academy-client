import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Calendar,
  Folder,
  ImageIcon,
} from "lucide-react";
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
  images?: (string | { imageUrl?: string; url?: string; publicId?: string })[];
}

interface NormalizedExam extends WeeklyExamRaw {
  normalizedImages: { url: string }[];
}

// ─── Helpers ──────────────────────────────────────────────
const isFriday = () => new Date().getDay() === 5;
const isSaturday = () => new Date().getDay() === 6;

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

const normalizeImages = (
  images?: WeeklyExamRaw["images"],
): { url: string }[] => {
  if (!images) return [];
  return images
    .map((img) => {
      if (typeof img === "string") return { url: img };
      return { url: img.imageUrl ?? img.url ?? "" };
    })
    .filter((i) => i.url.startsWith("http"));
};

// ─── Lesson Card ──────────────────────────────────────────
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
      className="relative flex-shrink-0 w-[210px] rounded-xl overflow-hidden cursor-pointer bangla"
      style={{
        border: "1px solid var(--color-active-border)",
        background: "var(--color-bg)",
      }}
    >
      {/* accent top bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
        }}
      />

      <div className="p-3.5 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-[var(--color-text)] leading-tight line-clamp-1">
              {lesson.subject}
            </h4>
            <p className="text-[11px] text-[var(--color-gray)] mt-0.5 flex items-center gap-1 truncate">
              <Folder className="w-3 h-3 shrink-0" />
              {teacherName}
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0"
            style={{ background: `${color.from}18`, color: color.from }}
          >
            {lesson.class.replace(" শ্রেণি", "")}
          </span>
        </div>

        {/* Ref pill */}
        <span
          className="inline-flex items-center gap-1 self-start text-[11px] font-semibold px-2 py-0.5 rounded-md"
          style={{ background: `${color.from}12`, color: color.from }}
        >
          <Icon className="w-3 h-3" />
          {refLabel} {toBn(lesson.chapterNumber)}
        </span>

        {/* Topics */}
        <p className="text-[11px] leading-relaxed text-[var(--color-gray)] line-clamp-2 whitespace-pre-line">
          {lesson.topics}
        </p>

        {/* Date footer */}
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-gray)] pt-2 border-t border-[var(--color-active-border)]">
          <Calendar className="w-3 h-3 shrink-0" />
          {BN_DAYS_FULL[new Date(lesson.date).getDay()] ?? ""},{" "}
          {toBn(String(new Date(lesson.date).getDate()))}{" "}
          {BN_MONTHS[new Date(lesson.date).getMonth()]}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Exam Card ────────────────────────────────────────────
const ExamCard = ({
  exam,
  index,
  onClick,
}: {
  exam: NormalizedExam;
  index: number;
  onClick: () => void;
}) => {
  const [imgError, setImgError] = useState(false);
  const color = EXAM_COLORS[index % EXAM_COLORS.length];
  const firstImg = exam.normalizedImages[0];
  const hasImg = !!firstImg && !imgError;

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
      className="relative flex-shrink-0 w-[210px] rounded-xl overflow-hidden cursor-pointer bangla"
      style={{
        border: "1px solid var(--color-active-border)",
        background: "var(--color-bg)",
      }}
    >
      {hasImg ? (
        <div className="relative h-24 overflow-hidden">
          <img
            src={firstImg.url}
            alt={exam.subject}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <p className="absolute bottom-2 left-3 right-3 text-white text-[12px] font-bold line-clamp-1 drop-shadow-sm">
            {exam.subject}
          </p>
          <span
            className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            পরীক্ষা {toBn(exam.ExamNumber)}
          </span>
          {exam.normalizedImages.length > 1 && (
            <span
              className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white flex items-center gap-1"
              style={{ background: "rgba(0,0,0,0.4)" }}
            >
              <ImageIcon className="w-2.5 h-2.5" />
              {toBn(String(exam.normalizedImages.length))}
            </span>
          )}
        </div>
      ) : (
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
          }}
        />
      )}

      <div className="p-3.5 flex flex-col gap-2">
        {!hasImg && (
          <div>
            <h4 className="text-[13px] font-bold text-[var(--color-text)] line-clamp-1">
              {exam.subject}
            </h4>
            <p
              className="text-[10px] font-semibold mt-0.5"
              style={{ color: color.from }}
            >
              পরীক্ষা নং {toBn(exam.ExamNumber)}
            </p>
          </div>
        )}

        {exam.teacher && (
          <p className="text-[11px] text-[var(--color-gray)] flex items-center gap-1 truncate">
            <Folder className="w-3 h-3 shrink-0" />
            {exam.teacher}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: `${color.from}12`, color: color.from }}
          >
            <GraduationCap className="w-3 h-3" />
            {exam.class}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: `${color.from}12`, color: color.from }}
          >
            {toBn(String(exam.mark))} নম্বর
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-[var(--color-gray)] line-clamp-2 whitespace-pre-line">
          {exam.topics}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Dot separator ────────────────────────────────────────
const Dot = ({ color }: { color: string }) => (
  <div className="flex items-center px-3 shrink-0">
    <div
      className="w-1 h-1 rounded-full opacity-40"
      style={{ background: color }}
    />
  </div>
);

const DailyUpdateDLWE = () => {
  const navigate = useNavigate();

  const saturday = isSaturday();
  const showExam = isFriday();

  const { data: lessonData } = useQuery<DailyLessonData[]>({
    queryKey: ["daily-lessons"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/daily-lesson");
      const p = res.data;
      return Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    enabled: !showExam && !saturday,
  });

  const { data: examData } = useQuery<WeeklyExamRaw[]>({
    queryKey: ["weekly-exams"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/weekly-exams");
      const p = res.data;
      return Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : [];
    },
    staleTime: 1000 * 60,
    enabled: showExam && !saturday,
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

  const thisWeekExams: NormalizedExam[] = useMemo(() => {
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
      )
      .map((e) => ({ ...e, normalizedImages: normalizeImages(e.images) }));
  }, [examData]);

  if (saturday) return null;

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
        className="flex flex-col items-center cursor-pointer"
        onClick={handleNavigate}
      >
        <span className="text-2xl md:text-4xl font-bold text-[var(--color-text)]">
          {isLesson
            ? "আজকের পড়া"
            : `সাপ্তাহিক পরীক্ষার ধারণা নং-${toBn(currentExamNumber)}`}
        </span>

        <span className="text-2xl md:text-3xl text-[var(--color-text)]">
          {todayBn()}
        </span>

        <span className="text-xl md:text-2xl text-[var(--color-gray)]">
          মোট{" "}
          <span className="font-bold text-[var(--color-text)]">
            {toBn(String(items.length))}
          </span>
          {isLesson ? "টি পাঠ" : "টি বিষয়"}
        </span>
      </div>

      {/* ── Marquee ── */}
      <div className="relative rounded-b-xl py-3 overflow-hidden">
        <Marquee speed={32} gradient={false} pauseOnHover direction="left">
          <div className="flex items-stretch gap-0 px-2">
            {repeated.map((item, i) =>
              isLesson ? (
                <div key={`${item._id}-${i}`} className="flex">
                  <LessonCard
                    lesson={item as DailyLessonData}
                    index={i % items.length}
                    onClick={handleNavigate}
                  />
                  <Dot color={accentColor} />
                </div>
              ) : (
                <div key={`${item._id}-${i}`} className="flex">
                  <ExamCard
                    exam={item as NormalizedExam}
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
