import { useMemo } from "react";
import { motion, LayoutGroup, type Variants } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { CLASS_ORDER } from "../../utility/Constants";
import type { DailyLessonData } from "../../pages/DailyLesson/DailyLessonUpdateModals";

interface ClassFilterBtnsProps {
  activeId: string;
  onChange: (id: string) => void;
  data: DailyLessonData[];
  disabled?: boolean;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.88 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const contentVariants: Variants = {
  inactive: {
    x: 0,
    transition: { duration: 0.16 },
  },
  active: {
    x: 0,
    transition: { duration: 0.16 },
  },
  hover: {
    x: 1.5,
    transition: { duration: 0.16 },
  },
  tap: {
    x: 0,
    transition: { duration: 0.08 },
  },
  disabled: {
    x: 0,
  },
};

const dotVariants: Variants = {
  inactive: {
    scale: 1,
    opacity: 0.7,
    transition: { duration: 0.16 },
  },
  active: {
    scale: 1.1,
    opacity: 0.95,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 24,
    },
  },
  hover: {
    scale: 1.18,
    opacity: 1,
    transition: { duration: 0.16 },
  },
  tap: {
    scale: 0.9,
    transition: { duration: 0.08 },
  },
  disabled: {
    scale: 1,
    opacity: 0.5,
  },
};

const getButtonClass = ({
  isActive,
  disabled,
  isAll = false,
}: {
  isActive: boolean;
  disabled: boolean;
  isAll?: boolean;
}) =>
  [
    "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-xs font-bold outline-none transition-colors duration-150 sm:px-3.5 sm:text-sm",
    disabled
      ? "cursor-default opacity-60"
      : "cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]",
    isActive
      ? isAll
        ? "border-[1.5px] border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]"
        : "border-[1.5px] border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
      : "border-[1.5px] border-[var(--color-active-border)] bg-[var(--color-active-bg)] text-[var(--color-gray)]",
  ].join(" ");

const ClassFilterBtns = ({
  activeId,
  onChange,
  data,
  disabled = false,
}: ClassFilterBtnsProps) => {
  const classes = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    data.forEach((lesson) => {
      if (!seen.has(lesson.class)) {
        seen.add(lesson.class);
        result.push(lesson.class);
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

  const getState = (isActive: boolean) => {
    if (disabled) return "disabled";
    return isActive ? "active" : "inactive";
  };

  const isAllActive = activeId === "all";

  return (
    <LayoutGroup id="daily-lesson-class-filter">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center justify-center gap-1.5 bangla sm:gap-2"
      >
        {/* All button */}
        <motion.button
          variants={itemVariants}
          initial={false}
          animate={getState(isAllActive)}
          whileHover={!disabled ? "hover" : undefined}
          whileTap={!disabled ? "tap" : undefined}
          onClick={() => handleChange("all")}
          disabled={disabled}
          aria-pressed={isAllActive}
          className={getButtonClass({
            isActive: isAllActive,
            disabled,
            isAll: true,
          })}
        >
          {isAllActive && (
            <motion.span
              layoutId="cfb-pill"
              className="absolute inset-0 rounded-full bg-[var(--color-text)]"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}

          <motion.span
            variants={contentVariants}
            className="relative z-10 flex items-center gap-1"
          >
            <LayoutGrid
              size={12}
              strokeWidth={2.5}
              className="shrink-0 sm:size-3.5"
            />
            সকল
          </motion.span>
        </motion.button>

        {/* Class buttons */}
        {classes.map((cls) => {
          const isActive = activeId === cls;

          return (
            <motion.button
              key={cls}
              variants={itemVariants}
              initial={false}
              animate={getState(isActive)}
              whileHover={!disabled ? "hover" : undefined}
              whileTap={!disabled ? "tap" : undefined}
              onClick={() => handleChange(cls)}
              disabled={disabled}
              aria-pressed={isActive}
              className={getButtonClass({
                isActive,
                disabled,
              })}
            >
              {isActive && (
                <motion.span
                  layoutId="cfb-pill"
                  className="absolute inset-0 rounded-full bg-[var(--color-brand-soft)]"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}

              <motion.span
                variants={contentVariants}
                className="relative z-10 flex items-center gap-1"
              >
                <motion.span
                  variants={dotVariants}
                  className={[
                    "block h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2",
                    isActive
                      ? "bg-[var(--color-brand)]"
                      : "bg-[var(--color-gray)]",
                  ].join(" ")}
                />
                {cls}
              </motion.span>
            </motion.button>
          );
        })}
      </motion.div>
    </LayoutGroup>
  );
};

export default ClassFilterBtns;
