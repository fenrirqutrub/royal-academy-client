import type { ColorConfig } from "../utility/Formatters";

export type ClassColor = {
  from: string;
  to: string;
  soft: string;
  text: string;
};

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

export const EXAM_COLORS = [
  { from: "#6366f1", to: "#818cf8" },
  { from: "#0ea5e9", to: "#38bdf8" },
  { from: "#10b981", to: "#34d399" },
  { from: "#f59e0b", to: "#fbbf24" },
  { from: "#ec4899", to: "#f472b6" },
  { from: "#7c3aed", to: "#a855f7" },
];
