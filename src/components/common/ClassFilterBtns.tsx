import { useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { CLASS_COLORS, DEFAULT_CLASS_COLOR } from "../../styles/colors";
import { CLASS_ORDER } from "../../utility/Constants";
import type { DailyLessonData } from "../../pages/DailyLesson/DailyLessonUpdateModals";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClassFilterBtnsProps {
  activeId: string;
  onChange: (id: string) => void;
  data: DailyLessonData[];
  disabled?: boolean;
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.88 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as number[] },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
const ClassFilterBtns = ({
  activeId,
  onChange,
  data,
  disabled = false,
}: ClassFilterBtnsProps) => {
  const classes = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    data.forEach((l) => {
      if (!seen.has(l.class)) {
        seen.add(l.class);
        result.push(l.class);
      }
    });
    return result.sort(
      (a, b) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99),
    );
  }, [data]);

  if (classes.length === 0) return null;

  const handleChange = (id: string) => {
    if (!disabled) onChange(id);
  };

  const isAllActive = activeId === "all";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap items-center justify-center gap-1.5 bangla sm:gap-2"
    >
      {/* ── সকল button ── */}
      <motion.button
        variants={itemVariants}
        onClick={() => handleChange("all")}
        whileTap={disabled ? {} : { scale: 0.92 }}
        whileHover={disabled ? {} : { scale: 1.04 }}
        disabled={disabled}
        aria-pressed={isAllActive}
        className={[
          "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-xs font-bold outline-none",
          "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]",
          "sm:px-3.5 sm:text-sm",
          disabled ? "cursor-default opacity-60" : "cursor-pointer",
        ].join(" ")}
        style={{
          border: isAllActive
            ? "1.5px solid var(--color-text)"
            : "1.5px solid var(--color-active-border)",
          background: isAllActive
            ? "var(--color-text)"
            : "var(--color-active-bg)",
          color: isAllActive ? "var(--color-bg)" : "var(--color-gray)",
        }}
      >
        {/* sliding background pill */}
        {isAllActive && (
          <motion.span
            layoutId="cfb-pill"
            className="absolute inset-0 rounded-full"
            style={{ background: "var(--color-text)", zIndex: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          />
        )}

        <span className="relative z-10 flex items-center gap-1">
          <LayoutGrid
            size={12}
            strokeWidth={2.5}
            className="shrink-0 sm:size-3.5"
          />
          সকল
        </span>
      </motion.button>

      {/* ── Per-class buttons ── */}
      {classes.map((cls) => {
        const color = CLASS_COLORS[cls] ?? DEFAULT_CLASS_COLOR;
        const isActive = activeId === cls;

        return (
          <motion.button
            key={cls}
            variants={itemVariants}
            onClick={() => handleChange(cls)}
            whileTap={disabled ? {} : { scale: 0.92 }}
            whileHover={disabled ? {} : { scale: 1.04 }}
            disabled={disabled}
            aria-pressed={isActive}
            className={[
              "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-xs font-bold outline-none",
              "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]",
              "sm:px-3.5 sm:text-sm",
              disabled ? "cursor-default opacity-60" : "cursor-pointer",
            ].join(" ")}
            style={
              isActive
                ? {
                    border: `1.5px solid ${color.border}`,
                    background: color.bg,
                    color: color.text,
                  }
                : {
                    border: "1.5px solid var(--color-active-border)",
                    background: "var(--color-active-bg)",
                    color: "var(--color-gray)",
                  }
            }
          >
            {/* sliding background pill */}
            {isActive && (
              <motion.span
                layoutId="cfb-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: color.bg, zIndex: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1">
              {/* color dot */}
              <span
                className="block h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2"
                style={{
                  background: isActive ? color.text : color.border,
                  opacity: isActive ? 0.9 : 0.7,
                }}
              />
              {cls}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default ClassFilterBtns;
