// src/components/WeeklyExam/WeeklyExamCard.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import {
  Eye,
  Copy,
  Check,
  Folder,
  Calendar,
  HelpCircle,
  Fan,
  X,
  UserPlus,
  Key,
  Pencil,
  Trash2,
} from "lucide-react";
import "swiper/css";
import { useNavigate } from "react-router";

import ExamModal from "./ExamModal";

import {
  COLORS,
  type Exam,
  AnimatedSlide,
  SlideDots,
  SlideProgress,
  toBn,
  getNumberInfo,
} from "../../utility/shared";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";

/* ─── Animation Variants ─────────────────────────────────────────────────── */

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

/* ─── Login Prompt Modal ─────────────────────────────────────────────────── */

const LoginPromptModal = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-2xl"
      >
        <div className="h-1.5 bg-gradient-to-r from-[var(--color-brand)] via-violet-500 to-fuchsia-500" />

        <div className="absolute top-4 right-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="size-8 rounded-full bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-6 py-8 text-center bangla sm:px-8 sm:py-10">
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0 rounded-full bg-[var(--color-brand-soft)] blur-xl" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-[var(--color-active-border)] bg-[var(--color-active-bg)]">
              <Key className="w-9 h-9 text-[var(--color-text)]" />
            </div>
          </div>

          <h2 className="mb-3 text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
            লগইন প্রয়োজন
          </h2>

          <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-[var(--color-gray)] sm:text-base">
            বিস্তারিত দেখতে এবং সকল ফিচার ব্যবহার করতে লগইন করুন
          </p>

          <div className="flex flex-col gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="default"
                size="lg"
                onClick={() => {
                  onClose();
                  navigate("/login");
                }}
                className="w-full"
              >
                <Key className="w-5 h-5" />
                <span>লগইন করুন</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  onClose();
                  navigate("/signup");
                }}
                className="w-full"
              >
                <UserPlus className="w-5 h-5" />
                <span>নতুন অ্যাকাউন্ট খুলুন</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface WeeklyExamCardProps {
  exam: Exam;
  index: number;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const WeeklyExamCard = ({
  exam,
  index,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: WeeklyExamCardProps) => {
  const { user, isAuthenticated } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchMove = useRef(false);

  const isGuest = !isAuthenticated;
  const isStudent = user?.role === "student";

  const color = COLORS[index % COLORS.length];
  const images = Array.isArray(exam.images) ? exam.images : [];
  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  const numberInfo = getNumberInfo(exam);
  const canSeeQuestion = !isGuest && !isStudent && !!exam.question;
  const showActions = canEdit || canDelete;

  const openLoginPromptIfGuest = () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return true;
    }
    return false;
  };

  const handleCopy = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (openLoginPromptIfGuest()) return;

    const lines = [
      `পরীক্ষা নং = ${toBn(exam.ExamNumber)}`,
      numberInfo ? `${numberInfo.label} নং = ${numberInfo.value}` : null,
      `${exam.class} = ${exam.subject} - ${toBn(exam.mark)} নম্বর`,
      "",
      "📝 বিষয়বস্তু:",
      exam.topics,
      canSeeQuestion ? `\n❓ প্রশ্ন:\n${exam.question}` : null,
    ].filter((line): line is string => line !== null);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // optionally toast দিতে পারো
    }
  };

  const handleDetailClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (openLoginPromptIfGuest()) return;
    setShowModal(true);
  };

  const handleImageTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isTouchMove.current = false;
  };

  const handleImageTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);

    if (dx > 8 || dy > 8) {
      isTouchMove.current = true;
    }
  };

  const handleImageTouchEnd = () => {
    if (isTouchMove.current) return;
    if (openLoginPromptIfGuest()) return;

    setShowModal(true);
    touchStartPos.current = null;
  };

  const handleEditClick = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    onDelete?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.07,
          duration: 0.48,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ y: -4 }}
        className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-[var(--color-bg)] shadow-md transition-all duration-300 bangla border-[var(--color-active-border)]/60 hover:border-[var(--color-active-border)]/90 hover:shadow-xl ${
          isGuest ? "cursor-pointer" : ""
        }`}
      >
        {/* ── Image Section ── */}
        <div
          className="relative aspect-video cursor-pointer overflow-hidden select-none bg-[var(--color-bg)]"
          onTouchStart={handleImageTouchStart}
          onTouchMove={handleImageTouchMove}
          onTouchEnd={handleImageTouchEnd}
        >
          {hasImages ? (
            <div className="h-full w-full">
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {multipleImages && (
                <SlideProgress key={progressKey} color={color} />
              )}

              <Swiper
                onSlideChange={(swiper) => {
                  setActiveSlide(swiper.realIndex);
                  setProgressKey((prev) => prev + 1);
                }}
                modules={[Autoplay]}
                autoplay={
                  multipleImages
                    ? {
                        delay: 3800,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }
                    : false
                }
                loop={multipleImages}
                className="h-full w-full"
              >
                {images.map((img, i) => (
                  <SwiperSlide key={i}>
                    <AnimatedSlide
                      img={img}
                      isActive={i === activeSlide}
                      className="h-full w-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {multipleImages && (
                <SlideDots
                  count={images.length}
                  active={activeSlide}
                  color={color}
                />
              )}
            </div>
          ) : (
            <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-6">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                }}
              />
              <p className="z-10 px-4 text-center text-2xl font-bold tracking-tight text-[var(--color-text)]">
                {exam.subject}
              </p>
              <p className="z-10 mt-3 text-lg font-bold tracking-wide text-[var(--color-text)]">
                পরীক্ষার ধারণা
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          )}

          {/* Question badge */}
          {canSeeQuestion && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-lg bg-[var(--color-warning)]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              প্রশ্ন আছে
            </motion.div>
          )}

          {/* Delete btn */}
          {showActions && canDelete && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="absolute bottom-0 left-0 z-30"
            >
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteClick}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleDeleteClick(e);
                }}
                className="rounded-none rounded-tr-xl px-4 py-2.5 text-xs font-bold shadow-lg touch-manipulation"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Delete</span>
              </Button>
            </motion.div>
          )}

          {/* Edit btn */}
          {showActions && canEdit && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="absolute right-0 bottom-0 z-30"
            >
              <Button
                size="sm"
                variant="accent"
                onClick={handleEditClick}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleEditClick(e);
                }}
                className="rounded-none rounded-tl-xl px-4 py-2.5 text-xs font-bold shadow-lg touch-manipulation"
                title="সম্পাদনা করুন"
              >
                <Pencil className="w-4 h-4 shrink-0" />
                <span>Edit</span>
              </Button>
            </motion.div>
          )}

          {/* Guest hover overlay */}
          {isGuest && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--color-text)] dark:bg-black/80">
                দেখতে লগইন করুন
              </div>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold leading-tight tracking-tight text-[var(--color-text)] md:text-2xl">
                {exam.subject}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[var(--color-gray)]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate">{exam.teacher || "—"}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>{exam.date}</span>
                </div>

                {numberInfo && (
                  <div className="flex items-center gap-1.5">
                    <Fan className="h-4 w-4 shrink-0 animate-spin" />
                    <span>
                      {numberInfo.label} - {numberInfo.value}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Copy */}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopy}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleCopy(e);
              }}
              className={`size-10 rounded-xl touch-manipulation ${
                copied
                  ? "bg-[var(--color-success-soft)] text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
                  : "text-[var(--color-gray)] hover:bg-[var(--color-active-bg)] hover:text-[var(--color-text)]"
              }`}
              aria-label="কপি করুন"
              title="কপি করুন"
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Topics */}
          <p className="mt-4 flex-1 text-md leading-relaxed text-[var(--color-gray)] line-clamp-3 md:text-lg">
            {exam.topics}
          </p>

          {/* Question preview */}
          {canSeeQuestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 rounded-lg border p-3 bg-[var(--color-warning-soft)] border-[var(--color-warning)]/30"
            >
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-warning)]">
                <HelpCircle className="w-3.5 h-3.5" />
                প্রশ্ন
              </div>
              <p className="line-clamp-2 text-sm text-[var(--color-text)]">
                {exam.question}
              </p>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--color-active-border)] px-3.5 py-1 text-sm font-medium text-[var(--color-gray)] md:text-md">
                {exam.class}
              </span>
              <span className="rounded-full border border-[var(--color-active-border)] px-3.5 py-1 text-sm font-medium text-[var(--color-gray)] md:text-md">
                {toBn(exam.mark)} নম্বর
              </span>
            </div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button
                variant="default"
                size="md"
                onClick={handleDetailClick}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDetailClick(e);
                }}
                className="touch-manipulation"
              >
                <Eye className="h-4 w-4" />
                বিস্তারিত
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Login Prompt */}
      <AnimatePresence>
        {showLoginPrompt && (
          <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
        )}
      </AnimatePresence>

      {/* Exam Modal */}
      {showModal && !isGuest && (
        <ExamModal
          exam={exam}
          color={color}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default WeeklyExamCard;
