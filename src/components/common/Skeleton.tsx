// src/components/common/Skeleton.tsx
import { useMemo } from "react";
import { motion } from "framer-motion";

/* ════════════════════════════════════════════════════════════════
   Skeleton — Universal Loading Placeholder Component
   ════════════════════════════════════════════════════════════════

   IMPORT:
   import Skeleton from "../../components/common/Skeleton";

   ════════════════════════════════════════════════════════════════
   VARIANTS
   ════════════════════════════════════════════════════════════════

   ①  HERO              <Skeleton variant="hero" />
   ②  CARD              <Skeleton variant="card" count={3} />
   ③  CARD-IMAGE        <Skeleton variant="card-image" count={4} />
   ④  NOTICE            <Skeleton variant="notice" count={8} />
   ⑤  PICTURE           <Skeleton variant="picture" count={8} height="180px" />
   ⑥  DAILY-LESSON      <Skeleton variant="daily-lesson" />
   ⑦  TEACHER-CARD      <Skeleton variant="teacher-card" count={6} />
   ⑧  STUDENT-CARD      <Skeleton variant="student-card" count={6} />
   ⑨  RECT              <Skeleton variant="rect" width="200px" height="40px" />
   ⑩  PROFILE           <Skeleton variant="profile" />
   ⑪  ADD-LESSON        <Skeleton variant="add-lesson" />
   ⑫  MONTHLY-REPORT    <Skeleton variant="monthly-report" isManager={false} />

   ════════════════════════════════════════════════════════════════
   EXTRA PROPS
   ════════════════════════════════════════════════════════════════
   speed     → shimmer speed (seconds), default: 1.6
   className → wrapper extra Tailwind class
════════════════════════════════════════════════════════════════ */

// ─── Types ────────────────────────────────────────────────────
export type SkeletonVariant =
  | "hero"
  | "card"
  | "card-image"
  | "notice"
  | "picture"
  | "daily-lesson"
  | "teacher-card"
  | "student-card"
  | "profile"
  | "add-lesson"
  | "monthly-report"
  | "rect";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  width?: string;
  height?: string;
  className?: string;
  speed?: number;
  rounded?: string;
  // monthly-report specific
  isManager?: boolean;
}

// ─── Bone — atomic shimmer block ─────────────────────────────
interface BoneProps {
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
  onDark?: boolean;
  delay?: number;
}

const Bone = ({
  className = "",
  style,
  speed = 1.6,
  onDark = false,
  delay = 0,
}: BoneProps) => (
  <motion.div
    className={[
      "rounded",
      onDark
        ? "bg-white/10"
        : "bg-[var(--color-active-bg)] border border-[var(--color-active-border)]",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    style={style}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: speed, ease: "easeInOut", delay }}
  />
);

// ─── Stagger / Row helpers ────────────────────────────────────
const Stagger = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.07 } },
    }}
  >
    {children}
  </motion.div>
);

const Row = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 6 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      },
    }}
  >
    {children}
  </motion.div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ①  HERO
// ══════════════════════════════════════════════════════════════
const HeroSkeleton = ({ speed }: { speed?: number }) => (
  <section
    aria-hidden="true"
    className="w-full relative overflow-hidden bg-[var(--color-bg)]"
    style={{ height: "clamp(240px, 40vw, 470px)" }}
  >
    <Bone
      className="absolute inset-0 w-full h-full rounded-none"
      onDark
      speed={speed}
    />
    <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
    <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/55 via-transparent to-transparent pointer-events-none" />
    <motion.div
      className="absolute top-4 left-4 md:top-6 md:left-7 z-20"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-6 h-6 md:w-8 md:h-8">
        <span className="absolute top-0 left-0 w-full h-[1.5px] bg-white/20" />
        <span className="absolute top-0 left-0 w-[1.5px] h-full bg-white/20" />
      </div>
    </motion.div>
    <motion.div
      className="absolute bottom-8 right-4 md:bottom-10 md:right-7 z-20"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-6 h-6 md:w-8 md:h-8">
        <span className="absolute bottom-0 right-0 w-full h-[1.5px] bg-white/20" />
        <span className="absolute bottom-0 right-0 w-[1.5px] h-full bg-white/20" />
      </div>
    </motion.div>
    <div className="absolute top-4 right-5 md:top-6 md:right-8 z-20 flex items-baseline gap-1.5">
      <Bone
        className="w-7 h-5 md:w-8 md:h-6"
        onDark
        speed={speed}
        delay={0.1}
      />
      <Bone className="w-4 h-2.5" onDark speed={speed} delay={0.15} />
    </div>
    <Stagger className="absolute inset-x-0 bottom-0 z-20 px-5 md:px-12 pb-6 md:pb-9 flex flex-col gap-3">
      <Row className="flex items-center gap-2">
        <Bone className="w-5 h-px" onDark speed={speed} />
        <Bone className="w-20 h-2" onDark speed={speed} />
      </Row>
      <Row>
        <Bone
          className="w-[55%] rounded-sm"
          onDark
          speed={speed}
          style={{ height: "clamp(22px, 2.8vw, 38px)" }}
        />
      </Row>
      <Row>
        <Bone
          className="w-[38%] rounded-sm"
          onDark
          speed={speed}
          style={{ height: "clamp(16px, 2vw, 28px)" }}
        />
      </Row>
      <Row className="hidden md:flex flex-col gap-1.5">
        <Bone className="w-[480px] max-w-full h-2.5" onDark speed={speed} />
        <Bone className="w-[360px] max-w-full h-2.5" onDark speed={speed} />
      </Row>
      <Row className="flex items-center justify-between mt-0.5">
        <Bone className="w-28 h-8 rounded-none" onDark speed={speed} />
        <div className="flex items-center gap-3">
          <Bone className="w-7 h-7 rounded-none" onDark speed={speed} />
          <div className="flex items-center gap-1.5">
            <Bone
              className="h-1.5 rounded-full"
              onDark
              speed={speed}
              style={{ width: 22 }}
            />
            <Bone
              className="w-1.5 h-1.5 rounded-full"
              onDark
              speed={speed}
              delay={0.05}
            />
            <Bone
              className="w-1.5 h-1.5 rounded-full"
              onDark
              speed={speed}
              delay={0.1}
            />
          </div>
          <Bone className="w-7 h-7 rounded-none" onDark speed={speed} />
        </div>
      </Row>
    </Stagger>
    <div className="absolute bottom-0 left-0 right-0 z-30 h-[2px] bg-white/10" />
  </section>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ②  CARD
// ══════════════════════════════════════════════════════════════
const CardSkeleton = ({ speed }: { speed?: number }) => (
  <Stagger className="flex flex-col gap-3 p-4 md:p-5 rounded-lg border border-[var(--color-active-border)] bg-[var(--color-active-bg)]">
    <Row>
      <Bone className="w-16 h-5 rounded-full" speed={speed} />
    </Row>
    <Row className="flex flex-col gap-2">
      <Bone className="w-full h-4" speed={speed} />
      <Bone className="w-4/5 h-4" speed={speed} />
    </Row>
    <Row className="flex flex-col gap-1.5">
      <Bone className="w-full h-3" speed={speed} />
      <Bone className="w-full h-3" speed={speed} />
      <Bone className="w-3/5 h-3" speed={speed} />
    </Row>
    <Row className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-2">
        <Bone className="w-7 h-7 rounded-full shrink-0" speed={speed} />
        <Bone className="w-20 h-3" speed={speed} />
      </div>
      <Bone className="w-14 h-3" speed={speed} />
    </Row>
    <Row>
      <div className="h-px bg-[var(--color-active-border)]" />
    </Row>
    <Row className="flex items-center justify-between">
      <Bone className="w-24 h-8 rounded" speed={speed} />
      <Bone className="w-6 h-6 rounded-full" speed={speed} />
    </Row>
  </Stagger>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ③  CARD WITH IMAGE
// ══════════════════════════════════════════════════════════════
const CardImageSkeleton = ({ speed }: { speed?: number }) => (
  <Stagger className="flex flex-col rounded-lg overflow-hidden border border-[var(--color-active-border)] bg-[var(--color-active-bg)]">
    <Row>
      <Bone className="w-full h-44 md:h-52 rounded-none" speed={speed} />
    </Row>
    <div className="flex flex-col gap-3 p-4 md:p-5">
      <Row>
        <Bone className="w-14 h-5 rounded-full" speed={speed} />
      </Row>
      <Row className="flex flex-col gap-2">
        <Bone className="w-full h-4" speed={speed} />
        <Bone className="w-4/5 h-4" speed={speed} />
      </Row>
      <Row className="flex flex-col gap-1.5">
        <Bone className="w-full h-3" speed={speed} />
        <Bone className="w-full h-3" speed={speed} />
        <Bone className="w-2/3 h-3" speed={speed} />
      </Row>
      <Row className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <Bone className="w-7 h-7 rounded-full shrink-0" speed={speed} />
          <div className="flex flex-col gap-1">
            <Bone className="w-20 h-2.5" speed={speed} />
            <Bone className="w-14 h-2" speed={speed} />
          </div>
        </div>
        <Bone className="w-16 h-8 rounded" speed={speed} />
      </Row>
    </div>
  </Stagger>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ④  NOTICE
// ══════════════════════════════════════════════════════════════
const NoticeRowSkeleton = ({
  speed,
  delay = 0,
}: {
  speed: number;
  delay?: number;
}) => (
  <motion.div
    className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 border-b border-[var(--color-active-border)] last:border-b-0"
    variants={{
      hidden: { opacity: 0, x: -8 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay },
      },
    }}
  >
    <Bone className="hidden sm:block w-8 h-8 rounded shrink-0" speed={speed} />
    <Bone className="w-2 h-2 rounded-full shrink-0" speed={speed} />
    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
      <Bone className="w-full h-3.5" speed={speed} />
      <Bone className="w-3/5 h-2.5" speed={speed} />
    </div>
    <Bone
      className="hidden md:block w-16 h-5 rounded-full shrink-0"
      speed={speed}
    />
    <Bone className="w-14 h-3 shrink-0" speed={speed} />
    <Bone className="w-5 h-5 rounded-full shrink-0" speed={speed} />
  </motion.div>
);

const NoticeSkeleton = ({
  rows = 5,
  speed = 1.6,
}: {
  rows?: number;
  speed?: number;
}) => (
  <div className="rounded-lg overflow-hidden border border-[var(--color-active-border)] bg-[var(--color-active-bg)]">
    <motion.div
      className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 border-b-2 border-[var(--color-active-border)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Bone className="hidden sm:block w-8 h-3 rounded" speed={speed} />
      <Bone className="w-2 h-3 rounded" speed={speed} />
      <Bone className="flex-1 h-3 rounded" speed={speed} />
      <Bone className="hidden md:block w-16 h-3 rounded" speed={speed} />
      <Bone className="w-14 h-3 rounded" speed={speed} />
      <Bone className="w-5 h-3 rounded" speed={speed} />
    </motion.div>
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <NoticeRowSkeleton key={i} speed={speed} delay={i * 0.06} />
      ))}
    </motion.div>
    <motion.div
      className="flex items-center justify-between px-3 md:px-4 py-3 border-t border-[var(--color-active-border)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Bone className="w-24 h-3" speed={speed} />
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="w-7 h-7 rounded" speed={speed} />
        ))}
      </div>
    </motion.div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ⑤  PICTURE
// ══════════════════════════════════════════════════════════════
const PictureItem = ({
  height = "200px",
  speed = 1.6,
  delay = 0,
}: {
  height?: string;
  speed?: number;
  delay?: number;
}) => (
  <motion.div
    className="flex flex-col gap-2"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
  >
    <Bone className="w-full rounded-md" speed={speed} style={{ height }} />
    <div className="flex flex-col gap-1.5 px-0.5">
      <Bone className="w-3/4 h-3" speed={speed} delay={delay + 0.05} />
      <Bone className="w-1/2 h-2.5" speed={speed} delay={delay + 0.1} />
    </div>
  </motion.div>
);

const PictureSkeleton = ({
  count = 4,
  height = "200px",
  speed = 1.6,
}: {
  count?: number;
  height?: string;
  speed?: number;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <PictureItem key={i} height={height} speed={speed} delay={i * 0.08} />
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ⑥  DAILY-LESSON
// ══════════════════════════════════════════════════════════════
const DailyLessonCardSkeleton = ({
  speed,
  delay = 0,
}: {
  speed?: number;
  delay?: number;
}) => (
  <motion.div
    className="overflow-hidden rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)]"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
  >
    <Bone className="h-1.5 w-full rounded-none" speed={speed} delay={delay} />
    <div className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Bone className="h-6 w-2/3" speed={speed} delay={delay + 0.05} />
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <Bone className="h-3.5 w-16" speed={speed} delay={delay + 0.08} />
            <Bone className="h-3.5 w-20" speed={speed} delay={delay + 0.1} />
            <Bone className="h-3.5 w-24" speed={speed} delay={delay + 0.12} />
            <Bone className="h-3.5 w-28" speed={speed} delay={delay + 0.14} />
          </div>
        </div>
        <Bone
          className="w-10 h-10 rounded-xl shrink-0"
          speed={speed}
          delay={delay + 0.06}
        />
      </div>
      <div className="space-y-2">
        <Bone className="h-3.5 w-full" speed={speed} delay={delay + 0.16} />
        <Bone className="h-3.5 w-full" speed={speed} delay={delay + 0.18} />
        <Bone className="h-3.5 w-4/5" speed={speed} delay={delay + 0.2} />
        <Bone className="h-3.5 w-3/5" speed={speed} delay={delay + 0.22} />
      </div>
    </div>
  </motion.div>
);

const ClassGroupTitleSkeleton = ({
  speed,
  delay = 0,
}: {
  speed?: number;
  delay?: number;
}) => (
  <motion.div
    className="relative flex items-center gap-0 mb-5 mt-12 overflow-hidden rounded-lg"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
  >
    <Bone
      className="w-1.5 self-stretch rounded-l-2xl rounded-r-none shrink-0"
      speed={speed}
      delay={delay}
    />
    <div className="flex-1 flex items-center justify-between px-5 py-2 border border-l-0 border-[var(--color-active-border)] rounded-r-lg bg-[var(--color-active-bg)]">
      <Bone className="h-7 w-28 md:w-36" speed={speed} delay={delay + 0.05} />
      <Bone
        className="hidden sm:block h-10 w-px mx-4"
        speed={speed}
        delay={delay + 0.05}
      />
      <Bone className="h-7 w-24 md:w-28" speed={speed} delay={delay + 0.08} />
    </div>
  </motion.div>
);

const DailyLessonSkeleton = ({
  groups = 2,
  cardsPerGroup = 4,
  speed = 1.6,
}: {
  groups?: number;
  cardsPerGroup?: number;
  speed?: number;
}) => (
  <div aria-hidden="true" aria-label="Loading…">
    <motion.header
      className="text-center mb-6 space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex justify-center">
        <Bone className="h-8 md:h-12 w-40 md:w-64" speed={speed} />
      </div>
      <div className="flex justify-center">
        <Bone className="h-5 md:h-7 w-56 md:w-80" speed={speed} delay={0.06} />
      </div>
    </motion.header>
    <motion.div
      className="flex flex-wrap items-center gap-3 px-3 md:px-0 mb-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Bone className="h-10 w-28 rounded-xl" speed={speed} delay={0.12} />
      <Bone
        className="hidden sm:block h-8 w-px rounded-full"
        speed={speed}
        delay={0.14}
      />
      <Bone className="h-10 w-64 rounded-xl" speed={speed} delay={0.16} />
      <Bone
        className="hidden sm:block ml-auto h-4 w-32"
        speed={speed}
        delay={0.18}
      />
    </motion.div>
    <div className="mt-4 px-3 md:px-0">
      {Array.from({ length: groups }).map((_, gi) => (
        <div key={gi}>
          <ClassGroupTitleSkeleton speed={speed} delay={gi * 0.1} />
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: cardsPerGroup }).map((_, ci) => (
              <DailyLessonCardSkeleton
                key={ci}
                speed={speed}
                delay={gi * 0.1 + ci * 0.07}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ⑦  TEACHER-CARD
// ══════════════════════════════════════════════════════════════
const TeacherCardBone = ({
  speed,
  delay = 0,
}: {
  speed?: number;
  delay?: number;
}) => (
  <motion.div
    className="rounded-2xl overflow-hidden flex flex-col border border-[var(--color-active-border)] bg-[var(--color-active-bg)]"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
  >
    <Bone className="h-1.5 w-full rounded-none" speed={speed} delay={delay} />
    <div className="p-4 flex flex-col flex-1">
      <div className="flex items-start gap-3 mb-4">
        <Bone
          className="rounded-xl shrink-0"
          speed={speed}
          delay={delay + 0.04}
          style={{ width: 52, height: 52 }}
        />
        <div className="flex-1 pt-0.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Bone className="h-3.5 w-3/4" speed={speed} delay={delay + 0.06} />
            <Bone
              className="h-3.5 w-3.5 rounded-full shrink-0"
              speed={speed}
              delay={delay + 0.07}
            />
          </div>
          <Bone className="h-3 w-1/2" speed={speed} delay={delay + 0.08} />
          <div className="flex items-center gap-1.5 flex-wrap">
            <Bone
              className="h-4 w-14 rounded-full"
              speed={speed}
              delay={delay + 0.1}
            />
            <Bone
              className="h-4 w-10 rounded"
              speed={speed}
              delay={delay + 0.11}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2.5 pt-3 flex-1 border-t border-[var(--color-active-border)]">
        {[0.12, 0.14, 0.16].map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Bone
              className="w-6 h-6 rounded-lg shrink-0"
              speed={speed}
              delay={delay + d}
            />
            <Bone
              className={`h-3.5 ${i === 0 ? "w-2/3" : i === 1 ? "w-1/2" : "w-20"}`}
              speed={speed}
              delay={delay + d + 0.01}
            />
          </div>
        ))}
      </div>
      <Bone
        className="mt-4 h-10 w-full rounded-xl"
        speed={speed}
        delay={delay + 0.2}
      />
    </div>
  </motion.div>
);

const TeacherCardSkeleton = ({
  count = 6,
  speed = 1.6,
}: {
  count?: number;
  speed?: number;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <TeacherCardBone key={i} speed={speed} delay={i * 0.05} />
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ⑧  STUDENT-CARD
// ══════════════════════════════════════════════════════════════
const StudentCardBone = ({
  speed,
  delay = 0,
}: {
  speed?: number;
  delay?: number;
}) => (
  <motion.div
    className="rounded-2xl overflow-hidden flex flex-col border border-[var(--color-active-border)] bg-[var(--color-active-bg)]"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
  >
    <Bone className="h-1.5 w-full rounded-none" speed={speed} delay={delay} />
    <div className="p-4 flex flex-col flex-1">
      <div className="flex items-start gap-3 mb-4">
        <Bone
          className="rounded-xl shrink-0"
          speed={speed}
          delay={delay + 0.04}
          style={{ width: 52, height: 52 }}
        />
        <div className="flex-1 pt-0.5 space-y-1.5">
          <Bone className="h-3.5 w-3/4" speed={speed} delay={delay + 0.06} />
          <Bone className="h-3 w-1/2" speed={speed} delay={delay + 0.08} />
          <div className="flex items-center gap-1.5 flex-wrap">
            <Bone
              className="h-4 w-10 rounded"
              speed={speed}
              delay={delay + 0.09}
            />
            <Bone
              className="h-4 w-10 rounded-full"
              speed={speed}
              delay={delay + 0.1}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2.5 pt-3 flex-1 border-t border-[var(--color-active-border)]">
        {[0.11, 0.13, 0.15].map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Bone
              className="w-6 h-6 rounded-lg shrink-0"
              speed={speed}
              delay={delay + d}
            />
            <Bone
              className={`h-3.5 ${i === 0 ? "w-1/2" : i === 1 ? "w-2/5" : "w-20"}`}
              speed={speed}
              delay={delay + d + 0.01}
            />
          </div>
        ))}
      </div>
      <Bone
        className="mt-4 h-10 w-full rounded-xl"
        speed={speed}
        delay={delay + 0.19}
      />
    </div>
  </motion.div>
);

const StudentCardSkeleton = ({
  count = 6,
  speed = 1.6,
}: {
  count?: number;
  speed?: number;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <StudentCardBone key={i} speed={speed} delay={i * 0.05} />
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ⑨  RECT
// ══════════════════════════════════════════════════════════════
const RectSkeleton = ({
  width = "100%",
  height = "1rem",
  rounded = "4px",
  speed = 1.6,
}: {
  width?: string;
  height?: string;
  rounded?: string;
  speed?: number;
}) => <Bone style={{ width, height, borderRadius: rounded }} speed={speed} />;

// ══════════════════════════════════════════════════════════════
// VARIANT ⑩  PROFILE
// ══════════════════════════════════════════════════════════════
const ProfileFieldRow = ({
  speed = 1.6,
  delay = 0,
  wide = false,
}: {
  speed?: number;
  delay?: number;
  wide?: boolean;
}) => (
  <div
    className="flex items-start gap-3 py-3"
    style={{ borderBottom: "1px solid var(--color-active-border)" }}
  >
    <Bone
      className="w-7 h-7 rounded-lg shrink-0 mt-0.5"
      speed={speed}
      delay={delay}
    />
    <div className="flex-1 space-y-1.5">
      <Bone className="h-2.5 w-20" speed={speed} delay={delay + 0.04} />
      <Bone
        className={`h-5 ${wide ? "w-3/4" : "w-2/5"}`}
        speed={speed}
        delay={delay + 0.08}
      />
    </div>
  </div>
);

const ProfileSectionCard = ({
  speed = 1.6,
  delay = 0,
  rows = 3,
  wideRows,
}: {
  speed?: number;
  delay?: number;
  rows?: number;
  wideRows?: number[];
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="rounded-2xl overflow-hidden mb-3"
    style={{
      backgroundColor: "var(--color-bg)",
      border: "1px solid var(--color-active-border)",
    }}
  >
    <div
      className="flex items-center gap-2.5 px-5 pt-5 pb-3"
      style={{ borderBottom: "1px solid var(--color-active-border)" }}
    >
      <Bone className="w-5 h-5 rounded" speed={speed} delay={delay} />
      <Bone className="h-4 w-28" speed={speed} delay={delay + 0.04} />
    </div>
    <div className="px-5 pb-2">
      {Array.from({ length: rows }).map((_, i) => (
        <ProfileFieldRow
          key={i}
          speed={speed}
          delay={delay + 0.06 + i * 0.05}
          wide={wideRows?.includes(i) ?? i === 0}
        />
      ))}
    </div>
  </motion.div>
);

const ProfileSkeleton = ({ speed = 1.6 }: { speed?: number }) => (
  <div
    className="w-full py-8 lg:py-10"
    aria-hidden="true"
    aria-label="Loading…"
  >
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 mt-10 lg:mt-0 space-y-2"
    >
      <Bone className="h-8 md:h-10 w-44 md:w-56" speed={speed} />
      <Bone className="h-5 md:h-6 w-56 md:w-72" speed={speed} delay={0.05} />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.04,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="rounded-2xl overflow-hidden mb-3 p-4 sm:p-5"
      style={{
        backgroundColor: "var(--color-bg)",
        border: "1px solid var(--color-active-border)",
      }}
    >
      <div className="flex items-center gap-4">
        <Bone
          className="w-16 h-16 md:w-32 md:h-32 rounded-full shrink-0"
          speed={speed}
        />
        <div className="flex-1 min-w-0 space-y-2">
          <Bone
            className="h-6 md:h-7 w-40 md:w-56"
            speed={speed}
            delay={0.06}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Bone
              className="h-5 w-16 rounded-full"
              speed={speed}
              delay={0.09}
            />
            <Bone
              className="h-5 w-24 rounded-full"
              speed={speed}
              delay={0.11}
            />
          </div>
        </div>
        <Bone
          className="w-20 h-8 rounded-xl shrink-0"
          speed={speed}
          delay={0.08}
        />
      </div>
      <div className="mt-3">
        <Bone className="h-8 w-full rounded-xl" speed={speed} delay={0.14} />
      </div>
    </motion.div>
    <ProfileSectionCard
      speed={speed}
      delay={0.08}
      rows={5}
      wideRows={[0, 1, 2]}
    />
    <ProfileSectionCard speed={speed} delay={0.12} rows={3} wideRows={[0]} />
    <ProfileSectionCard
      speed={speed}
      delay={0.16}
      rows={6}
      wideRows={[0, 2, 3]}
    />
    <ProfileSectionCard speed={speed} delay={0.2} rows={3} wideRows={[0, 1]} />
  </div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ⑪  ADD-LESSON
// ══════════════════════════════════════════════════════════════
const FormFieldBone = ({
  speed = 1.6,
  delay = 0,
  tall = false,
}: {
  speed?: number;
  delay?: number;
  tall?: boolean;
}) => (
  <motion.div
    className="flex flex-col gap-1.5"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
  >
    <Bone className="h-3 w-24 rounded" speed={speed} delay={delay} />
    <Bone
      className={`w-full rounded-xl ${tall ? "h-32" : "h-11"}`}
      speed={speed}
      delay={delay + 0.05}
    />
  </motion.div>
);

const AddLessonSkeleton = ({ speed = 1.6 }: { speed?: number }) => (
  <div
    className="min-h-screen bg-[var(--color-bg)] py-10"
    aria-hidden="true"
    aria-label="Loading…"
  >
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Bone className="w-1 h-8 rounded-full" speed={speed} />
          <Bone
            className="h-7 w-48 md:w-64 rounded-lg"
            speed={speed}
            delay={0.04}
          />
        </div>
        <Bone
          className="h-4 w-72 ml-4 pl-3 rounded"
          speed={speed}
          delay={0.08}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.38, delay: 0.1 }}
        className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-active-border)] p-6 sm:p-8 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormFieldBone speed={speed} delay={0.12} />
          <FormFieldBone speed={speed} delay={0.16} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormFieldBone speed={speed} delay={0.2} />
          <FormFieldBone speed={speed} delay={0.24} />
        </div>
        <FormFieldBone speed={speed} delay={0.28} tall />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="border-t border-[var(--color-active-border)] pt-2"
        />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Bone className="flex-1 h-12 rounded-xl" speed={speed} delay={0.36} />
          <Bone className="sm:w-32 h-12 rounded-xl" speed={speed} delay={0.4} />
        </motion.div>
      </motion.div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// VARIANT ⑫  MONTHLY-REPORT  ← NEW
// ══════════════════════════════════════════════════════════════

// 3 stat cards in a row
const StatCardsSkeleton = ({ speed = 1.6 }: { speed?: number }) => (
  <div className="grid grid-cols-3 gap-3">
    {[0, 0.07, 0.14].map((d, i) => (
      <motion.div
        key={i}
        className="rounded-2xl p-4 border border-[var(--color-active-border)] bg-[var(--color-active-bg)] flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: d, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Bone className="w-5 h-5 rounded-md" speed={speed} delay={d} />
        <Bone className="w-10 h-7 rounded-md" speed={speed} delay={d + 0.05} />
        <Bone className="w-16 h-3 rounded" speed={speed} delay={d + 0.08} />
      </motion.div>
    ))}
  </div>
);

// calendar grid skeleton — 7 cols × 5 rows of day cells
const CalendarSkeleton = ({
  speed = 1.6,
  delay = 0,
}: {
  speed?: number;
  delay?: number;
}) => {
  const cells = Array.from({ length: 35 });
  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-[var(--color-active-border)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-active-bg)] border-b border-[var(--color-active-border)]">
        <div className="flex items-center gap-2">
          <Bone className="w-4 h-4 rounded" speed={speed} delay={delay} />
          <Bone
            className="w-36 h-4 rounded"
            speed={speed}
            delay={delay + 0.04}
          />
        </div>
        <Bone className="w-14 h-3 rounded" speed={speed} delay={delay + 0.06} />
      </div>
      {/* progress bar */}
      <Bone
        className="w-full h-1 rounded-none"
        speed={speed}
        delay={delay + 0.05}
      />
      {/* day-of-week labels */}
      <div className="grid grid-cols-7 px-3 pt-3 pb-1 gap-0.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Bone
            key={i}
            className="h-3 mx-auto w-4/5 rounded"
            speed={speed}
            delay={delay + 0.08 + i * 0.02}
          />
        ))}
      </div>
      {/* day cells */}
      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
        {cells.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-lg"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: delay + 0.1 + i * 0.012,
              duration: 0.28,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <Bone
              className="w-full h-8 rounded-lg"
              speed={speed}
              delay={delay + 0.1 + i * 0.012}
            />
          </motion.div>
        ))}
      </div>
      {/* legend strip */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-[var(--color-active-border)]">
        {[40, 52, 64].map((w, i) => (
          <Bone
            key={i}
            className="h-3 rounded"
            speed={speed}
            delay={delay + 0.55 + i * 0.05}
            style={{ width: w }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// weekly exam table skeleton
const WeekTableSkeleton = ({
  speed = 1.6,
  delay = 0,
  rows = 4,
}: {
  speed?: number;
  delay?: number;
  rows?: number;
}) => (
  <motion.div
    className="rounded-2xl overflow-hidden border border-[var(--color-active-border)]"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
  >
    {/* header */}
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-active-bg)] border-b border-[var(--color-active-border)]">
      <div className="flex items-center gap-2">
        <Bone className="w-4 h-4 rounded" speed={speed} delay={delay} />
        <Bone className="w-40 h-4 rounded" speed={speed} delay={delay + 0.04} />
      </div>
      <Bone className="w-12 h-3 rounded" speed={speed} delay={delay + 0.06} />
    </div>
    {/* progress */}
    <Bone
      className="w-full h-1 rounded-none"
      speed={speed}
      delay={delay + 0.05}
    />
    {/* week rows */}
    <div className="divide-y divide-[var(--color-active-border)]">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: delay + 0.15 + i * 0.07,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* check icon placeholder */}
          <Bone
            className="w-6 h-6 rounded-lg shrink-0"
            speed={speed}
            delay={delay + 0.15 + i * 0.07}
          />
          <div className="flex-1 space-y-1.5">
            <Bone
              className="h-3.5 w-24"
              speed={speed}
              delay={delay + 0.18 + i * 0.07}
            />
            <Bone
              className="h-2.5 w-36"
              speed={speed}
              delay={delay + 0.21 + i * 0.07}
            />
          </div>
          <Bone
            className="w-10 h-5 rounded-full shrink-0"
            speed={speed}
            delay={delay + 0.22 + i * 0.07}
          />
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// one teacher block (manager view)
const TeacherReportBlock = ({
  speed = 1.6,
  delay = 0,
}: {
  speed?: number;
  delay?: number;
}) => (
  <motion.div
    className="rounded-2xl overflow-hidden border border-[var(--color-active-border)]"
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {/* teacher name bar */}
    <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-active-bg)] border-b border-[var(--color-active-border)]">
      <div className="flex items-center gap-2.5">
        <Bone
          className="w-8 h-8 rounded-xl shrink-0"
          speed={speed}
          delay={delay}
        />
        <Bone className="h-4 w-28" speed={speed} delay={delay + 0.04} />
      </div>
      <div className="flex items-center gap-3">
        <Bone
          className="h-3 w-16 hidden sm:block"
          speed={speed}
          delay={delay + 0.06}
        />
        <Bone
          className="h-3 w-14 hidden sm:block"
          speed={speed}
          delay={delay + 0.08}
        />
        <Bone className="h-3 w-8 font-bold" speed={speed} delay={delay + 0.1} />
        <div className="hidden sm:flex items-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <Bone
              key={i}
              className="w-2 h-2 rounded-full"
              speed={speed}
              delay={delay + 0.1 + i * 0.02}
            />
          ))}
        </div>
      </div>
    </div>
    {/* calendar + exam grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-active-border)]">
      <div className="p-4">
        <CalendarSkeleton speed={speed} delay={delay + 0.08} />
      </div>
      <div className="p-4">
        <WeekTableSkeleton speed={speed} delay={delay + 0.14} />
      </div>
    </div>
  </motion.div>
);

// full monthly report skeleton
const MonthlyReportSkeleton = ({
  speed = 1.6,
  isManager = false,
}: {
  speed?: number;
  isManager?: boolean;
}) => (
  <div
    className="min-h-screen bg-[var(--color-bg)]"
    aria-hidden="true"
    aria-label="Loading…"
  >
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 lg:py-14 max-w-5xl mx-auto space-y-8">
      {/* ── Page header ── */}
      <motion.div
        className="mt-10 lg:mt-0 space-y-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* back link */}
        <Bone className="h-3 w-24 rounded" speed={speed} />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Bone
              className="h-9 sm:h-11 w-44 sm:w-56 rounded-xl"
              speed={speed}
              delay={0.04}
            />
            <Bone className="h-4 w-48 rounded" speed={speed} delay={0.08} />
          </div>
          {/* month navigator pill */}
          <motion.div
            className="flex items-center gap-1 rounded-xl px-2 py-1.5 bg-[var(--color-active-bg)] border border-[var(--color-active-border)]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.1,
              duration: 0.35,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <Bone className="w-7 h-7 rounded-lg" speed={speed} delay={0.12} />
            <Bone
              className="w-28 h-5 rounded-lg mx-1"
              speed={speed}
              delay={0.14}
            />
            <Bone
              className="w-7 h-7 rounded-lg opacity-30"
              speed={speed}
              delay={0.16}
            />
          </motion.div>
        </div>

        {/* legend row */}
        <motion.div
          className="flex items-center gap-3 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          {[80, 60, 52, 48, 72].map((w, i) => (
            <Bone
              key={i}
              className="h-3 rounded"
              speed={speed}
              delay={0.2 + i * 0.04}
              style={{ width: w }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* ── Stat cards ── */}
      <StatCardsSkeleton speed={speed} />

      {/* ── Teacher own view ── */}
      {!isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CalendarSkeleton speed={speed} delay={0.1} />
          <WeekTableSkeleton speed={speed} delay={0.18} />
        </div>
      )}

      {/* ── Manager view — multiple teacher blocks ── */}
      {isManager && (
        <div className="space-y-5">
          {[0, 0.12, 0.24].map((d, i) => (
            <TeacherReportBlock key={i} speed={speed} delay={d} />
          ))}
        </div>
      )}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// MAIN — exported Skeleton
// ══════════════════════════════════════════════════════════════
const SELF_MANAGED: SkeletonVariant[] = [
  "notice",
  "picture",
  "daily-lesson",
  "teacher-card",
  "student-card",
  "profile",
  "add-lesson",
  "monthly-report",
];

const Skeleton = ({
  variant = "rect",
  count = 1,
  width,
  height,
  className = "",
  speed = 1.6,
  rounded,
  isManager = false,
}: SkeletonProps) => {
  const items = useMemo(() => Array.from({ length: count }), [count]);

  const renderOne = (key: number) => {
    switch (variant) {
      case "hero":
        return <HeroSkeleton key={key} speed={speed} />;
      case "card":
        return <CardSkeleton key={key} speed={speed} />;
      case "card-image":
        return <CardImageSkeleton key={key} speed={speed} />;
      case "daily-lesson":
        return <DailyLessonSkeleton key={key} speed={speed} />;
      case "teacher-card":
        return <TeacherCardSkeleton key={key} count={count} speed={speed} />;
      case "student-card":
        return <StudentCardSkeleton key={key} count={count} speed={speed} />;
      case "profile":
        return <ProfileSkeleton key={key} speed={speed} />;
      case "add-lesson":
        return <AddLessonSkeleton key={key} speed={speed} />;
      case "monthly-report":
        return (
          <MonthlyReportSkeleton
            key={key}
            speed={speed}
            isManager={isManager}
          />
        );
      case "notice":
        return (
          <NoticeSkeleton
            key={key}
            rows={count > 1 ? count : 5}
            speed={speed}
          />
        );
      case "picture":
        return (
          <PictureSkeleton
            key={key}
            count={count}
            height={height}
            speed={speed}
          />
        );
      case "rect":
      default:
        return (
          <RectSkeleton
            key={key}
            width={width}
            height={height}
            rounded={rounded}
            speed={speed}
          />
        );
    }
  };

  if (SELF_MANAGED.includes(variant)) {
    return (
      <div className={className} aria-hidden="true" aria-label="Loading…">
        {renderOne(0)}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-4 ${className}`}
      aria-hidden="true"
      aria-label="Loading…"
    >
      {items.map((_, i) => renderOne(i))}
    </div>
  );
};

export default Skeleton;
