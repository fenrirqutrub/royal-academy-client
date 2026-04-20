// DailyLessonModal.tsx
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
import { toBn, type ClassColor } from "../../utility/Formatters";
import type { DailyLessonItem } from "./DailyLessonCard";
import { extractTeacher } from "./DailyLessonCard";

interface DailyLessonModalProps {
  lesson: DailyLessonItem;
  color: ClassColor;
  onClose: () => void;
  formattedDate: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const DailyLessonModal = ({
  lesson,
  color,
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
    setTimeout(() => setCopied(false), 2400);
  }, [lesson, formattedDate]);

  // NEW: Handlers for edit/delete that close modal after action
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

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };
  const accentRgb = hexToRgb(color.from);

  return createPortal(
    <AnimatePresence>
      {/* ── Backdrop ── */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[200]"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      />

      {/* ── Modal ── */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 30 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-[201] bangla"
      >
        <div
          className="relative w-screen h-dvh overflow-hidden bg-[var(--color-bg)] bangla touch-pan-y"
          style={{
            boxShadow: `0 0 0 1px rgba(${accentRgb}, 0.15), 0 32px 80px rgba(0,0,0,0.45), 0 0 60px rgba(${accentRgb}, 0.12)`,
          }}
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div
              className="w-9 h-1 rounded-full opacity-30"
              style={{ background: color.from }}
            />
          </div>

          {/* Scrollable content */}
          <div
            className="overflow-y-auto"
            style={{ height: "100%", scrollbarWidth: "none" }}
          >
            {/* ── Hero section ── */}
            <div
              className="relative px-6 pt-5 pb-7 sm:pt-7"
              style={{
                background: `linear-gradient(160deg, ${color.from}22 0%, ${color.to}10 60%, transparent 100%)`,
              }}
            >
              {/* Close btn */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full transition-colors bg-red-600 text-white"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </motion.button>

              {/* Top label */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-5 w-1 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, ${color.from}, ${color.to})`,
                  }}
                />
                <span
                  className="text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ color: color.from }}
                >
                  দৈনিক পাঠ বিবরণ
                </span>
              </div>

              {/* Avatar + Title */}
              <div className="flex flex-col items-center justify-center gap-4">
                {/* Avatar */}
                <div className="shrink-0 relative">
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
                      className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-lg"
                      style={{
                        outline: `2px solid ${color.from}40`,
                        outlineOffset: "2px",
                      }}
                    />
                  ) : null}
                  <div
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full items-center justify-center text-white font-black text-xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                      display: avatarUrl ? "none" : "flex",
                    }}
                  >
                    {teacherName !== "—" ? (
                      initials
                    ) : (
                      <User className="w-14 h-14" />
                    )}
                  </div>
                  {/* Pulse dot */}
                  <span
                    className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-[var(--color-bg)] animate-pulse"
                    style={{ background: color.from }}
                  />
                </div>

                {/* Subject + teacher */}
                <div className="flex flex-col items-center justify-center min-w-0 pr-8 pt-1 bangla">
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight text-[var(--color-text)] mb-1 bangla">
                    {lesson.subject}
                  </h2>
                  {teacherName !== "—" && (
                    <p className="flex justify-center items-center gap-x-2 text-[var(--color-gray)] text-sm font-medium truncate">
                      <Folder className="w-4 h-4" />
                      {teacherName}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Meta pill grid ── */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {[
                  {
                    icon: <GraduationCap className="w-3.5 h-3.5" />,
                    label: lesson.class,
                  },
                  {
                    icon:
                      lesson.referenceType === "page" ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5" />
                      ),
                    label: `${refLabel} ${toBn(lesson.chapterNumber)}`,
                  },
                  {
                    icon: <Calendar className="w-3.5 h-3.5" />,
                    label: formattedDate,
                  },
                ].map((pill, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.06 }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl select-none text-[var(--color-gray)]"
                  >
                    {pill.icon}
                    {pill.label}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Gradient divider */}
            <div
              className="h-px mx-5"
              style={{
                background: `linear-gradient(90deg, ${color.from}50, ${color.to}30, transparent)`,
              }}
            />

            {/* ── Body: topics ── */}
            <div className="px-6 py-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, ${color.from}, ${color.to})`,
                  }}
                />
                <span
                  className="text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{ color: color.from }}
                >
                  বিষয়বস্তু ও নির্দেশনা
                </span>
              </div>

              <p
                className="text-sm sm:text-base leading-loose text-[var(--color-text)] whitespace-pre-line"
                style={{ fontFamily: "inherit" }}
              >
                {lesson.topics}
              </p>
            </div>

            {/* ── Footer: Copy + Edit/Delete ── */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t"
              style={{ borderColor: `${color.from}20` }}
            >
              <p className="text-[11px] text-[var(--color-gray)] leading-snug">
                তারিখ, শ্রেণি, অধ্যায় ও বিষয়বস্তু কপি হবে
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {/* Edit Button */}
                {canEdit && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 border border-[var(--color-success-soft)] text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    সম্পাদনা
                  </motion.button>
                )}

                {/* Delete Button */}
                {canDelete && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 border border-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    মুছুন
                  </motion.button>
                )}

                {/* Copy Button */}
                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  aria-label={copied ? "কপি সম্পন্ন" : "কপি করুন"}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-200 shrink-0"
                  style={
                    copied
                      ? {
                          background: "#dcfce7",
                          color: "#15803d",
                        }
                      : {
                          background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                          color: "#fff",
                          boxShadow: `0 4px 14px rgba(${accentRgb}, 0.35)`,
                        }
                  }
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
                        <Check className="w-4 h-4" /> কপি হয়েছে
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <Copy className="w-4 h-4" /> কপি করুন
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div
                className="w-9 h-1 rounded-full opacity-30"
                style={{ background: color.from }}
              />
            </div>
            {/* Safe area */}
            <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default DailyLessonModal;
