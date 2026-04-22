// src/utility/Constants.ts

import type { ElementType } from "react";
import {
  MdOutlineClass,
  MdOutlineScience,
  MdOutlineCurrencyExchange,
} from "react-icons/md";
import { TbMath, TbLanguage, TbMathIntegrals } from "react-icons/tb";
import { GiEarthAsiaOceania, GiDna1 } from "react-icons/gi";
import { FaBookOpen, FaFlask } from "react-icons/fa";

import {
  BookOpen,
  Crown,
  FileText,
  GraduationCap,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toEn } from "./Formatters";
import type { SelectOption } from "../types/types";

// ─────────────────────────────────────────────────────────────
// 🔹 CORE TYPES
// ─────────────────────────────────────────────────────────────

export type Screen = "mobile" | "tablet" | "desktop";
export type FieldState = "idle" | "valid" | "error";

export type Gender = "ছেলে" | "মেয়ে" | "পুরুষ" | "নারী" | null;

// ─────────────────────────────────────────────────────────────
// 🔹 ROLES & PERMISSIONS
// ─────────────────────────────────────────────────────────────

export type UserRole = "owner" | "admin" | "principal" | "teacher" | "student";

export type StaffRole = "teacher" | "principal" | "admin";
export const MANAGER_ROLES = ["principal", "admin", "owner"];
export const STAFF_ROLES = ["teacher", "principal", "admin", "owner"];

export const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    color: string;
    bg: string;
    Icon: ElementType;
    desc: string;
    handle: string;
  }
> = {
  owner: {
    label: "মালিক",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    Icon: Star,
    desc: "সিস্টেম মালিক",
    handle: "মালিক",
  },
  admin: {
    label: "প্রশাসক",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    Icon: ShieldCheck,
    desc: "প্রশাসনিক কর্মকর্তা",
    handle: "প্রশাসক",
  },
  principal: {
    label: "অধ্যক্ষ",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    Icon: Crown,
    desc: "প্রধান শিক্ষক",
    handle: "পরিচালক",
  },
  teacher: {
    label: "শিক্ষক",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    Icon: GraduationCap,
    desc: "শিক্ষক",
    handle: "শিক্ষক",
  },
  student: {
    label: "ছাত্র/ছাত্রী",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    Icon: GraduationCap,
    desc: "শিক্ষার্থী",
    handle: "ছাত্র",
  },
};

export const STAFF_ROLE_LIST: StaffRole[] = ["teacher", "principal", "admin"];

export const ROLE_PERMISSIONS: Record<UserRole, StaffRole[]> = {
  owner: ["admin", "principal", "teacher"],
  admin: ["admin", "principal", "teacher"],
  principal: ["principal", "teacher"],
  teacher: [],
  student: [],
};

export const PRIVILEGED_ROLES: UserRole[] = ["owner", "admin", "principal"];

export const STAFF_DASHBOARD_ROLES: UserRole[] = [
  "owner",
  "admin",
  "principal",
  "teacher",
];

export const isPrivilegedRole = (role: UserRole) =>
  PRIVILEGED_ROLES.includes(role);

// ─────────────────────────────────────────────────────────────
// 🔹 ROLE UI
// ─────────────────────────────────────────────────────────────

export const ROLE_BADGE_CLASS: Partial<Record<UserRole, string>> = {
  owner: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  admin: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  principal:
    "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
  teacher: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  teacher: "শিক্ষক",
  principal: "অধ্যক্ষ",
  admin: "প্রশাসক",
};

// ─────────────────────────────────────────────────────────────
// 🔹 RELIGION
// ─────────────────────────────────────────────────────────────

export const RELIGIONS = [
  { value: "ইসলাম", icon: "☪️" },
  { value: "হিন্দু", icon: "🕉️" },
  { value: "বৌদ্ধ", icon: "☸️" },
  { value: "খ্রিষ্টান", icon: "✝️" },
] as const;

export type Religion = (typeof RELIGIONS)[number]["value"] | null;

/** SelectOption[] for use in <SelectInput> */
export const RELIGION_SELECT_OPTIONS: SelectOption[] = RELIGIONS.map((r) => ({
  value: r.value,
  label: r.value,
  icon: r.icon,
}));

// ─────────────────────────────────────────────────────────────
// 🔹 GENDER
// ─────────────────────────────────────────────────────────────

export const STUDENT_GENDER_OPTIONS = [
  { v: "ছেলে" as Gender, icon: "👦" },
  { v: "মেয়ে" as Gender, icon: "👧" },
];

export const STAFF_GENDER_OPTIONS = [
  { v: "পুরুষ" as Gender, icon: "👨" },
  { v: "নারী" as Gender, icon: "👩" },
];

// ─────────────────────────────────────────────────────────────
// 🔹 SUBJECT GROUPS  (fixed: added label so SelectInput works)
// ─────────────────────────────────────────────────────────────

export const SUBJECT_GROUPS: SelectOption[] = [
  { value: "বিজ্ঞান", label: "বিজ্ঞান", icon: "🔬" },
  { value: "মানবিক", label: "মানবিক", icon: "📖" },
  { value: "বাণিজ্য", label: "বাণিজ্য", icon: "💼" },
];

// ─────────────────────────────────────────────────────────────
// 🔹 CLASSES
// ─────────────────────────────────────────────────────────────

export const CLASSES = [
  "৬ষ্ঠ শ্রেণি",
  "৭ম শ্রেণি",
  "৮ম শ্রেণি",
  "৯ম শ্রেণি",
  "১০ম শ্রেণি",
] as const;

export const SUBJECT_REQUIRED_CLASSES = [
  "৯ম শ্রেণি",
  "১০ম শ্রেণি",
  "একাদশ শ্রেণি",
  "দ্বাদশ শ্রেণি",
];

export const CLASS_OPTIONS: SelectOption[] = CLASSES.map((c) => ({
  value: c,
  label: c,
  icon: <MdOutlineClass />,
}));

export const CLASS_ORDER = Object.fromEntries(
  CLASSES.map((c, i) => [c, i + 1]),
);

export const ADVANCED_CLASSES = ["৯ম শ্রেণি", "১০ম শ্রেণি", "SSC Batch"];

// ─────────────────────────────────────────────────────────────
// 🔹 SUBJECTS
// ─────────────────────────────────────────────────────────────

export const BASE_SUBJECTS: SelectOption[] = [
  { value: "বাংলা ১ম", label: "বাংলা ১ম", icon: <TbLanguage /> },
  { value: "বাংলা ২য়", label: "বাংলা ২য়", icon: <TbLanguage /> },
  { value: "সহপাঠ", label: "সহপাঠ", icon: <TbLanguage /> },
  { value: "ইংরেজি ১ম", label: "ইংরেজি ১ম", icon: <FaBookOpen /> },
  { value: "ইংরেজি ২য়", label: "ইংরেজি ২য়", icon: <FaBookOpen /> },
  { value: "গণিত", label: "গণিত", icon: <TbMath /> },
  { value: "বিজ্ঞান", label: "বিজ্ঞান", icon: <FaFlask /> },
  {
    value: "বাংলাদেশ ও বিশ্বপরিচয়",
    label: "বাংলাদেশ ও বিশ্বপরিচয়",
    icon: <GiEarthAsiaOceania />,
  },
  {
    value: "ইসলাম শিক্ষা",
    label: "ইসলাম শিক্ষা",
    icon: <GiEarthAsiaOceania />,
  },
  {
    value: "হিন্দু ধর্ম",
    label: "হিন্দু ধর্ম",
    icon: <GiEarthAsiaOceania />,
  },
  {
    value: "কৃষি শিক্ষা",
    label: "কৃষি শিক্ষা",
    icon: <GiEarthAsiaOceania />,
  },
  {
    value: "তথ্য ও যোগাযোগ প্রযুক্তি",
    label: "তথ্য ও যোগাযোগ প্রযুক্তি",
    icon: <GiEarthAsiaOceania />,
  },
];

export const ADVANCED_SUBJECTS: SelectOption[] = [
  {
    value: "পদার্থ বিজ্ঞান",
    label: "পদার্থ বিজ্ঞান",
    icon: <MdOutlineScience />,
  },
  { value: "রসায়ন", label: "রসায়ন", icon: <FaFlask /> },
  { value: "জীব বিজ্ঞান", label: "জীব বিজ্ঞান", icon: <GiDna1 /> },
  { value: "উচ্চতর গণিত", label: "উচ্চতর গণিত", icon: <TbMathIntegrals /> },
  {
    value: "অর্থনীতি",
    label: "অর্থনীতি",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "ভূগোল ও পরিবেশ",
    label: "ভূগোল ও পরিবেশ",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "পৌরনীতি ও নাগরিকতা",
    label: "পৌরনীতি ও নাগরিকতা",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "ইতিহাস ও বিশ্ব সভ্যতা",
    label: "ইতিহাস ও বিশ্ব সভ্যতা",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "হিসাববিজ্ঞান",
    label: "হিসাববিজ্ঞান",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "ফিন্যান্স ও ব্যাংকিং",
    label: "ফিন্যান্স ও ব্যাংকিং",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "ব্যবসায় উদ্যোগ",
    label: "ব্যবসায় উদ্যোগ",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "কুরআন মাজিদ ও তাজভিদ",
    label: "কুরআন মাজিদ ও তাজভিদ",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "আকাইদ ও ফিকহ",
    label: "আকাইদ ও ফিকহ",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "হাদিস শরিফ",
    label: "হাদিস শরিফ",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "ইসলামের ইতিহাস",
    label: "ইসলামের ইতিহাস",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "আললুগাতুল আরাবিয়্যাতুল ইত্তিসালিয়্যাহ",
    label: "আললুগাতুল আরাবিয়্যাতুল ইত্তিসালিয়্যাহ",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "কাওয়াইদুল লুগাতিল আরাবিয়্যাহ",
    label: "কাওয়াইদুল লুগাতিল আরাবিয়্যাহ",
    icon: <MdOutlineCurrencyExchange />,
  },
];

export const getSubjects = (cls: string): SelectOption[] =>
  ADVANCED_CLASSES.includes(cls)
    ? [...BASE_SUBJECTS, ...ADVANCED_SUBJECTS]
    : BASE_SUBJECTS;

export const NUMBER_TYPE_OPTIONS: SelectOption[] = [
  {
    value: "chapterNumber",
    label: "অধ্যায় নম্বর",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    value: "pageNumber",
    label: "পৃষ্ঠা নম্বর",
    icon: <FileText className="w-4 h-4" />,
  },
];

// ─────────────────────────────────────────────────────────────
// 🔹 DEGREE
// ─────────────────────────────────────────────────────────────

export const DEGREES = [
  { value: "hsc", label: "এইচএসসি / সমমান", icon: "📘" },
  { value: "hons", label: "স্নাতক (সম্মান)", icon: "🎓" },
  { value: "masters", label: "স্নাতকোত্তর", icon: "🏅" },
] as const;

export type Degree = (typeof DEGREES)[number]["value"] | "";

/** Map degree value → human-readable label (for display in FieldDisplay) */
export const DEGREE_LABEL: Record<string, string> = Object.fromEntries(
  DEGREES.map((d) => [d.value, d.label]),
);

/** SelectOption[] for use in <SelectInput> */
export const DEGREE_SELECT_OPTIONS: SelectOption[] = DEGREES.map((d) => ({
  value: d.value,
  label: d.label,
  icon: d.icon,
}));

// ─────────────────────────────────────────────────────────────
// 🔹 ACADEMIC YEAR
// ─────────────────────────────────────────────────────────────

/** Current academic year options for staff still in education */
export const YEARS: SelectOption[] = [
  { value: "১ম বর্ষ", label: "১ম বর্ষ" },
  { value: "২য় বর্ষ", label: "২য় বর্ষ" },
  { value: "৩য় বর্ষ", label: "৩য় বর্ষ" },
  { value: "৪র্থ বর্ষ", label: "৪র্থ বর্ষ" },
  { value: "মাস্টার্স ১ম বর্ষ", label: "মাস্টার্স ১ম বর্ষ" },
  { value: "মাস্টার্স ২য় বর্ষ", label: "মাস্টার্স ২য় বর্ষ" },
];

// ─────────────────────────────────────────────────────────────
// 🔹 VALIDATION
// ─────────────────────────────────────────────────────────────

export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export const toAsciiDigits = (val: string): string => toEn(val);

export const validateBdPhone = (val: string): true | string => {
  const ascii = toAsciiDigits(val);
  return (
    BD_PHONE_REGEX.test(ascii) ||
    "সঠিক বাংলাদেশি নম্বর দিন (০১৩–০১৯ দিয়ে শুরু)"
  );
};

// ─────────────────────────────────────────────────────────────
// 🔹 UTILITIES
// ─────────────────────────────────────────────────────────────

export const toLocalIso = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
