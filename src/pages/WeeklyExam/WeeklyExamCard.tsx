// src/components/WeeklyExam/WeeklyExamCard.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
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
import "swiper/css/pagination";
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
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

        <button
          onClick={onClose}
          className="absolute top-5 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="px-6 py-8 sm:px-8 sm:py-10 text-center bangla">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-[var(--color-active-bg)] border-2 border-[var(--color-active-border)] flex items-center justify-center">
              <Key className="w-9 h-9 text-[var(--color-text)]" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3">
            লগইন প্রয়োজন
          </h2>

          <p className="text-sm sm:text-base text-[var(--color-gray)] mb-8 leading-relaxed max-w-xs mx-auto">
            বিস্তারিত দেখতে এবং সকল ফিচার ব্যবহার করতে লগইন করুন
          </p>

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
              <Key className="w-5 h-5" />
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

// ─── Props ────────────────────────────────────────────────────────────────────
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
  const swiperRef = useRef<SwiperType | null>(null);

  const isGuest = !isAuthenticated;
  const color = COLORS[index % COLORS.length];

  const images = Array.isArray(exam.images) ? exam.images : [];
  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  const numberInfo = getNumberInfo(exam);
  const isStudent = user?.role === "student";
  const canSeeQuestion = !isGuest && !isStudent && !!exam.question;
  const showActions = canEdit || canDelete;

  const handleGuestInteraction = () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return true;
    }
    return false;
  };

  const handleCopy = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (handleGuestInteraction()) return;

    const lines = [
      `পরীক্ষা নং = ${toBn(exam.ExamNumber)}`,
      numberInfo ? `${numberInfo.label} নং = ${numberInfo.value}` : null,
      `${exam.class} = ${exam.subject} - ${toBn(exam.mark)} নম্বর`,
      ``,
      `📝 বিষয়বস্তু:`,
      exam.topics,
      canSeeQuestion ? `\n❓ প্রশ্ন:\n${exam.question}` : null,
    ].filter((l): l is string => l !== null);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDetailClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (handleGuestInteraction()) return;
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
    if (handleGuestInteraction()) return;
    setShowModal(true);
    touchStartPos.current = null;
  };

  const handleImageClick = () => {
    if (isTouchMove.current) return;
    if (handleGuestInteraction()) return;
    setShowModal(true);
  };

  const handleEditTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.();
  };

  const handleDeleteTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        className={`group overflow-hidden rounded-xl bg-[var(--color-bg)] border border-[var(--color-active-border)]/60 hover:border-[var(--color-active-border)]/90 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bangla ${isGuest ? "cursor-pointer" : ""}`}
      >
        {/* ── Image Section ── */}
        <div
          className="relative aspect-video overflow-hidden bg-[var(--color-bg)] cursor-pointer select-none"
          onClick={handleImageClick}
          onTouchStart={handleImageTouchStart}
          onTouchMove={handleImageTouchMove}
          onTouchEnd={handleImageTouchEnd}
        >
          {hasImages ? (
            <>
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {multipleImages && (
                <SlideProgress key={progressKey} color={color} />
              )}

              <Swiper
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                onSlideChange={(swiper) => {
                  setActiveSlide(swiper.realIndex);
                  setProgressKey((prev) => prev + 1);
                }}
                modules={[Pagination, Autoplay]}
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
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden p-6">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                }}
              />
              <p className="text-2xl font-bold text-center text-[var(--color-text)] z-10 tracking-tight px-4">
                {exam.subject}
              </p>
              <p className="mt-3 text-lg font-bold text-[var(--color-text)] z-10 tracking-wide">
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
              className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1
                rounded-full bg-amber-500 text-white text-xs font-semibold shadow-lg pointer-events-none"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              প্রশ্ন আছে
            </motion.div>
          )}

          {/* ── Edit btn — bottom LEFT ── */}
          {showActions && canEdit && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleEditClick}
              onTouchEnd={handleEditTouch}
              className="absolute bottom-0 left-0 z-30
                flex items-center gap-2
                px-4 py-2.5
                bg-violet-600 hover:bg-violet-700 active:bg-violet-800
                text-white text-xs font-bold
                rounded-tr-xl
                shadow-lg transition-colors touch-manipulation
                select-none"
              title="সম্পাদনা করুন"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              <span>Edit</span>
            </motion.button>
          )}

          {/* ── Delete btn — bottom RIGHT ── */}
          {showActions && canDelete && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleDeleteClick}
              onTouchEnd={handleDeleteTouch}
              className="absolute bottom-0 right-0 z-30
                flex items-center gap-2
                px-4 py-2.5
                bg-rose-600 hover:bg-rose-700 active:bg-rose-800
                text-white text-xs font-bold
                rounded-tl-xl
                shadow-lg transition-colors touch-manipulation
                select-none"
              title="মুছে ফেলুন"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Delete</span>
            </motion.button>
          )}

          {/* Guest hover overlay */}
          {isGuest && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="px-4 py-2 rounded-full bg-white/90 dark:bg-black/80 text-sm font-semibold text-[var(--color-text)]">
                দেখতে লগইন করুন
              </div>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold leading-tight tracking-tight text-[var(--color-text)]">
                {exam.subject}
              </h3>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[var(--color-gray)] mt-2">
                <div className="flex items-center gap-1.5">
                  <Folder className="h-4 w-4" />
                  <span className="truncate">{exam.teacher || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{exam.date}</span>
                </div>
                {numberInfo && (
                  <div className="flex items-center gap-1.5">
                    <Fan className="h-4 w-4 animate-spin" />
                    <span>
                      {numberInfo.label} - {numberInfo.value}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleCopy(e);
              }}
              className={`p-2.5 rounded-xl transition-all touch-manipulation ${
                copied
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                  : "text-slate-500 hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Topics */}
          <p className="text-md md:text-lg leading-relaxed text-[var(--color-gray)] line-clamp-3 mt-4 flex-1">
            {exam.topics}
          </p>

          {/* Question preview */}
          {canSeeQuestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50"
            >
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                প্রশ্ন
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 line-clamp-2">
                {exam.question}
              </p>
            </motion.div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm md:text-md font-medium px-3.5 py-1 rounded-full border border-[var(--color-active-border)] text-[var(--color-gray)]">
                {exam.class}
              </span>
              <span className="text-sm md:text-md font-medium px-3.5 py-1 rounded-full border border-[var(--color-active-border)] text-[var(--color-gray)]">
                {toBn(exam.mark)} নম্বর
              </span>
            </div>

            <motion.button
              onClick={handleDetailClick}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDetailClick(e);
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:bg-opacity-90 transition-all touch-manipulation"
            >
              <Eye className="h-4 w-4" />
              বিস্তারিত
            </motion.button>
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
