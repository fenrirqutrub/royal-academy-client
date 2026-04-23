// src/components/WeeklyExam/WeeklyExamCard.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import "swiper/css";
import ExamModal from "./ExamModal";
import {
  type ExamImage,
  AnimatedSlide,
  SlideDots,
  SlideProgress,
  toBn,
  getNumberInfo,
} from "../../utility/Formatters";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import { getCloudinaryOptimizedUrls } from "../../hooks/useCloudinaryUpload";
import toast from "react-hot-toast";
import { COLORS } from "../../styles/colors";
import type { WeeklyExamCardProps } from "../../types/types";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";

const WeeklyExamCard = ({
  exam,
  index,
  activeExamNumber,
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

  const isGuest = !isAuthenticated;
  const isStudent = user?.role === "student";

  const color = COLORS[index % COLORS.length];
  const images = Array.isArray(exam.images) ? exam.images : [];
  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  const numberInfo = getNumberInfo(exam);
  const canSeeQuestion = !isGuest && !isStudent && !!exam.question;

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
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "কপি করতে ব্যর্থ হয়েছে",
      );
    }
  };

  const handleDetailClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (openLoginPromptIfGuest()) return;
    setShowModal(true);
  };

  const getImageUrl = (img: string | ExamImage): string => {
    if (typeof img === "string") return img;
    return img.url ?? img.imageUrl ?? "";
  };

  return (
    <div>
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
        <div className="relative aspect-video overflow-hidden select-none bg-[var(--color-bg)]">
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
                {images.map((img, i) => {
                  const imgUrl = getImageUrl(img);
                  const urls = getCloudinaryOptimizedUrls(imgUrl);

                  return (
                    <SwiperSlide key={i}>
                      <AnimatedSlide
                        img={urls.thumb || imgUrl}
                        isActive={i === activeSlide}
                        className="h-full w-full object-cover"
                      />
                    </SwiperSlide>
                  );
                })}
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
                পরীক্ষার ধারণা নং - {toBn(activeExamNumber ?? "")}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          )}

          {/* Question badge */}
          {canSeeQuestion && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--color-bg)] shadow-lg bg-[var(--color-text)]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              প্রশ্ন আছে
            </motion.div>
          )}

          {/* ── REMOVED: Edit/Delete buttons from card ── */}

          {/* Guest hover overlay */}
          {isGuest && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-bg)]/20 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-[var(--color-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
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
                  <span className="flex items-center gap-x-2 px-3.5 py-1 text-sm font-medium text-[var(--color-gray)] md:text-md">
                    <Fan className="w-4 h-4 animate-spin" />
                    {numberInfo.label} - {numberInfo.value}
                  </span>
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
          <p className="mt-4 flex-1 text-md leading-relaxed bg-[var(--color-active-bg)] px-4 py-1 rounded text-[var(--color-gray)] line-clamp-3 md:text-lg">
            {exam.topics}
          </p>

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
              <button
                onClick={handleDetailClick}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDetailClick(e);
                }}
                className=" flex items-center gap-x-2 rounded-full border border-[var(--color-active-border)] px-3 py-1 text-sm font-medium text-[var(--color-gray)] md:text-md"
              >
                <Eye className="h-4 w-4" />
                বিস্তারিত
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Login Prompt */}
      <AnimatePresence>
        <LoginPromptOverlay
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
        />
      </AnimatePresence>

      {/* Exam Modal - Pass edit/delete props */}
      {showModal && !isGuest && (
        <ExamModal
          exam={exam}
          color={color}
          onClose={() => setShowModal(false)}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default WeeklyExamCard;
