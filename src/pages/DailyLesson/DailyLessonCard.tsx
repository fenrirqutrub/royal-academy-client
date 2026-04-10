// DailyLessonCard.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, BookOpen, User, FileText, Folder, Eye } from "lucide-react";
import { toBn, type ClassColor } from "../../utility/shared";

import DailyLessonModal from "./DailyLessonModal";
import Button from "../../components/common/Button";

// ─── Types ────────────────────────────────────────────────
export interface TeacherInfo {
  _id: string;
  name: string;
  avatar?: { url: string | null; publicId?: string | null } | string | null;
  role?: string;
  slug?: string;
}

export interface DailyLessonItem {
  _id: string;
  subject: string;
  teacher: TeacherInfo | string;
  class: string;
  mark: number;
  referenceType: "chapter" | "page";
  chapterNumber: string;
  topics: string;
  images: { url: string; public_id: string }[];
  // date here is already the formatted Bangla string (passed from DailyLesson.tsx)
  date: string;
  createdAt: string;
  slug?: string;
  teacherSlug?: string;
}

// ─── Resolve teacher avatar + name from all shapes ────────
export const extractTeacher = (teacher: TeacherInfo | string | null) => {
  if (!teacher) return { name: "—", avatarUrl: null };
  if (typeof teacher === "string") return { name: teacher, avatarUrl: null };

  const name = teacher.name?.trim() || "—";
  let avatarUrl: string | null = null;

  if (teacher.avatar) {
    if (
      typeof teacher.avatar === "string" &&
      teacher.avatar.startsWith("http")
    ) {
      avatarUrl = teacher.avatar;
    } else if (
      typeof teacher.avatar === "object" &&
      teacher.avatar !== null &&
      typeof teacher.avatar.url === "string" &&
      teacher.avatar.url.startsWith("http")
    ) {
      avatarUrl = teacher.avatar.url;
    }
  }

  return { name, avatarUrl };
};

interface DailyLessonCardProps {
  lesson: DailyLessonItem;
  index: number;
  classColor: ClassColor;
}

// ─── Component ────────────────────────────────────────────
const DailyLessonCard = ({
  lesson,
  index,
  classColor,
}: DailyLessonCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const color = classColor;

  const { name: teacherName, avatarUrl: teacherAvatar } = extractTeacher(
    lesson.teacher,
  );

  const refLabel = lesson.referenceType === "page" ? "পৃষ্ঠা" : "অধ্যায়";

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };
  const accentRgb = hexToRgb(color.from);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.06,
          duration: 0.48,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group relative overflow-hidden rounded-2xl flex flex-col bangla transition-all duration-300 bg-[var(--color-bg)] border border-[var(--color-active-border)] shadow-xl "
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            `0 8px 32px rgba(${accentRgb}, 0.16), 0 2px 12px rgba(0,0,0,0.08)`;
          (e.currentTarget as HTMLDivElement).style.borderColor =
            `${color.from}50`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 2px 12px rgba(0,0,0,0.06)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--color-active-border)";
        }}
      >
        {/* Top gradient accent bar */}
        <div
          className="h-[3px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
          }}
        />

        {/* Card body */}
        <div className="flex flex-col flex-1 p-5 gap-4">
          {/* ── Teacher + Subject row ── */}
          <div className="flex  items-start gap-3">
            {/* Avatar */}
            <div className="shrink-0 relative">
              {teacherAvatar ? (
                <img
                  src={teacherAvatar}
                  alt={teacherName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                  className="w-11 h-11 rounded-xl object-cover shadow-sm"
                  style={{
                    outline: `2px solid ${color.from}30`,
                    outlineOffset: "1px",
                  }}
                />
              ) : null}
              <div
                className="w-11 h-11 rounded-xl items-center justify-center text-white font-bold text-base shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                  display: teacherAvatar ? "none" : "flex",
                }}
              >
                {teacherName !== "—" ? (
                  teacherName.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Subject + teacher name */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold leading-tight text-[var(--color-text)] line-clamp-1">
                {lesson.subject}
              </h3>
              <p className=" flex items-center gap-x-2 text-xs font-semibold truncate mt-0.5 text-[var(--color-gray)] bangla">
                <Folder className="w-4 h-4" />
                {teacherName}
              </p>
            </div>
          </div>

          {/* ── Meta pills ── */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--color-active-bg)] text-[var(--color-gray)] ">
              {lesson.referenceType === "page" ? (
                <FileText className="w-3 h-3" />
              ) : (
                <BookOpen className="w-3 h-3" />
              )}
              {refLabel} {toBn(lesson.chapterNumber)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--color-active-bg)] text-[var(--color-gray)]">
              <Calendar className="w-3 h-3" />

              {lesson.date}
            </span>
          </div>

          {/* ── Divider ── */}
          <div className="h-px rounded-full bg-[var(--color-active-border)]" />

          {/* ── Topics preview ── */}
          <p className="text-sm leading-relaxed text-[var(--color-gray)] line-clamp-4 whitespace-pre-line flex-1">
            {lesson.topics}
          </p>

          {/* ── Detail button ── */}

          <Button
            as={motion.button}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowModal(true)}
            className="mt-auto self-end text-sm transition-all duration-150]"
          >
            বিস্তারিত
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {showModal && (
        <DailyLessonModal
          lesson={lesson}
          color={color}
          onClose={() => setShowModal(false)}
          formattedDate={lesson.date}
        />
      )}
    </div>
  );
};

export default DailyLessonCard;
