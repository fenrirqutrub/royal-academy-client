// src/components/WeeklyExam/WeeklyExamCard.tsx
import { useState, useRef } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";

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

interface WeeklyExamCardProps {
  exam: Exam;
  index: number;
}

const WeeklyExamCard = ({ exam, index }: WeeklyExamCardProps) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const swiperRef = useRef<SwiperType | null>(null);

  const color = COLORS[index % COLORS.length];

  const images = Array.isArray(exam.images) ? exam.images : [];
  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  // Get number info (page or chapter)
  const numberInfo = getNumberInfo(exam);
  const isPageType = exam.numberType === "pageNumber";

  // ─── Role Check: Student কিনা ─────────────────────────────
  const isStudent = user?.role === "student";

  // Student না হলেই question দেখাবে
  const canSeeQuestion = !isStudent && !!exam.question;

  const handleCopy = () => {
    const lines = [
      `পরীক্ষা নং = ${toBn(exam.ExamNumber)}`,
      numberInfo ? `${numberInfo.label} নং = ${numberInfo.value}` : null,
      `${exam.class} = ${exam.subject} - ${toBn(exam.mark)} নম্বর`,
      ``,
      `📝 বিষয়বস্তু:`,
      exam.topics,
      // Question শুধু non-student দের জন্য copy হবে
      canSeeQuestion ? `\n❓ প্রশ্ন:\n${exam.question}` : null,
    ].filter((l): l is string => l !== null);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
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
        className="group overflow-hidden rounded-xl bg-[var(--color-bg)] border border-[var(--color-active-border)]/60 hover:border-[var(--color-active-border)]/90 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bangla"
      >
        {/* Image / No Image Section */}
        <div className="relative aspect-video overflow-hidden bg-[var(--color-bg)]">
          {hasImages ? (
            <>
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

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

          {/* Question indicator badge - শুধু non-student দের জন্য */}
          {canSeeQuestion && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 
                rounded-full bg-amber-500 text-white text-xs font-semibold shadow-lg"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              প্রশ্ন আছে
            </motion.div>
          )}
        </div>

        {/* Content */}
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
                    {isPageType ? (
                      <Fan className="h-4 w-4 animate-spin" />
                    ) : (
                      <Fan className="h-4 w-4 animate-spin" />
                    )}
                    <span>
                      {numberInfo.label} - {numberInfo.value}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`p-2.5 rounded-xl transition-all ${
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

          {/* Topics Preview */}
          <p className="text-md md:text-lg leading-relaxed text-[var(--color-gray)] line-clamp-3 mt-4 flex-1">
            {exam.topics}
          </p>

          {/* Question Preview - শুধু non-student দের জন্য */}
          {canSeeQuestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 
                border border-amber-200 dark:border-amber-800/50"
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
              onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:bg-opacity-90 transition-all"
            >
              <Eye className="h-4 w-4" />
              বিস্তারিত
            </motion.button>
          </div>
        </div>
      </motion.div>

      {showModal && (
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
