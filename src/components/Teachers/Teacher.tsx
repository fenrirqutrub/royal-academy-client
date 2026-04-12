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
  degree: string;
  collegeName: string;
  para: string;
  gramNam: string;
  _id: string;
  name: string;
  role: "teacher" | "admin" | "principal";
  subject?: string;
  designation?: string;
  avatar?: { url?: string };
  image?: string;
}

const CFG: Record<
  Screen,
  {
    cardW: number;
    cardH: number;
    gap: number;
    visible: number;
    rotY: number;
    tz: number;
    scaleStep: number;
  }
> = {
  mobile: {
    cardW: 170,
    cardH: 250,
    gap: 82,
    visible: 1,
    rotY: 28,
    tz: 1,
    scaleStep: 0.22,
  },
  tablet: {
    cardW: 190,
    cardH: 270,
    gap: 108,
    visible: 2,
    rotY: 22,
    tz: 1,
    scaleStep: 0.16,
  },
  desktop: {
    cardW: 260,
    cardH: 335,
    gap: 138,
    visible: 3,
    rotY: 18,
    tz: 1,
    scaleStep: 0.12,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const resolveImg = (t: TeacherData): string => {
  const raw = t.avatar?.url ?? t.image ?? "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

// ── Hooks ──────────────────────────────────────────────────────────────────────
const useScreen = (): Screen => {
  const get = (): Screen => {
    const w = window.innerWidth;
    return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  };
  const [s, setS] = useState<Screen>(get);
  useEffect(() => {
    const h = () => setS(get());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return s;
};

// ── Card ───────────────────────────────────────────────────────────────────────
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

  const tx = offset * cfg.gap;
  const tz = -abs * cfg.tz;
  const ry = offset * -cfg.rotY;
  const scale = isCenter ? 1 : Math.max(0.58, 1 - abs * cfg.scaleStep);
  const opacity = abs > cfg.visible ? 0 : Math.max(0.35, 1 - abs * 0.22);
  const zIndex = 20 - abs;

  return (
    <motion.div
      onClick={onClick}
      animate={{ x: tx, z: tz, rotateY: ry, scale, opacity }}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
      style={{
        position: "absolute",
        width: cfg.cardW,
        height: cfg.cardH,
        zIndex,
        pointerEvents: abs > cfg.visible ? "none" : "auto",
        cursor: isCenter ? "default" : "pointer",
        willChange: "transform",
        transformStyle: "preserve-3d",
      }}
      className="rounded-3xl overflow-hidden shadow-2xl select-none flex flex-col
                 bg-[var(--color-bg)] border border-[var(--color-active-border)]"
    >
      {/* Center card glow */}
      <AnimatePresence>
        {isCenter && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.55, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="absolute -inset-1 -z-10 rounded-3xl blur-xl pointer-events-none
                       bg-gradient-to-br from-indigo-400/50 to-purple-500/50"
          />
        )}
      </AnimatePresence>

      {/* ── Image area ── */}
      <div className="relative flex-1 overflow-hidden bg-[var(--color-active-bg)]">
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
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.06 }}
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
              className="absolute inset-0 flex items-center justify-center
                         bg-gradient-to-br from-indigo-50 to-purple-50"
            >
              <UserCircle2
                strokeWidth={1}
                className="text-indigo-300"
                style={{ width: cfg.cardW * 0.38, height: cfg.cardW * 0.38 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom fade */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent
                        to-black/25 pointer-events-none"
        />

        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="absolute top-2.5 left-2.5 rounded-full text-[10px] font-medium
                     leading-snug bg-white/90 backdrop-blur-sm text-gray-700
                     border border-gray-200 shadow-sm py-0.5 px-2"
        >
          {ROLE_CONFIG[teacher.role]?.label ?? teacher.role}
        </motion.span>
      </div>

      {/* ── Info strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5
                   py-3 bg-white text-center"
        style={{ height: cfg.cardH * 0.27 }}
      >
        <p
          className="bangla font-bold text-gray-800 truncate w-full leading-snug text-center"
          style={{ fontSize: cfg.cardW < 175 ? 13 : 15 }}
        >
          {teacher.name}
        </p>
        <p
          className="bangla text-gray-400 truncate w-full text-center"
          style={{ fontSize: cfg.cardW < 175 ? 10 : 11 }}
        >
          {teacher.collegeName ? teacher.collegeName : teacher.degree}
        </p>
        <div className="mt-1.5 w-7 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
      </motion.div>
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
      const res = await axiosPublic.get("/api/users");
      return (res.data?.data ?? res.data ?? []) as TeacherData[];
    },
    staleTime: 5 * 60_000,
  });

  const teachers = (data ?? []).filter(
    (t) => t.role === "teacher" || t.role === "admin" || t.role === "principal",
  );
  const N = teachers.length;

  const next = useCallback(() => {
    if (N > 0) setCurrent((c) => (c + 1) % N);
  }, [N]);

  const prev = useCallback(() => {
    if (N > 0) setCurrent((c) => (c - 1 + N) % N);
  }, [N]);

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

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

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

  const onStart = (x: number) => {
    setDragging(true);
    dragStart.current = x;
    dragNow.current = x;
    stopAuto();
  };
  const onMove = (x: number) => {
    if (dragging) dragNow.current = x;
  };
  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const dx = dragNow.current - dragStart.current;
    if (Math.abs(dx) > (screen === "mobile" ? 30 : 50)) {
      if (dx < 0) next();
      else prev();
    }
    startAuto();
  };

  const getOffset = (i: number) => {
    let o = i - current;
    if (o > N / 2) o -= N;
    if (o < -N / 2) o += N;
    return o;
  };

  return (
    <section className="relative overflow-hidden">
      <Border />

      {/* Header and heda */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className=" text-center bangla relative z-10"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text)]">
          শিক্ষক মন্ডলী
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-lg sm:text-xl mt-3 text-[var(--color-gray)]"
        >
          আমাদের অভিজ্ঞ ও দক্ষ শিক্ষকবৃন্দ
        </motion.p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {isError && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm bangla text-red-500 bg-red-50 py-4 rounded-lg"
          >
            তথ্য লোড করতে সমস্যা হয়েছে।
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center gap-4 overflow-hidden"
          >
            {Array.from({ length: screen === "mobile" ? 2 : 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rect"
                width={`${cfg.cardW}px`}
                height={`${cfg.cardH}px`}
                rounded="1.5rem"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty */}
      <AnimatePresence>
        {!isLoading && !isError && N === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm bangla text-[var(--color-gray)] py-8"
          >
            কোনো শিক্ষক পাওয়া যায়নি।
          </motion.p>
        )}
      </AnimatePresence>

      {/* Carousel */}
      <AnimatePresence>
        {!isLoading && !isError && N > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div
              className="relative flex items-center justify-center cursor-pointer"
              style={{
                height: cfg.cardH + 80,
                perspective: "1500px",
                perspectiveOrigin: "center center",
                cursor: dragging ? "grabbing" : "grab",
              }}
              onMouseDown={(e) => onStart(e.clientX)}
              onMouseMove={(e) => onMove(e.clientX)}
              onMouseUp={onEnd}
              onTouchStart={(e) => onStart(e.touches[0].clientX)}
              onTouchMove={(e) => onMove(e.touches[0].clientX)}
              onTouchEnd={onEnd}
            >
              <div
                style={{
                  position: "relative",
                  width: cfg.cardW,
                  height: cfg.cardH,
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
