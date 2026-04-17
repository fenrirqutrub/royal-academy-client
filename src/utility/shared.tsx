// src/utility/shared.tsx
import { motion } from "framer-motion";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface ExamImage {
  url?: string;
  imageUrl?: string;
  publicId?: string;
}

export interface Exam {
  _id: string;
  ExamNumber: number | string;
  subject: string;
  class: string;
  mark: number | string;
  topics: string;
  teacher?: string;
  date: string;
  images?: (string | ExamImage)[];
  numberType?: "pageNumber" | "chapterNumber";
  pageNumber?: string | number | null;
  chapterNumber?: string | number | null;
  question?: string | null;
}

export interface ColorConfig {
  from: string;
  to: string;
  text?: string;
}

/* ─── Colors ─────────────────────────────────────────────────────────────── */

export const COLORS: ColorConfig[] = [
  { from: "#6366f1", to: "#8b5cf6", text: "#6366f1" },
  { from: "#f59e0b", to: "#f97316", text: "#d97706" },
  { from: "#10b981", to: "#059669", text: "#059669" },
  { from: "#3b82f6", to: "#2563eb", text: "#2563eb" },
  { from: "#ec4899", to: "#db2777", text: "#db2777" },
  { from: "#14b8a6", to: "#0d9488", text: "#0d9488" },
  { from: "#f43f5e", to: "#e11d48", text: "#e11d48" },
  { from: "#8b5cf6", to: "#7c3aed", text: "#7c3aed" },
];

/* ─── Bengali number converter ───────────────────────────────────────────── */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBn = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return "";
  return String(n).replace(/\d/g, (d) => BN_DIGITS[parseInt(d)]);
};

/* ─── Bengali date string ────────────────────────────────────────────────── */

import { BN_DAYS_FULL, BN_MONTHS } from "../components/common/Datepicker";

export const toBnDateStr = (d: Date): string =>
  `${BN_DAYS_FULL[d.getDay()]}, ${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBn(d.getFullYear())}`;

/* ─── Helper: Get number display info ────────────────────────────────────── */

export const getNumberInfo = (
  exam: Exam,
): { label: string; value: string } | null => {
  const isPageType = exam.numberType === "pageNumber";
  const value = isPageType ? exam.pageNumber : exam.chapterNumber;
  if (!value) return null;
  return {
    label: isPageType ? "পৃষ্ঠা" : "অধ্যায়",
    value: toBn(value),
  };
};

/* ─── AnimatedSlide ──────────────────────────────────────────────────────── */

interface AnimatedSlideProps {
  img: string | ExamImage;
  isActive: boolean;
  className?: string;
}

export const AnimatedSlide = ({
  img,
  isActive,
  className = "",
}: AnimatedSlideProps) => {
  const src = typeof img === "string" ? img : (img.url ?? img.imageUrl ?? "");

  return (
    <motion.img
      src={src}
      alt=""
      className={className}
      animate={{ scale: isActive ? 1 : 1.04 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      draggable={false}
    />
  );
};

/* ─── SlideDots ──────────────────────────────────────────────────────────── */

interface SlideDotsProps {
  count: number;
  active: number;
  color: ColorConfig;
}

export const SlideDots = ({ count, active, color }: SlideDotsProps) => (
  <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        className="block rounded-full transition-all duration-300"
        style={{
          width: i === active ? 16 : 6,
          height: 6,
          backgroundColor: i === active ? color.from : "rgba(255,255,255,0.55)",
        }}
      />
    ))}
  </div>
);

/* ─── SlideProgress ──────────────────────────────────────────────────────── */

interface SlideProgressProps {
  color: ColorConfig;
}

export const SlideProgress = ({ color }: SlideProgressProps) => (
  <motion.div
    key={Math.random()}
    className="absolute top-0 left-0 z-20 h-0.5"
    initial={{ width: "0%" }}
    animate={{ width: "100%" }}
    transition={{ duration: 3.8, ease: "linear" }}
    style={{
      background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
    }}
  />
);

/* ─── Per-class palettes ─────────────────────────────────────────────────── */

export type ClassColor = {
  from: string;
  to: string;
  soft: string;
  text: string;
};

export const CLASS_COLORS: Record<string, ClassColor> = {
  "৬ষ্ঠ শ্রেণি": {
    from: "#6366f1",
    to: "#818cf8",
    soft: "#eef2ff",
    text: "#4338ca",
  },
  "৭ম শ্রেণি": {
    from: "#0ea5e9",
    to: "#38bdf8",
    soft: "#e0f2fe",
    text: "#0369a1",
  },
  "৮ম শ্রেণি": {
    from: "#10b981",
    to: "#34d399",
    soft: "#d1fae5",
    text: "#065f46",
  },
  "৯ম শ্রেণি": {
    from: "#f59e0b",
    to: "#fbbf24",
    soft: "#fef3c7",
    text: "#92400e",
  },
  "১০ম শ্রেণি": {
    from: "#ec4899",
    to: "#f472b6",
    soft: "#fce7f3",
    text: "#9d174d",
  },
};

export const DEFAULT_CLASS_COLOR: ClassColor = {
  from: "#7c3aed",
  to: "#a855f7",
  soft: "#ede9fe",
  text: "#4c1d95",
};
