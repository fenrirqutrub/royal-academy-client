import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  BookOpen,
  Calendar,
  GraduationCap,
  User,
  FileText,
  Folder,
  Pencil,
  Trash2,
} from "lucide-react";
import { toBn } from "../../utility/Formatters";
import { extractTeacher } from "./DailyLessonCard";
import type { DailyLessonModalProps } from "../../types/types";

const DailyLessonModal = ({
  lesson,
  onClose,
  formattedDate,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: DailyLessonModalProps) => {
  const [copied, setCopied] = useState(false);
  const { name: teacherName, avatarUrl } = extractTeacher(lesson.teacher);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handler);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleCopy = useCallback(() => {
    const label = lesson.referenceType === "page" ? "পৃষ্ঠা নং" : "অধ্যায় নং";
    const text = [
      `📅 ${formattedDate}`,
      `🏫 ${lesson.class} | ${lesson.subject}`,
      `${label}: ${lesson.chapterNumber}`,
      ``,
      lesson.topics,
    ].join("\n");

    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  }, [lesson, formattedDate]);

  const handleEdit = () => {
    onEdit?.();
    onClose();
  };

  const handleDelete = () => {
    onDelete?.();
    onClose();
  };

  const refLabel = lesson.referenceType === "page" ? "পৃষ্ঠা" : "অধ্যায়";
  const initials =
    teacherName !== "—" ? teacherName.charAt(0).toUpperCase() : "?";

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-[var(--color-overlay)] backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 30 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="fixed inset-0 z-[201] bangla"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-dvh w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)] shadow-2xl touch-pan-y">
          {/* Top brand line */}
          <div className="absolute left-0 top-0 z-10 h-1 w-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)]" />

          {/* Mobile handle */}
          <div className="flex justify-center pb-1 pt-3 sm:hidden">
            <div className="h-1 w-9 rounded-full bg-[var(--color-gray)] opacity-30" />
          </div>

          {/* Scrollable content */}
          <div
            className="h-full overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-[var(--color-brand-soft)] via-[var(--color-active-bg)] to-transparent px-6 pb-7 pt-5 sm:pt-7">
              {/* Close */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white transition-opacity hover:opacity-90"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </motion.button>

              {/* Top label */}
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[var(--color-brand)] to-[var(--color-brand-hover)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-brand)]">
                  দৈনিক পাঠ বিবরণ
                </span>
              </div>

              {/* Avatar + title */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={teacherName}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = "none";
                        const fallback =
                          img.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                      className="h-28 w-28 rounded-full object-cover ring-2 ring-[var(--color-brand-soft)] ring-offset-2 ring-offset-[var(--color-bg)] shadow-lg md:h-32 md:w-32"
                    />
                  ) : null}

                  <div
                    className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-hover)] text-xl font-black text-white shadow-lg md:h-32 md:w-32"
                    style={{ display: avatarUrl ? "none" : "flex" }}
                  >
                    {teacherName !== "—" ? (
                      initials
                    ) : (
                      <User className="h-14 w-14" />
                    )}
                  </div>

                  <span className="absolute bottom-1.5 right-1.5 h-4 w-4 animate-pulse rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-brand)]" />
                </div>

                <div className="flex min-w-0 flex-col items-center justify-center pr-8 pt-1 text-center bangla">
                  <h2 className="mb-1 text-xl font-bold leading-tight text-[var(--color-text)] sm:text-2xl">
                    {lesson.subject}
                  </h2>

                  {teacherName !== "—" && (
                    <p className="flex items-center justify-center gap-x-2 truncate text-sm font-medium text-[var(--color-gray)]">
                      <Folder className="h-4 w-4" />
                      {teacherName}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta pills */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {[
                  {
                    icon: <GraduationCap className="h-3.5 w-3.5" />,
                    label: lesson.class,
                  },
                  {
                    icon:
                      lesson.referenceType === "page" ? (
                        <FileText className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      ),
                    label: `${refLabel} ${toBn(lesson.chapterNumber)}`,
                  },
                  {
                    icon: <Calendar className="h-3.5 w-3.5" />,
                    label: formattedDate,
                  },
                ].map((pill, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.06 }}
                    className="inline-flex select-none items-center gap-1.5 rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3 py-1.5 text-xs font-bold text-[var(--color-gray)]"
                  >
                    {pill.icon}
                    {pill.label}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-active-border)] to-transparent opacity-40" />

            {/* Body */}
            <div className="px-6 py-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[var(--color-brand)] to-[var(--color-brand-hover)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-brand)]">
                  বিষয়বস্তু ও নির্দেশনা
                </span>
              </div>

              <p className="whitespace-pre-line text-sm leading-loose text-[var(--color-text)] sm:text-base">
                {lesson.topics}
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-active-border)] px-6 py-4">
              <p className="text-[11px] leading-snug text-[var(--color-gray)]">
                তারিখ, শ্রেণি, অধ্যায় ও বিষয়বস্তু কপি হবে
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {canDelete && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex shrink-0 items-center gap-1.5 rounded  bg-red-600 border border-red-400 px-3.5 py-2.5 text-xs font-bold text-[var(--color-bg)] transition-all duration-200 hover:opacity-90"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </motion.button>
                )}

                {canEdit && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex shrink-0 items-center gap-1.5 rounded bg-amber-400 border border-amber-400 px-3.5 py-2.5 text-xs font-bold text-[var(--color-bg)] transition-all duration-200 hover:opacity-90"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </motion.button>
                )}

                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  aria-label={copied ? "কপি সম্পন্ন" : "কপি করুন"}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded bg-green-400 text-[var(--color-bg)] px-4 py-2.5 text-sm font-black transition-all duration-200 border border-green-400",
                    copied
                      ? "bg-green-400 text-[var(--color-bg)] border border-green-400"
                      : "bg-greed-800 text-[var(--color-bg)] shadow-md border border-green-400",
                  ].join(" ")}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4" /> কপি হয়েছে
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <Copy className="h-4 w-4" /> কপি করুন
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            {/* Bottom mobile handle */}
            <div className="flex justify-center pb-1 pt-3 sm:hidden">
              <div className="h-1 w-9 rounded-full bg-[var(--color-gray)] opacity-30" />
            </div>

            <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default DailyLessonModal;
