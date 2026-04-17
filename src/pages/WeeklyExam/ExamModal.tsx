// src/components/WeeklyExam/ExamModal.tsx
import { useEffect, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Copy,
  GraduationCap,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Hash,
  Folder,
  FileText,
  HelpCircle,
  MessageSquareText,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  toBn,
  getNumberInfo,
  type ColorConfig,
  type Exam,
} from "../../utility/shared";
import { useAuth } from "../../context/AuthContext";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface ExamModalProps {
  exam: Exam;
  color: ColorConfig;
  onClose: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ExamModal = ({
  exam,

  onClose,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: ExamModalProps) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const images = Array.isArray(exam.images) ? exam.images : [];
  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  // Get number info
  const numberInfo = getNumberInfo(exam);
  const isPageType = exam.numberType === "pageNumber";

  // ─── Role Check: Student কিনা ─────────────────────────────
  const isStudent = user?.role === "student";

  // Student না হলেই question দেখাবে
  const canSeeQuestion = !isStudent && !!exam.question;

  const getImageUrl = (img: unknown): string => {
    if (typeof img === "string") return img;
    if (img && typeof img === "object") {
      const o = img as Record<string, string>;
      return o.url ?? o.imageUrl ?? "";
    }
    return "";
  };

  const handleCopy = useCallback(async () => {
    const lines = [
      `পরীক্ষা নং = ${toBn(exam.ExamNumber)}`,
      numberInfo ? `${numberInfo.label} নং = ${numberInfo.value}` : null,
      `${exam.class} = ${exam.subject} - ${toBn(exam.mark)} নম্বর`,
      ``,
      `📝 বিষয়বস্তু:`,
      exam.topics,

      canSeeQuestion ? `\n❓ প্রশ্ন:\n${exam.question}` : null,
    ].filter((l): l is string => l !== null);

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exam, numberInfo, canSeeQuestion]);

  // NEW: Handlers for edit/delete that close modal after action
  const handleEdit = () => {
    onEdit?.();
    onClose();
  };

  const handleDelete = () => {
    onDelete?.();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Info tags with dynamic number type
  const infoTags = [
    { icon: GraduationCap, label: exam.class },
    { icon: BookOpen, label: `${toBn(exam.mark)} নম্বর` },
    { icon: CalendarDays, label: exam.date },
    ...(numberInfo
      ? [
          {
            icon: isPageType ? FileText : Hash,
            label: `${numberInfo.label} ${numberInfo.value}`,
          },
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 top-0 z-[99999] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="bangla absolute inset-0 w-screen h-dvh overflow-y-auto bg-[var(--color-bg)] shadow-2xl flex flex-col"
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors duration-200"
          >
            <X size={18} strokeWidth={2.5} />
          </motion.button>

          {/* Image Carousel */}
          {hasImages && (
            <div className="relative w-full h-full bg-[var(--color-bg)]">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                loop={multipleImages}
                autoplay={
                  multipleImages
                    ? {
                        delay: 3200,
                        disableOnInteraction: false,
                      }
                    : false
                }
                pagination={{
                  clickable: true,
                }}
                navigation={multipleImages}
                className="w-full h-full"
              >
                {images.map((img, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={getImageUrl(img)}
                      alt={exam.subject}
                      className="w-full h-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-10" />

              {/* Question indicator on image - শুধু non-student দের জন্য */}
              {canSeeQuestion && (
                <motion.div
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 
                    rounded-full bg-[var(--color-text)] text-[var(--color-bg)] text-xs font-semibold shadow-lg"
                >
                  <HelpCircle className="w-4 h-4" />
                  প্রশ্ন সংযুক্ত আছে
                </motion.div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center pr-8"
            >
              <span className="text-md font-semibold tracking-widest text-[var(--color-gray)] uppercase">
                সাপ্তাহিক পরীক্ষা নং-{toBn(exam.ExamNumber)}
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">
                {exam.subject}
              </h2>
            </motion.div>

            {/* Teacher */}
            {exam.teacher && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-center gap-2 text-[var(--color-gray)] text-md"
              >
                <Folder size={15} className="flex-shrink-0" />
                <span>{exam.teacher}</span>
              </motion.div>
            )}

            {/* Info Tags */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-2.5"
            >
              {infoTags.map(({ icon: Icon, label }, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--color-active-bg)] text-[var(--color-gray)] text-sm font-medium"
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>

            {/* Topics */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[var(--color-text)]" />
                <span className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                  <MessageSquareText size={14} />
                  বিষয়বস্তু ও নির্দেশনা
                </span>
              </div>
              <div className="text-[16px] leading-relaxed text-[var(--color-active-text)] whitespace-pre-line border border-[var(--color-active-border)] p-4 sm:p-5 rounded-xl text-left">
                {exam.topics}
              </div>
            </motion.div>

            {/* Question Section - শুধু non-student দের জন্য */}
            {canSeeQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[var(--color-active-text)]" />
                  <span className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    <HelpCircle size={14} />
                    প্রশ্ন
                  </span>
                </div>
                <div className="text-[16px] leading-relaxed whitespace-pre-line p-4 sm:p-5 rounded-2xl text-left bg-[var(--color-active-bg)]">
                  {exam.question}
                </div>
              </motion.div>
            )}

            {/* ── Footer: Copy + Edit/Delete ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-[var(--color-gray)] leading-snug">
                পরীক্ষার তথ্য ও বিষয়বস্তু কপি হবে
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

                {/* Minimal Copy Button - Fast */}
                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
    relative flex items-center justify-center gap-2 py-2.5 px-5 
    rounded-xl text-sm font-medium transition-all duration-150 
    shrink-0 border
  `}
                  style={{
                    backgroundColor: copied
                      ? "var(--color-text)"
                      : "var(--color-bg)",
                    borderColor: copied
                      ? "var(--color-text)"
                      : "var(--color-text)",
                    color: copied ? "var(--color-bg)" : "var(--color-text)",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="copied"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            duration: 0.1,
                            type: "spring",
                            damping: 15,
                          }}
                        >
                          <CheckCircle2 size={16} />
                        </motion.div>
                        <span>কপি হয়েছে</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          whileHover={{
                            y: [-2, 0, -2],
                            transition: {
                              duration: 0.6,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }}
                        >
                          <Copy size={16} />
                        </motion.div>
                        <span>কপি করুন</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExamModal;
