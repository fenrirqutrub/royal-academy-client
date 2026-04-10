// DailyLessonCard.tsx
import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Calendar,
  BookOpen,
  User,
  FileText,
  Folder,
  Eye,
  X,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toBn, type ClassColor } from "../../utility/shared";
import { useAuth } from "../../context/AuthContext";

import DailyLessonModal from "./DailyLessonModal";
import Button from "../../components/common/Button";

// ─── Animation Variants ───────────────────────────────────────────────────────
const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Login Prompt Modal ───────────────────────────────────────────────────────
const LoginPromptModal = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md bg-[var(--color-bg)] border border-[var(--color-active-border)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Decorative Top Bar */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-active-bg)] hover:bg-[var(--color-active-border)] transition-colors group"
        >
          <X className="w-4 h-4 text-[var(--color-gray)] group-hover:text-[var(--color-text)]" />
        </button>

        {/* Content */}
        <div className="px-6 py-8 sm:px-8 sm:py-10 text-center bangla">
          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-[var(--color-active-bg)] border-2 border-[var(--color-active-border)] flex items-center justify-center">
              <LogIn className="w-9 h-9 text-[var(--color-text-hover)]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3">
            লগইন প্রয়োজন
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-[var(--color-gray)] mb-8 leading-relaxed max-w-xs mx-auto">
            বিস্তারিত দেখতে এবং সকল ফিচার ব্যবহার করতে লগইন করুন
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                navigate("/login");
              }}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[var(--color-text)] hover:bg-[var(--color-active-text)] text-[var(--color-bg)] font-semibold rounded-xl transition-all duration-200"
            >
              <LogIn className="w-5 h-5" />
              <span>লগইন করুন</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                navigate("/signup");
              }}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[var(--color-active-bg)] hover:bg-[var(--color-active-border)] text-[var(--color-text)] font-semibold rounded-xl border border-[var(--color-active-border)] transition-all duration-200"
            >
              <UserPlus className="w-5 h-5" />
              <span>নতুন অ্যাকাউন্ট খুলুন</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const color = classColor;

  // ✅ Guest check - token না থাকলে guest
  const isGuest = !isAuthenticated;

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

  // ✅ Guest interaction handler
  const handleGuestInteraction = () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return true;
    }
    return false;
  };

  // ✅ Detail button click handler
  const handleDetailClick = () => {
    if (handleGuestInteraction()) return;
    setShowModal(true);
  };

  // ✅ Card click handler
  const handleCardClick = () => {
    if (handleGuestInteraction()) return;
    setShowModal(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.06,
          duration: 0.48,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={handleCardClick}
        className={`group relative overflow-hidden rounded-2xl flex flex-col bangla transition-all duration-300 bg-[var(--color-bg)] border border-[var(--color-active-border)] shadow-xl ${
          isGuest ? "cursor-pointer" : ""
        }`}
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
        {/* ✅ Guest Lock Overlay */}
        {isGuest && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-white/95 dark:bg-black/85 text-sm font-semibold text-[var(--color-text)] shadow-lg backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                দেখতে লগইন করুন
              </span>
            </div>
          </div>
        )}

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
          <div className="flex items-start gap-3">
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
              <p className="flex items-center gap-x-2 text-xs font-semibold truncate mt-0.5 text-[var(--color-gray)] bangla">
                <Folder className="w-4 h-4" />
                {teacherName}
              </p>
            </div>
          </div>

          {/* ── Meta pills ── */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--color-active-bg)] text-[var(--color-gray)]">
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
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleDetailClick();
            }}
            className="mt-auto self-end text-sm transition-all duration-150"
          >
            বিস্তারিত
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* ✅ Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
        )}
      </AnimatePresence>

      {/* Lesson Modal - শুধু logged in users */}
      {showModal && !isGuest && (
        <DailyLessonModal
          lesson={lesson}
          color={color}
          onClose={() => setShowModal(false)}
          formattedDate={lesson.date}
        />
      )}
    </>
  );
};

export default DailyLessonCard;
