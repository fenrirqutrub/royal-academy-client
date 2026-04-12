import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import { useHeroes } from "../../hooks/useHeroes";
import "swiper/css";
import ErrorState from "../common/ErrorState";
import Skeleton from "../common/Skeleton";
import EmptyState from "../common/Emptystate";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

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

const DELAY = 5000;
const pad = (n: number) => String(n).padStart(2, "0");

/* ── Word-by-word animated title ── */
const SlideTitle = ({
  text,
  triggerKey,
}: {
  text: string;
  triggerKey: number;
}) => {
  const words = useMemo(() => text.split(" "), [text]);

  return (
    <h2
      key={triggerKey}
      aria-label={text}
      className="m-0 flex flex-wrap gap-x-2 bangla text-xl md:text-5xl"
      style={{
        fontWeight: 700,
        lineHeight: 1.3,
        color: "#fff",
      }}
    >
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden inline-block">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0, rotateX: -20 }}
            animate={{ y: "0%", opacity: 1, rotateX: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.1 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h2>
  );
};

/* ── Image with zoom-in pan effect ── */
const HeroImage = ({
  src,
  alt,
  dir,
}: {
  src: string;
  alt: string;
  dir: number;
}) => (
  <motion.div
    className="absolute inset-0"
    initial={{ opacity: 0, scale: 1.08, x: dir * 30 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.96, x: dir * -20 }}
    transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover object-center"
      loading="eager"
      width={1920}
      height={1080}
    />
  </motion.div>
);

/* ════════════════════════
   HERO
════════════════════════ */
const Hero = () => {
  const { data, isLoading, isError, error, refetch } = useHeroes();
  const heroes = useMemo<HeroItem[]>(
    () => (data?.data ?? []) as HeroItem[],
    [data],
  );
  const total = heroes.length;

  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);

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

  const onSlideChange = useCallback((s: SwiperType) => {
    setActive(s.realIndex);
    setAnimKey((k) => k + 1);
  }, []);

  const go = useCallback(
    (d: "prev" | "next") => {
      if (busy) return;
      setBusy(true);
      setDir(d === "next" ? 1 : -1);
      if (d === "next") swiperRef.current?.slideNext();
      else swiperRef.current?.slidePrev();
      setTimeout(() => setBusy(false), 900);
    },
    [busy],
  );

  const goTo = useCallback(
    (i: number) => {
      if (busy || i === active) return;
      setBusy(true);
      setDir(i > active ? 1 : -1);
      swiperRef.current?.slideToLoop(i);
      setTimeout(() => setBusy(false), 900);
    },
    [busy, active],
  );

  /* ── Loading ── */
  if (isLoading) {
    return <Skeleton variant="hero" />;
  }

  /* ── Error ── */
  if (isError) {
    return (
      <ErrorState message={(error as Error)?.message ?? "Unexpected error."} />
    );
  }

  /* ── Empty ── */
  if (!total) {
    return <EmptyState />;
  }

  const cur = heroes[active];

  return (
    <section
      className="w-full h-60 md:h-[470px] relative overflow-hidden bg-neutral-950"
      aria-label="Hero slider"
    >
      {/* Ghost Swiper */}
      <Swiper
        modules={total > 1 ? [Autoplay] : []}
        autoplay={
          total > 1
            ? {
                delay: DELAY,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        loop={total > 1}
        speed={900}
        allowTouchMove={false}
        className="!absolute !inset-0 !opacity-0 !pointer-events-none"
        onSwiper={(s) => {
          swiperRef.current = s;
        }}
        onSlideChange={onSlideChange}
      >
        {heroes.map((h) => (
          <SwiperSlide key={h._id} />
        ))}
      </Swiper>

      {/* ── Image with directional pan ── */}
      <AnimatePresence initial={false} custom={dir}>
        <HeroImage
          key={`img-${animKey}`}
          src={cur.imageUrl}
          alt={cur.title}
          dir={dir}
        />
      </AnimatePresence>

      {/* ── Overlays ── */}
      <div className="absolute inset-0 z-[1] bg-black/15" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/35 via-black/15 to-transparent" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/55 via-transparent to-transparent" />

      {/* ── Animated corner bracket top-left ── */}
      <motion.div
        key={`bracket-${animKey}`}
        className="absolute top-4 left-4 md:top-6 md:left-7 z-20"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative w-6 h-6 md:w-8 md:h-8">
          <span className="absolute top-0 left-0 w-full h-[1.5px] bg-white/60" />
          <span className="absolute top-0 left-0 w-[1.5px] h-full bg-white/60" />
        </div>
      </motion.div>

      {/* ── Animated corner bracket bottom-right ── */}
      <motion.div
        key={`bracket2-${animKey}`}
        className="absolute bottom-8 right-4 md:bottom-10 md:right-7 z-20"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative w-6 h-6 md:w-8 md:h-8">
          <span className="absolute bottom-0 right-0 w-full h-[1.5px] bg-white/60" />
          <span className="absolute bottom-0 right-0 w-[1.5px] h-full bg-white/60" />
        </div>
      </motion.div>

      {/* ── Slide number top-right ── */}
      {total > 1 && (
        <div className="absolute top-4 right-5 md:top-6 md:right-8 z-20 flex items-baseline gap-1 select-none pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.span
              key={`num-${active}`}
              className="text-white/90 font-bold leading-none text-lg md:text-2xl"
              style={{ fontFamily: "'Noto Serif Bengali', serif" }}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {pad(active + 1)}
            </motion.span>
          </AnimatePresence>
          <span className="text-white/30 text-[0.6rem] tracking-wide">
            / {pad(total)}
          </span>
        </div>
      )}

      {/* ── Content bottom ── */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-5 md:px-12 pb-6 md:pb-9 flex flex-col gap-2">
        {/* Tag with animated underline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tag-${animKey}`}
            className="flex items-center gap-2 overflow-hidden"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              className="block h-px bg-white/50"
              initial={{ width: 0 }}
              animate={{ width: 20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            />
            <span className="text-white/55 uppercase tracking-[0.24em] text-[0.58rem]">
              {cur.tag ?? "রয়েল একাডেমি, বেলকুচি"}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`title-${animKey}`}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
          >
            <SlideTitle text={cur.title} triggerKey={animKey} />
          </motion.div>
        </AnimatePresence>

        {/* Subtitle — desktop */}
        <AnimatePresence mode="wait">
          {cur.subtitle && (
            <motion.p
              key={`sub-${animKey}`}
              className="m-0 text-white/50 hidden md:block bangla"
              style={{
                fontSize: "0.82rem",
                fontWeight: 300,
                lineHeight: 1.7,
                maxWidth: "52ch",
              }}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
            >
              {cur.subtitle}
            </motion.p>
          )}
        </AnimatePresence>

        {/* CTA + dots */}
        <div className="flex items-center justify-between gap-4 mt-0.5">
          {cur.ctaLabel ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`cta-${animKey}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  delay: 0.45,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link
                  to={cur.ctaHref ?? "#"}
                  className="group inline-flex items-center gap-2.5 px-4 py-2 border border-white/30 text-white/90 hover:bg-white hover:text-black hover:border-white transition-all duration-300 no-underline bangla"
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  {cur.ctaLabel}
                  <ArrowRight className="w-[11px] h-[11px]" />
                </Link>
              </motion.div>
            </AnimatePresence>
          ) : (
            <span />
          )}

          {/* Dots + prev/next */}
          {total > 1 && (
            <div className="flex items-center gap-3">
              {/* Prev */}
              <button
                onClick={() => go("prev")}
                disabled={busy}
                className="w-7 h-7 flex items-center justify-center border border-white/20 text-white/60 hover:text-white hover:border-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer bg-transparent"
                aria-label="Previous"
              >
                <ChevronLeft className="w-[10px] h-[10px]" />
              </button>

              {/* Animated dots */}
              <div className="flex items-center gap-1.5">
                {heroes.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => goTo(i)}
                    className="border-0 p-0 cursor-pointer rounded-full"
                    animate={{
                      width: i === active ? 22 : 6,
                      background:
                        i === active
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.3)",
                    }}
                    style={{ height: 6 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Next */}
              <button
                onClick={() => go("next")}
                disabled={busy}
                className="w-7 h-7 flex items-center justify-center border border-white/20 text-white/60 hover:text-white hover:border-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer bg-transparent"
                aria-label="Next"
              >
                <ChevronRight className="w-[10px] h-[10px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress line ── */}
      {total > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-[2px] bg-white/10">
          <motion.div
            key={`prog-${animKey}`}
            className="h-full bg-white/60 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: DELAY / 1000, ease: "linear" }}
          />
        </div>
      )}
    </section>
  );
};

export default Hero;
