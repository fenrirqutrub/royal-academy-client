import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle2 } from "lucide-react";
import axiosPublic from "../../hooks/axiosPublic";
import Border from "../common/Border";
import Skeleton from "../common/Skeleton";
import { ROLE_CONFIG, type Screen } from "../../utility/Constants";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface TeacherData {
  handle: string;
  degree: string;
  collegeName: string;
  para: string;
  gramNam: string;
  _id: string;
  name: string;
  role: "teacher" | "admin" | "principal" | "student";
  subject?: string;
  designation?: string;
  avatar?: { url?: string };
  image?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────
const CFG: Record<
  Screen,
  {
    cardW: number;
    cardH: number;
    gap: number;
    visible: number;
    rotY: number;
    scaleStep: number;
    fontSize: { name: string; sub: string; badge: string };
    infoRatio: number;
  }
> = {
  mobile: {
    cardW: 160,
    cardH: 230,
    gap: 80,
    visible: 1,
    rotY: 28,
    scaleStep: 0.2,
    fontSize: { name: "0.78rem", sub: "0.67rem", badge: "9px" },
    infoRatio: 0.31,
  },
  tablet: {
    cardW: 200,
    cardH: 280,
    gap: 115,
    visible: 2,
    rotY: 22,
    scaleStep: 0.15,
    fontSize: { name: "0.875rem", sub: "0.75rem", badge: "10px" },
    infoRatio: 0.32,
  },
  desktop: {
    cardW: 255,
    cardH: 340,
    gap: 140,
    visible: 3,
    rotY: 18,
    scaleStep: 0.12,
    fontSize: { name: "1rem", sub: "0.825rem", badge: "10px" },
    infoRatio: 0.33,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const resolveImg = (t: TeacherData): string => {
  const raw = t.avatar?.url ?? t.image ?? "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

// ── useScreen ──────────────────────────────────────────────────────────────────
const useScreen = (): Screen => {
  const get = (): Screen => {
    const w = window.innerWidth;
    return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  };
  const [s, setS] = useState<Screen>(get);
  useEffect(() => {
    let raf: number;
    const h = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setS(get()));
    };
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("resize", h);
      cancelAnimationFrame(raf);
    };
  }, []);
  return s;
};

// ── TeacherCard ────────────────────────────────────────────────────────────────
interface CardProps {
  teacher: TeacherData;
  offset: number;
  cfg: (typeof CFG)[Screen];
  onClick: () => void;
}

const TeacherCard = ({ teacher, offset, cfg, onClick }: CardProps) => {
  const abs = Math.abs(offset);
  const isCenter = offset === 0;
  const imgSrc = resolveImg(teacher);

  const [imgKey, setImgKey] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setImgKey((k) => k + 1);
  }, [teacher._id]);

  const showImg = !!imgSrc && !failed;

  // transform values
  const tx = offset * cfg.gap;
  const ry = offset * -cfg.rotY;
  const scale = isCenter ? 1 : Math.max(0.6, 1 - abs * cfg.scaleStep);
  const opacity = abs > cfg.visible ? 0 : Math.max(0.38, 1 - abs * 0.2);
  const zIndex = 20 - abs;

  const roleColor = ROLE_CONFIG[teacher.role]?.color ?? "#6b7280";
  const RoleIcon = ROLE_CONFIG[teacher.role]?.Icon;
  const roleHandle = ROLE_CONFIG[teacher.role]?.handle ?? teacher.role;
  const infoH = cfg.cardH * cfg.infoRatio;
  const imgH = cfg.cardH - infoH;

  return (
    <motion.div
      onClick={onClick}
      animate={{ x: tx, rotateY: ry, scale, opacity }}
      transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.75 }}
      style={{
        position: "absolute",
        width: cfg.cardW,
        height: cfg.cardH,
        zIndex,
        pointerEvents: abs > cfg.visible ? "none" : "auto",
        cursor: isCenter ? "default" : "pointer",
        willChange: "transform",
        transformStyle: "preserve-3d",
        left: "50%",
        top: "50%",
        marginLeft: -(cfg.cardW / 2),
        marginTop: -(cfg.cardH / 2),
      }}
      className="rounded-2xl overflow-hidden shadow-2xl select-none flex flex-col
                 bg-[var(--color-bg)] border border-[var(--color-active-border)]"
    >
      {/* Glow for center card */}
      <AnimatePresence>
        {isCenter && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: `radial-gradient(ellipse at center, ${roleColor}30 0%, transparent 70%)`,
            }}
            className="absolute -inset-3 -z-10 pointer-events-none blur-2xl"
          />
        )}
      </AnimatePresence>

      {/* ── Image ── */}
      <div
        className="relative overflow-hidden bg-[var(--color-active-bg)] flex-shrink-0"
        style={{ height: imgH }}
      >
        {/* Shimmer */}
        <AnimatePresence>
          {showImg && !loaded && (
            <motion.div
              key="shimmer"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 animate-pulse bg-[var(--color-gray)]/20"
            />
          )}
        </AnimatePresence>

        {/* Image */}
        {showImg && (
          <motion.img
            key={imgKey}
            src={imgSrc}
            alt={teacher.name}
            draggable={false}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        )}

        {/* Fallback */}
        <AnimatePresence>
          {!showImg && (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${roleColor}15, ${roleColor}08)`,
              }}
            >
              <UserCircle2
                strokeWidth={1}
                style={{
                  width: cfg.cardW * 0.42,
                  height: cfg.cardW * 0.42,
                  color: `${roleColor}80`,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />

        {/* Role badge */}
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          style={{
            fontSize: cfg.fontSize.badge,
            backgroundColor: `${roleColor}25`,
            color: roleColor,
            borderColor: `${roleColor}50`,
          }}
          className="absolute top-2 left-2 rounded-full font-semibold
                     leading-none backdrop-blur-md border shadow-sm
                     py-1 px-2.5 flex items-center gap-1"
        >
          {RoleIcon && <RoleIcon size={9} />}
          {roleHandle}
        </motion.span>
      </div>

      {/* ── Info strip ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 bg-[var(--color-active-bg)] text-center">
        <p
          className="bangla font-bold text-[var(--color-text)] w-full text-center"
          style={{ fontSize: cfg.fontSize.name }}
        >
          {teacher.name}
        </p>
        <p
          className="bangla text-[var(--color-gray)] w-full text-center "
          style={{ fontSize: cfg.fontSize.sub }}
        >
          {teacher.degree || "—"}
        </p>
        <p
          className="bangla text-[var(--color-gray)] w-full text-center "
          style={{ fontSize: cfg.fontSize.sub }}
        >
          {teacher.subject && teacher.subject + " " + "বিভাগ"}
        </p>
        <p
          className="bangla text-[var(--color-gray)] w-full text-center"
          style={{ fontSize: cfg.fontSize.sub }}
        >
          {teacher.collegeName || teacher.degree || "—"}
        </p>

        {/* Accent line with role color */}
        <div
          className="mt-1 h-0.5 w-8 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${roleColor}60, ${roleColor})`,
          }}
        />
      </div>
    </motion.div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const Teacher = () => {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(0);
  const dragNow = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const screen = useScreen();
  const cfg = CFG[screen];

  const { data, isLoading, isError } = useQuery<TeacherData[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users/public");
      return (res.data?.data ?? res.data ?? []) as TeacherData[];
    },
    staleTime: 5 * 60_000,
  });

  const teachers = (data ?? []).filter(
    (t) => t.role === "teacher" || t.role === "admin" || t.role === "principal",
  );
  const N = teachers.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % N), [N]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + N) % N), [N]);

  const stopAuto = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    if (N < 2) return;
    stopAuto();
    autoRef.current = setInterval(next, 4000);
  }, [N, next, stopAuto]);

  // reset on data change
  useEffect(() => {
    setCurrent(0);
  }, [N]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  // keyboard nav
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        stopAuto();
        next();
        startAuto();
      }
      if (e.key === "ArrowLeft") {
        stopAuto();
        prev();
        startAuto();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, startAuto, stopAuto]);

  // drag / swipe
  const onStart = (x: number) => {
    setDragging(true);
    dragStart.current = x;
    dragNow.current = x;
    stopAuto();
  };
  const onMove = (x: number) => {
    if (dragging) dragNow.current = x;
  };
  const onEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const dx = dragNow.current - dragStart.current;
    const threshold = screen === "mobile" ? 30 : 48;
    if (Math.abs(dx) > threshold) {
      if (dx < 0) next();
      else prev();
    }
    startAuto();
  }, [dragging, next, prev, screen, startAuto]);

  const getOffset = (i: number) => {
    let o = i - current;
    if (o > N / 2) o -= N;
    if (o < -N / 2) o += N;
    return o;
  };

  return (
    <section className="relative overflow-hidden ">
      <Border />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="text-center bangla relative z-10 mb-5 "
      >
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold
                       text-[var(--color-text)]"
        >
          শিক্ষক মন্ডলী
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-sm sm:text-base md:text-lg mt-2 sm:mt-3
                     text-[var(--color-gray)]"
        >
          আমাদের অভিজ্ঞ ও দক্ষ শিক্ষকবৃন্দ
        </motion.p>
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {isError && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm bangla text-red-500 bg-red-50
                       py-4 rounded-lg mx-4"
          >
            তথ্য লোড করতে সমস্যা হয়েছে।
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Skeleton ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center gap-4 overflow-hidden px-4"
          >
            {Array.from({
              length: screen === "mobile" ? 1 : screen === "tablet" ? 3 : 4,
            }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rect"
                width={`${cfg.cardW}px`}
                height={`${cfg.cardH}px`}
                rounded="1rem"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty ── */}
      <AnimatePresence>
        {!isLoading && !isError && N === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm bangla text-[var(--color-gray)] py-12"
          >
            কোনো শিক্ষক পাওয়া যায়নি।
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Carousel ── */}
      <AnimatePresence>
        {!isLoading && !isError && N > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div
              style={{
                height: cfg.cardH + 40,
                perspective: "1400px",
                perspectiveOrigin: "50% 50%",
                cursor: dragging ? "grabbing" : "grab",
                touchAction: "none",
                position: "relative",
              }}
              onMouseDown={(e) => onStart(e.clientX)}
              onMouseMove={(e) => onMove(e.clientX)}
              onMouseUp={onEnd}
              onMouseLeave={onEnd}
              onTouchStart={(e) => onStart(e.touches[0].clientX)}
              onTouchMove={(e) => {
                e.preventDefault();
                onMove(e.touches[0].clientX);
              }}
              onTouchEnd={onEnd}
            >
              {/* Centered stage */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 0,
                  height: 0,
                  transformStyle: "preserve-3d",
                }}
              >
                {teachers.map((t, i) => {
                  const off = getOffset(i);
                  if (Math.abs(off) > cfg.visible + 1) return null;
                  return (
                    <TeacherCard
                      key={t._id}
                      teacher={t}
                      offset={off}
                      cfg={cfg}
                      onClick={() => {
                        if (off !== 0) {
                          stopAuto();
                          setCurrent(i);
                          startAuto();
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Teacher;
