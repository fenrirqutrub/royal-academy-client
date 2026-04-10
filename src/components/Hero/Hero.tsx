import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type JSX,
} from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Link } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Circle,
  Play,
  Pause,
} from "lucide-react";
import { useHeroes } from "../../hooks/useHeroes";
import "swiper/css";
import ErrorState from "../common/ErrorState";
import Skeleton from "../common/Skeleton";
import EmptyState from "../common/Emptystate";

interface HeroItem {
  _id: string;
  imageUrl: string;
  title: string;
  uniqueID: string;
  imagePublicId: string;
  createdAt: string;
  updatedAt: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  tag?: string;
}

const DELAY = 6000;
const pad = (n: number): string => String(n).padStart(2, "0");

// Floating particles component
const FloatingParticles = (): JSX.Element => {
  const particles = useMemo(
    () =>
      [...Array(12)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 3,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-2 h-2 text-white/20" />
        </motion.div>
      ))}
    </div>
  );
};

// Animated Title Component
interface AnimatedTitleProps {
  text: string;
  delay?: number;
}

const AnimatedTitle = ({
  text,
  delay = 0,
}: AnimatedTitleProps): JSX.Element => {
  const words = text.split(" ");

  return (
    <h1 className="m-0 bangla flex flex-wrap gap-x-2 md:gap-x-3 lg:gap-x-4 leading-tight">
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden inline-block">
          <motion.span
            className="inline-block text-white font-black drop-shadow-2xl text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
            initial={{ y: "120%", rotateX: -80, opacity: 0 }}
            animate={{ y: "0%", rotateX: 0, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: delay + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
};

// Animated Gradient Line
const AnimatedLine = ({ delay = 0 }: { delay?: number }): JSX.Element => (
  <motion.div
    className="h-0.5 md:h-1 w-12 md:w-16 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full"
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 1 }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ originX: 0 }}
  />
);

// Navigation Button Component
interface NavButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}

const NavButton = ({
  direction,
  onClick,
  disabled,
}: NavButtonProps): JSX.Element => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className="group relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-white/20 text-white/60 disabled:opacity-20 cursor-pointer bg-white/5 backdrop-blur-sm overflow-hidden transition-colors hover:border-white/40 hover:text-white"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
  >
    <motion.span
      className="absolute inset-0 bg-white/10 rounded-full"
      initial={{ scale: 0 }}
      whileHover={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    />
    {direction === "prev" ? (
      <ChevronLeft className="relative z-10 w-4 h-4 md:w-5 md:h-5" />
    ) : (
      <ChevronRight className="relative z-10 w-4 h-4 md:w-5 md:h-5" />
    )}
  </motion.button>
);

// Progress Dot Component
interface DotProps {
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const ProgressDot = ({ isActive, onClick, index }: DotProps): JSX.Element => (
  <motion.button
    onClick={onClick}
    className="relative cursor-pointer border-0 bg-transparent p-1"
    aria-label={`Go to slide ${index + 1}`}
    whileHover={{ scale: 1.3 }}
  >
    <motion.span
      className="block rounded-full"
      animate={{
        width: isActive ? 24 : 8,
        height: 8,
        backgroundColor: isActive
          ? "rgb(255, 255, 255)"
          : "rgba(255, 255, 255, 0.25)",
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    />
    {isActive && (
      <motion.span
        className="absolute inset-0 rounded-full bg-white/40 blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layoutId="dotGlow"
      />
    )}
  </motion.button>
);

const Hero = (): JSX.Element | null => {
  const { data, isLoading, isError, error, refetch } = useHeroes();
  const heroes = useMemo<HeroItem[]>(
    () => (data?.data ?? []) as HeroItem[],
    [data],
  );
  const total = heroes.length;

  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [1, -1]);
  const rotateY = useTransform(mouseX, [0, 1], [-1, 1]);

  // Preload images
  useEffect(() => {
    heroes.forEach(({ imageUrl }, i) => {
      if (i > 0) {
        const img = new Image();
        img.src = imageUrl;
      }
    });
  }, [heroes]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY],
  );

  const onSlideChange = useCallback((s: SwiperType) => {
    setActive(s.realIndex);
    setAnimKey((k) => k + 1);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      if (busy || i === active) return;
      setBusy(true);
      swiperRef.current?.slideToLoop(i);
      setTimeout(() => setBusy(false), 1000);
    },
    [busy, active],
  );

  const go = useCallback(
    (direction: "prev" | "next") => {
      if (busy) return;
      setBusy(true);

      if (direction === "next") {
        swiperRef.current?.slideNext();
      } else {
        swiperRef.current?.slidePrev();
      }

      setTimeout(() => setBusy(false), 1000);
    },
    [busy],
  );

  const handleSwiper = useCallback((swiper: SwiperType) => {
    swiperRef.current = swiper;
  }, []);

  const toggleAutoplay = useCallback(() => {
    if (isPaused) {
      swiperRef.current?.autoplay.start();
    } else {
      swiperRef.current?.autoplay.stop();
    }
    setIsPaused(!isPaused);
  }, [isPaused]);

  if (isLoading) return <Skeleton variant="hero" />;
  if (isError) {
    return (
      <ErrorState message={(error as Error)?.message ?? "Unexpected error."} />
    );
  }
  if (!total) return <EmptyState />;

  const cur = heroes[active];
  const canLoop = total >= 3;

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 h-[300px]  md:h-[480px] "
      aria-label="Hero slider"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ghost Swiper for autoplay */}
      <Swiper
        modules={canLoop ? [Autoplay] : []}
        autoplay={
          canLoop
            ? {
                delay: DELAY,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
              }
            : false
        }
        loop={canLoop}
        speed={1000}
        allowTouchMove={total > 1}
        className="!absolute !inset-0 !opacity-0 !pointer-events-none"
        onSwiper={handleSwiper}
        onSlideChange={onSlideChange}
      >
        {heroes.map((h) => (
          <SwiperSlide key={h._id} />
        ))}
      </Swiper>

      {/* Background Image with parallax */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`img-${animKey}`}
          className="absolute inset-0 z-0"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.05, opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 1200,
            transformStyle: "preserve-3d",
          }}
        >
          <motion.img
            src={cur.imageUrl}
            alt={cur.title}
            className="w-full h-full object-cover"
            loading="eager"
            animate={{ scale: isHovered ? 1.03 : 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          GRADIENT OVERLAYS - LIGHTER VERSION
      ═══════════════════════════════════════════ */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Bottom gradient - for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Left gradient - subtle */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Top gradient - minimal for tag readability */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/25 to-transparent" />
      </div>

      {/* Floating particles */}
      <FloatingParticles />

      {/* Top accent line animation */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-30 overflow-hidden">
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ═══════════════════════════════════════════
          TOP SECTION - Tag & Counter
      ═══════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 md:px-10 lg:px-14 pt-4 sm:pt-6 md:pt-8">
        {/* Tag */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tag-${animKey}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="relative group cursor-default"
              whileHover={{ scale: 1.02 }}
            >
              {/* Glow on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-orange-500/0 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <span className="relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/70 text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] uppercase bangla font-medium">
                <Circle className="w-1.5 h-1.5 fill-amber-400 text-amber-400" />
                {cur.tag ?? "রয়েল একাডেমি · বেলকুচি"}
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Counter - Cinematic style */}
        {total > 1 && (
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Play/Pause button */}
            <motion.button
              onClick={toggleAutoplay}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border border-white/20 text-white/50 hover:text-white hover:border-white/40 cursor-pointer bg-white/5 backdrop-blur-sm transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
            >
              {isPaused ? (
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              ) : (
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </motion.button>

            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`counter-${active}`}
                  className="text-white font-black tabular-nums text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                  style={{
                    lineHeight: 1,
                    textShadow: "0 0 40px rgba(255,255,255,0.2)",
                  }}
                  initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -20, opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {pad(active + 1)}
                </motion.span>
              </AnimatePresence>

              <div className="flex flex-col gap-1">
                <motion.div
                  className="w-6 sm:w-8 md:w-10 h-[1px] bg-gradient-to-r from-white/40 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                />
                <span className="text-white/30 text-[10px] sm:text-xs md:text-sm tabular-nums font-medium">
                  {pad(total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT - Bottom Left
      ═══════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 md:px-10 lg:px-14 pb-6 sm:pb-8 md:pb-10 lg:pb-14">
        <div className="max-w-4xl">
          {/* Animated line */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`line-${animKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3 sm:mb-4 md:mb-5"
            >
              <AnimatedLine delay={0.1} />
            </motion.div>
          </AnimatePresence>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${animKey}`}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
              className="mb-3 sm:mb-4 md:mb-5"
            >
              <AnimatedTitle text={cur.title} delay={0.15} />
            </motion.div>
          </AnimatePresence>

          {/* Subtitle */}
          <AnimatePresence mode="wait">
            {cur.subtitle && (
              <motion.p
                key={`sub-${animKey}`}
                className="m-0 text-white/60 bangla font-light leading-relaxed max-w-md lg:max-w-lg mb-4 sm:mb-5 md:mb-6 text-xs sm:text-sm md:text-base"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {cur.subtitle}
              </motion.p>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <AnimatePresence mode="wait">
            {cur.ctaLabel && (
              <motion.div
                key={`cta-${animKey}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Link
                  to={cur.ctaHref ?? "#"}
                  className="group relative inline-flex items-center no-underline"
                >
                  {/* Glow effect */}
                  <motion.div
                    className="absolute -inset-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-xl"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Button */}
                  <motion.span
                    className="relative flex items-center gap-2 sm:gap-3 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-white text-black rounded-xl overflow-hidden font-bold transition-shadow duration-300 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Shimmer */}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -skew-x-12"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "200%" }}
                      transition={{ duration: 0.8 }}
                    />

                    <span className="relative uppercase tracking-wider bangla text-[10px] sm:text-xs md:text-sm">
                      {cur.ctaLabel}
                    </span>

                    <motion.span
                      className="relative"
                      animate={{ x: [0, 3, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </motion.span>
                  </motion.span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT SIDE - Navigation
      ═══════════════════════════════════════════ */}
      {total > 1 && (
        <div className="absolute right-4 sm:right-6 md:right-10 lg:right-14 bottom-6 sm:bottom-8 md:bottom-10 lg:bottom-14 z-20 flex flex-col items-end gap-4 md:gap-6">
          {/* Thumbnail preview - Desktop only */}
          <div className="hidden lg:flex items-end gap-2">
            {heroes.map((h, i) => (
              <motion.button
                key={h._id}
                onClick={() => goTo(i)}
                className="relative overflow-hidden cursor-pointer border-0 p-0 bg-transparent group rounded-lg"
                animate={{
                  width: i === active ? 90 : 55,
                  height: i === active ? 60 : 38,
                  opacity: i === active ? 1 : 0.5,
                }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                aria-label={`Go to slide: ${h.title}`}
              >
                <img
                  src={h.imageUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />

                {/* Active indicator */}
                <AnimatePresence>
                  {i === active && (
                    <motion.span
                      className="absolute inset-0 border-2 border-white rounded-lg"
                      initial={{ opacity: 0, scale: 1.2 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-200" />
              </motion.button>
            ))}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-3 md:gap-4">
            <NavButton
              direction="prev"
              onClick={() => go("prev")}
              disabled={busy}
            />

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {heroes.map((_, i) => (
                <ProgressDot
                  key={i}
                  isActive={i === active}
                  onClick={() => goTo(i)}
                  index={i}
                />
              ))}
            </div>

            <NavButton
              direction="next"
              onClick={() => go("next")}
              disabled={busy}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          BOTTOM PROGRESS BAR
      ═══════════════════════════════════════════ */}
      {total > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          {/* Background track */}
          <div className="h-[3px] bg-white/10" />

          {/* Progress fill */}
          <motion.div
            key={`prog-${animKey}`}
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isPaused ? undefined : 1 }}
            transition={{
              duration: DELAY / 1000,
              ease: "linear",
            }}
            style={{ originX: 0 }}
          />

          {/* Glow effect */}
          <motion.div
            key={`glow-${animKey}`}
            className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400/30 via-orange-500/30 to-red-500/30 blur-sm"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isPaused ? undefined : 1 }}
            transition={{
              duration: DELAY / 1000,
              ease: "linear",
            }}
            style={{ originX: 0 }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          DECORATIVE ELEMENTS
      ═══════════════════════════════════════════ */}

      {/* Corner rotating circle - Desktop only */}
      <div className="absolute top-6 right-20 md:top-8 md:right-28 lg:top-10 lg:right-36 z-10 pointer-events-none hidden md:block">
        <motion.div
          className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 border border-white/[0.06] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Circle className="w-2 h-2 fill-white/20 text-white/20" />
          </motion.div>
        </motion.div>
      </div>

      {/* Left side decoration - Desktop only */}
      <div className="absolute left-6 md:left-10 lg:left-14 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-3 pointer-events-none">
        <motion.div
          className="w-px h-14 bg-gradient-to-b from-transparent via-white/15 to-transparent"
          animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="w-2 h-2 rounded-full border border-white/15"
          animate={{
            scale: [1, 1.3, 1],
            borderColor: [
              "rgba(255,255,255,0.15)",
              "rgba(255,255,255,0.3)",
              "rgba(255,255,255,0.15)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="w-px h-14 bg-gradient-to-b from-transparent via-white/15 to-transparent"
          animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.2, 0.5, 0.2] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>
    </section>
  );
};

export default Hero;
