// src/components/common/ExamPagination.tsx
import { useMemo } from "react";
import { motion } from "framer-motion";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// ─── Bengali numeral helper ───────────────────────────────
const toBn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// ─── Props ────────────────────────────────────────────────
export interface ExamPaginationProps {
  /** All unique ExamNumbers (strings), already sorted numerically */
  examNumbers: string[];
  /** Currently active ExamNumber */
  selected: string;
  /** Called when user picks a different ExamNumber */
  onSelect: (examNumber: string) => void;
  /** Optional subtitle shown below the buttons */
  hint?: string;
  /** Max visible buttons at once (default: 5) */
  windowSize?: number;
}

// ─── Component ────────────────────────────────────────────
const ExamPagination = ({
  examNumbers,
  selected,
  onSelect,
  hint,
  windowSize = 5,
}: ExamPaginationProps) => {
  const total = examNumbers.length;
  const selectedIndex = examNumbers.indexOf(selected);

  // Sliding window centred on active item
  const visibleNumbers = useMemo(() => {
    if (total <= windowSize) return examNumbers;
    const start = Math.max(
      0,
      Math.min(selectedIndex - Math.floor(windowSize / 2), total - windowSize),
    );
    return examNumbers.slice(start, start + windowSize);
  }, [examNumbers, selectedIndex, total, windowSize]);

  if (total <= 1) return null;

  const arrowCls =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl " +
    "text-slate-500 dark:text-slate-400 transition-all duration-200 " +
    "hover:bg-violet-50 dark:hover:bg-violet-900/30 " +
    "hover:text-violet-600 dark:hover:text-violet-400 " +
    "disabled:opacity-30 disabled:pointer-events-none";

  return (
    <nav
      role="navigation"
      aria-label="পরীক্ষা নম্বর পেজিনেশন"
      className="mt-10 flex flex-col items-center gap-3"
    >
      <div className="flex items-center gap-1.5">
        {/* ← Prev */}
        <button
          onClick={() => onSelect(examNumbers[selectedIndex - 1])}
          disabled={selectedIndex === 0}
          aria-label="আগের পরীক্ষা"
          className={arrowCls}
        >
          <IoChevronBack className="w-5 h-5" />
        </button>

        {/* Exam number buttons */}
        {visibleNumbers.map((num) => {
          const isActive = num === selected;
          return (
            <motion.button
              key={num}
              onClick={() => onSelect(num)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.93 }}
              aria-label={`পরীক্ষা নং ${num}`}
              aria-current={isActive ? "page" : undefined}
              className={`h-10 min-w-[3rem] px-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "text-white shadow-lg shadow-violet-300/40 dark:shadow-violet-900/50"
                  : "text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-300"
              }`}
              style={
                isActive
                  ? { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }
                  : {}
              }
            >
              {toBn(num)}
            </motion.button>
          );
        })}

        {/* → Next */}
        <button
          onClick={() => onSelect(examNumbers[selectedIndex + 1])}
          disabled={selectedIndex === total - 1}
          aria-label="পরের পরীক্ষা"
          className={arrowCls}
        >
          <IoChevronForward className="w-5 h-5" />
        </button>
      </div>

      {hint && (
        <p className="text-xs text-slate-400 dark:text-slate-500 tracking-wide">
          {hint}
        </p>
      )}
    </nav>
  );
};

export default ExamPagination;
