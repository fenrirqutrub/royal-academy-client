// src/utility/Constants.ts
import type { ElementType } from "react";
import {
  MdOutlineClass,
  MdOutlineScience,
  MdOutlineHistoryEdu,
  MdOutlineComputer,
  MdOutlineCurrencyExchange,
  MdOutlineAccountBalance,
  MdOutlineBusinessCenter,
} from "react-icons/md";
import {
  TbMath,
  TbLanguage,
  TbMathIntegrals,
  TbReportMoney,
} from "react-icons/tb";
import { GiEarthAsiaOceania, GiDna1, GiLotus, GiFarmer } from "react-icons/gi";
import { FaBookOpen, FaFlask } from "react-icons/fa";
import { PiMosqueDuotone } from "react-icons/pi";
import { Crown, GraduationCap, ShieldCheck, Star } from "lucide-react";
import type { SelectOption } from "../components/common/SelectInput";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Screen = "mobile" | "tablet" | "desktop";
export type StaffRole = "teacher" | "principal" | "admin";
export type FieldState = "idle" | "valid" | "error";
export type Gender = "ছেলে" | "মেয়ে" | "পুরুষ" | "নারী" | null;

// ─── Roles ────────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "admin" | "principal" | "teacher" | "student";

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

// ─── Role Groups ──────────────────────────────────────────────────────────────

export const PRIVILEGED_ROLES: UserRole[] = ["owner", "admin", "principal"];

export const isPrivilegedRole = (role: UserRole): boolean =>
  PRIVILEGED_ROLES.includes(role);

export const STAFF_DASHBOARD_ROLES: UserRole[] = [
  "owner",
  "admin",
  "principal",
  "teacher",
];

// ─── Role Badge CSS ───────────────────────────────────────────────────────────

export const ROLE_BADGE_CLASS: Partial<Record<UserRole, string>> = {
  owner: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  admin: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  principal:
    "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
  teacher: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
};

// ─── Staff Role Labels ────────────────────────────────────────────────────────

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  teacher: "শিক্ষক",
  principal: "অধ্যক্ষ",
  admin: "প্রশাসক",
};

// ─── Religion ─────────────────────────────────────────────────────────────────

export const RELIGIONS = [
  { value: "ইসলাম", icon: "☪️" },
  { value: "হিন্দু", icon: "🕉️" },
  { value: "বৌদ্ধ", icon: "☸️" },
  { value: "খ্রিষ্টান", icon: "✝️" },
] as const;

export type Religion = (typeof RELIGIONS)[number]["value"] | null;

// ─── Subject Groups ───────────────────────────────────────────────────────────

export const SUBJECT_GROUPS = [
  { value: "বিজ্ঞান", icon: "🔬" },
  { value: "মানবিক", icon: "📖" },
  { value: "বাণিজ্য", icon: "💼" },
] as const;

// ─── Gender Options ───────────────────────────────────────────────────────────

export const STUDENT_GENDER_OPTIONS: { v: Gender; icon: string }[] = [
  { v: "ছেলে", icon: "👦" },
  { v: "মেয়ে", icon: "👧" },
];

export const STAFF_GENDER_OPTIONS: { v: Gender; icon: string }[] = [
  { v: "পুরুষ", icon: "👨" },
  { v: "নারী", icon: "👩" },
];

// ─── Classes ──────────────────────────────────────────────────────────────────

export const CLASSES = [
  "৬ষ্ঠ শ্রেণি",
  "৭ম শ্রেণি",
  "৮ম শ্রেণি",
  "৯ম শ্রেণি",
  "১০ম শ্রেণি",
  "একাদশ শ্রেণি",
  "দ্বাদশ শ্রেণি",
] as const;

export const CLASS_OPTIONS: SelectOption[] = CLASSES.map((c) => ({
  value: c,
  label: c,
  icon: <MdOutlineClass />,
}));

export const CLASS_ORDER = Object.fromEntries(
  CLASSES.map((c, i) => [c, i + 1]),
);

export const ADVANCED_CLASSES = ["৯ম শ্রেণি", "১০ম শ্রেণি", "SSC Batch"];

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const BASE_SUBJECTS: SelectOption[] = [
  { value: "বাংলা ১ম", label: "বাংলা ১ম", icon: <TbLanguage /> },
  { value: "বাংলা ২য়", label: "বাংলা ২য়", icon: <TbLanguage /> },
  { value: "আনন্দপাঠ", label: "আনন্দপাঠ", icon: <TbLanguage /> },
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
    value: "তথ্য যোগাযোগ ও প্রযুক্তি",
    label: "তথ্য যোগাযোগ ও প্রযুক্তি",
    icon: <MdOutlineComputer />,
  },
  {
    value: "ইসলাম শিক্ষা",
    label: "ইসলাম শিক্ষা",
    icon: <PiMosqueDuotone />,
  },
  {
    value: "হিন্দুধর্ম শিক্ষা",
    label: "হিন্দুধর্ম শিক্ষা",
    icon: <GiLotus />,
  },
  { value: "কৃষি শিক্ষা", label: "কৃষি শিক্ষা", icon: <GiFarmer /> },
];

export const ADVANCED_SUBJECTS: SelectOption[] = [
  {
    value: "পদার্থ বিজ্ঞান",
    label: "পদার্থ বিজ্ঞান",
    icon: <MdOutlineScience />,
  },
  { value: "রসায়ন", label: "রসায়ন", icon: <FaFlask /> },
  { value: "জীব বিজ্ঞান", label: "জীব বিজ্ঞান", icon: <GiDna1 /> },
  {
    value: "উচ্চতর গণিত",
    label: "উচ্চতর গণিত",
    icon: <TbMathIntegrals />,
  },
  {
    value: "ভূগোল ও পরিবেশ",
    label: "ভূগোল ও পরিবেশ",
    icon: <GiEarthAsiaOceania />,
  },
  {
    value: "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা",
    label: "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা",
    icon: <MdOutlineHistoryEdu />,
  },
  {
    value: "অর্থনীতি",
    label: "অর্থনীতি",
    icon: <MdOutlineCurrencyExchange />,
  },
  {
    value: "পৌরনীতি ও নাগরিকতা",
    label: "পৌরনীতি ও নাগরিকতা",
    icon: <MdOutlineAccountBalance />,
  },
  {
    value: "হিসাব বিজ্ঞান",
    label: "হিসাব বিজ্ঞান",
    icon: <TbReportMoney />,
  },
  {
    value: "ব্যবসায় উদ্যোগ",
    label: "ব্যবসায় উদ্যোগ",
    icon: <MdOutlineBusinessCenter />,
  },
  {
    value: "ফিন্যান্স ও ব্যাংকিং",
    label: "ফিন্যান্স ও ব্যাংকিং",
    icon: <MdOutlineAccountBalance />,
  },
];

export const getSubjects = (cls: string): SelectOption[] =>
  ADVANCED_CLASSES.includes(cls)
    ? [...BASE_SUBJECTS, ...ADVANCED_SUBJECTS]
    : BASE_SUBJECTS;

// ─── Degree ───────────────────────────────────────────────────────────────────

export const DEGREES = [
  { value: "hsc", label: "এইচএসসি / সমমান", icon: "📘" },
  { value: "hons", label: "স্নাতক (সম্মান)", icon: "🎓" },
  { value: "masters", label: "স্নাতকোত্তর", icon: "🏅" },
] as const;

export type Degree = (typeof DEGREES)[number]["value"] | "";

export const DEGREE_LABEL = Object.fromEntries(
  DEGREES.map((d) => [d.value, d.label]),
);

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const EXAM_COLORS = [
  { from: "#6366f1", to: "#818cf8" },
  { from: "#0ea5e9", to: "#38bdf8" },
  { from: "#10b981", to: "#34d399" },
  { from: "#f59e0b", to: "#fbbf24" },
  { from: "#ec4899", to: "#f472b6" },
  { from: "#7c3aed", to: "#a855f7" },
];

export const BD_DIVISIONS = [
  "ঢাকা",
  "চট্টগ্রাম",
  "রাজশাহী",
  "খুলনা",
  "বরিশাল",
  "সিলেট",
  "রংপুর",
  "ময়মনসিংহ",
];

// ─── Utility Functions ────────────────────────────────────────────────────────

export const toAsciiDigits = (val: string): string =>
  val.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

export const toLocalIso = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export const validateBdPhone = (val: string): true | string => {
  const ascii = toAsciiDigits(val);
  return (
    BD_PHONE_REGEX.test(ascii) ||
    "সঠিক বাংলাদেশি নম্বর দিন (০১৩–০১৯ দিয়ে শুরু, ১১ সংখ্যা)"
  );
};

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface SignupForm {
  fullName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gramNam: string;
  para: string;
  thana: string;
  district: string;
  division: string;
  landmark: string;
  permanentGramNam: string;
  permanentPara: string;
  permanentThana: string;
  permanentDistrict: string;
  permanentDivision: string;
  studentClass: string;
  studentSubject: string;
  roll: string;
  schoolName: string;
  qualification: string;
  degree: Degree;
  currentYear: "1st" | "2nd" | "3rd" | "4th" | "mba" | "mbbs" | "ma" | "";
  password: string;
  emergencyContact: string;
}

export const YEARS: {
  value: SignupForm["currentYear"];
  label: string;
}[] = [
  { value: "1st", label: "প্রথম বর্ষ" },
  { value: "2nd", label: "দ্বিতীয় বর্ষ" },
  { value: "3rd", label: "তৃতীয় বর্ষ" },
  { value: "4th", label: "চতুর্থ বর্ষ" },
  { value: "mba", label: "এমবিএ" },
  { value: "mbbs", label: "এমবিবিএস" },
  { value: "ma", label: "এমএ" },
];

// ─── Profile Page Helpers ─────────────────────────────────────────────────────

export const RELIGION_SELECT_OPTIONS: SelectOption[] = RELIGIONS.map((r) => ({
  value: r.value,
  label: r.value,
}));

export const SUBJECT_GROUP_SELECT_OPTIONS: SelectOption[] = SUBJECT_GROUPS.map(
  (s) => ({ value: s.value, label: s.value }),
);

export const DEGREE_SELECT_OPTIONS: SelectOption[] = DEGREES.map((d) => ({
  value: d.value,
  label: d.label,
}));

export const YEAR_SELECT_OPTIONS: SelectOption[] = YEARS.map((y) => ({
  value: y.value,
  label: y.label,
}));

// Classes যেগুলোতে subject group দরকার
export const SUBJECT_REQUIRED_CLASSES: readonly string[] = [
  "৯ম শ্রেণি",
  "১০ম শ্রেণি",
  "একাদশ শ্রেণি",
  "দ্বাদশ শ্রেণি",
];

// education incomplete হলে যে years দেখাবে
export const ACADEMIC_YEAR_OPTIONS: SelectOption[] = YEARS.filter((y) =>
  ["1st", "2nd", "3rd", "4th"].includes(y.value),
).map((y) => ({ value: y.value, label: y.label }));
