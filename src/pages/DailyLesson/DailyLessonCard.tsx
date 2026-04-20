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
  Key,
} from "lucide-react";
import { useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";
import DailyLessonModal from "./DailyLessonModal";
import Button from "../../components/common/Button";
import { toBn } from "../../utility/Formatters";
import type { DailyLessonCardProps, TeacherInfo } from "../../types/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const extractTeacher = (teacher: TeacherInfo | string | null) => {
  if (!teacher) return { name: "—", avatarUrl: null };
  if (typeof teacher === "string") return { name: teacher, avatarUrl: null };

  const name = teacher.name?.trim() || "—";
  let avatarUrl: string | null = null;

  if (typeof teacher.avatar === "string" && teacher.avatar.startsWith("http")) {
    avatarUrl = teacher.avatar;
  } else if (
    teacher.avatar &&
    typeof teacher.avatar === "object" &&
    typeof teacher.avatar.url === "string" &&
    teacher.avatar.url.startsWith("http")
  ) {
    avatarUrl = teacher.avatar.url;
  }

  return { name, avatarUrl };
};

// ─── Variants ─────────────────────────────────────────────────────────────────
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const promptVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.18 } },
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
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-sm"
    >
      <motion.div
        variants={promptVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-2xl"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)]" />

        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-active-bg)] text-[var(--color-gray)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-8 pt-6 text-center bangla">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)]">
            <Key className="h-8 w-8 text-[var(--color-brand)]" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-[var(--color-text)]">
            লগইন প্রয়োজন
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-[var(--color-gray)]">
            বিস্তারিত দেখতে এবং সকল ফিচার ব্যবহার করতে লগইন করুন
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/login");
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-text)] text-sm font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-85 active:scale-[0.98]"
            >
              <Key className="h-4 w-4" />
              লগইন করুন
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/signup");
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-active-border)] active:scale-[0.98]"
            >
              <UserPlus className="h-4 w-4" />
              নতুন অ্যাকাউন্ট খুলুন
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
const DailyLessonCard = ({
  lesson,
  index,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: DailyLessonCardProps) => {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isGuest = !isAuthenticated;
  const { name: teacherName, avatarUrl } = extractTeacher(lesson.teacher);
  const refLabel = lesson.referenceType === "page" ? "পৃষ্ঠা" : "অধ্যায়";

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.06,
          duration: 0.44,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ y: -4, transition: { duration: 0.18 } }}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-sm transition-all duration-300 hover:border-[var(--color-brand)] hover:shadow-xl bangla"
      >
        {/* Guest hover lock */}
        {isGuest && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--color-overlay)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full border border-[var(--color-active-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] shadow-lg backdrop-blur-sm">
              <LogIn className="h-3.5 w-3.5" />
              দেখতে লগইন করুন
            </span>
          </div>
        )}

        {/* Top gradient bar */}
        <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)]" />

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          {/* Teacher + subject */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={teacherName}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget
                      .nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = "flex";
                  }}
                  className="h-11 w-11 rounded-xl object-cover ring-2 ring-[var(--color-brand-soft)] ring-offset-1 ring-offset-[var(--color-bg)]"
                />
              ) : null}

              <div
                className="h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-hover)] text-sm font-bold text-white shadow-sm"
                style={{ display: avatarUrl ? "none" : "flex" }}
              >
                {teacherName !== "—" ? (
                  teacherName.charAt(0).toUpperCase()
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-base font-extrabold leading-tight text-[var(--color-text)] sm:text-lg">
                {lesson.subject}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-[var(--color-gray)]">
                <Folder className="h-3.5 w-3.5 shrink-0" />
                {teacherName}
              </p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-active-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-gray)]">
              {lesson.referenceType === "page" ? (
                <FileText className="h-3 w-3" />
              ) : (
                <BookOpen className="h-3 w-3" />
              )}
              {refLabel} {toBn(lesson.chapterNumber)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-active-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-gray)]">
              <Calendar className="h-3 w-3" />
              {lesson.date}
            </span>
          </div>

          <div className="h-px rounded-full bg-[var(--color-active-border)]" />

          <p className="line-clamp-4 flex-1 whitespace-pre-line text-sm leading-relaxed text-[var(--color-gray)]">
            {lesson.topics}
          </p>

          <Button
            variant="default"
            size="md"
            onClick={(e) => {
              e.stopPropagation();

              if (isGuest) {
                setShowLoginPrompt(true);
                return;
              }

              setShowModal(true);
            }}
            className="mt-auto self-end gap-2 rounded-xl px-4 text-sm font-semibold"
          >
            <Eye className="h-4 w-4" />
            বিস্তারিত
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showLoginPrompt && (
          <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
        )}
      </AnimatePresence>

      {showModal && !isGuest && (
        <DailyLessonModal
          lesson={lesson}
          onClose={() => setShowModal(false)}
          formattedDate={lesson.date}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default DailyLessonCard;
