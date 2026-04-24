import { motion } from "framer-motion";
// FIX: ExamImage now lives only in types.ts — import from there
import type { Exam, ExamImage } from "../types/types";

export interface ColorConfig {
  from: string;
  to: string;
  text?: string;
}

interface AnimatedSlideProps {
  img: string | ExamImage;
  isActive: boolean;
  className?: string;
}

interface SlideDotsProps {
  count: number;
  active: number;
  color: ColorConfig;
}

interface SlideProgressProps {
  color: ColorConfig;
}

export const BN_DAYS_SHORT = [
  "রবি",
  "সোম",
  "মঙ্গল",
  "বুধ",
  "বৃহ",
  "শুক্র",
  "শনি",
];

export const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const BN_DAYS_FULL = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export type DateInput = string | number | Date;

const toDate = (input: DateInput): Date =>
  input instanceof Date ? input : new Date(input);

export const toBn = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return "";
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
};

export const toEn = (s: string): string =>
  s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

export const toBnDateStr = (input: DateInput): string => {
  const d = toDate(input);
  return `${BN_DAYS_FULL[d.getDay()]}, ${toBn(d.getDate())} ${
    BN_MONTHS[d.getMonth()]
  } ${toBn(d.getFullYear())}`;
};

export const formatBnDate = (input: DateInput): string => toBnDateStr(input);

export const getTodayBnDate = (): string => formatBnDate(new Date());

export const isSameCalendarDay = (a: DateInput, b: DateInput): boolean => {
  const left = toDate(a);
  const right = toDate(b);

  return (
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear()
  );
};

export const hexToRgb = (hex: string): string => {
  const raw = hex.replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  if (normalized.length !== 6) return "0, 0, 0";

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some(Number.isNaN)) return "0, 0, 0";
  return `${r}, ${g}, ${b}`;
};

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

export const SlideProgress = ({ color }: SlideProgressProps) => (
  <motion.div
    key={Math.random()}
    className="absolute left-0 top-0 z-20 h-0.5"
    initial={{ width: "0%" }}
    animate={{ width: "100%" }}
    transition={{ duration: 3.8, ease: "linear" }}
    style={{
      background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
    }}
  />
);

export const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const { label, seconds } of intervals) {
    const count = Math.floor(diffInSeconds / seconds);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
};

export const truncateText = (text: string, maxLength: number = 120): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
};

export const formatDate = (
  input: DateInput,
  format: "long" | "short" = "long",
): string => {
  const dateObj = toDate(input);

  if (format === "short") {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? "";
};
