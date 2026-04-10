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
import type { SelectOption } from "../components/common/SelectInput";
import { Crown, GraduationCap, ShieldCheck } from "lucide-react";

export const CLASS_OPTIONS: SelectOption[] = [
  ...["৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম"].map((c) => ({
    value: `${c} শ্রেণি`,
    label: `${c} শ্রেণি`,
    icon: <MdOutlineClass />,
  })),
  { value: "SSC Batch", label: "SSC Batch", icon: <MdOutlineClass /> },
];

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
  { value: "ইসলাম শিক্ষা", label: "ইসলাম শিক্ষা", icon: <PiMosqueDuotone /> },
  { value: "হিন্দুধর্ম শিক্ষা", label: "হিন্দুধর্ম শিক্ষা", icon: <GiLotus /> },
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
  { value: "উচ্চতর গণিত", label: "উচ্চতর গণিত", icon: <TbMathIntegrals /> },
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
  { value: "অর্থনীতি", label: "অর্থনীতি", icon: <MdOutlineCurrencyExchange /> },
  {
    value: "পৌরনীতি ও নাগরিকতা",
    label: "পৌরনীতি ও নাগরিকতা",
    icon: <MdOutlineAccountBalance />,
  },
  { value: "হিসাব বিজ্ঞান", label: "হিসাব বিজ্ঞান", icon: <TbReportMoney /> },
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
  cls.startsWith("৯ম") || cls.startsWith("১০ম") || cls === "SSC Batch"
    ? [...BASE_SUBJECTS, ...ADVANCED_SUBJECTS]
    : BASE_SUBJECTS;

// ─── Class ordering ────────────────────────────────────────

export const CLASS_ORDER: Record<string, number> = {
  "৬ষ্ঠ শ্রেণি": 1,
  "৭ম শ্রেণি": 2,
  "৮ম শ্রেণি": 3,
  "৯ম শ্রেণি": 4,
  "১০ম শ্রেণি": 5,
};

export const EXAM_COLORS = [
  { from: "#6366f1", to: "#818cf8" },
  { from: "#0ea5e9", to: "#38bdf8" },
  { from: "#10b981", to: "#34d399" },
  { from: "#f59e0b", to: "#fbbf24" },
  { from: "#ec4899", to: "#f472b6" },
  { from: "#7c3aed", to: "#a855f7" },
];

export const ROLES: Record<string, { label: string; color: string }> = {
  owner: { label: "মালিক", color: "#f59e0b" },
  admin: { label: "প্রশাসক", color: "#ef4444" },
  principal: { label: "অধ্যক্ষ", color: "#8b5cf6" },
  teacher: { label: "শিক্ষক", color: "#3b82f6" },
  student: { label: "ছাত্র/ছাত্রী", color: "#22c55e" },
};

export const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    Icon: React.ElementType;
    desc: string;
    handle: string;
  }
> = {
  principal: {
    label: "অধ্যক্ষ",
    color: "#8b5cf6",
    Icon: Crown,
    desc: "প্রধান শিক্ষক",
    handle: "পরিচালক",
  },
  admin: {
    label: "প্রশাসক",
    color: "#ef4444",
    Icon: ShieldCheck,
    desc: "প্রশাসনিক কর্মকর্তা",
    handle: "প্রশাসক",
  },
  teacher: {
    label: "শিক্ষক",
    color: "#3b82f6",
    Icon: GraduationCap,
    desc: "শিক্ষক",
    handle: "শিক্ষক",
  },
};

export const DEGREE_LABEL: Record<string, string> = {
  hsc: "এইচএসসি / সমমান",
  hons: "স্নাতক (সম্মান)",
  masters: "স্নাতকোত্তর",
};

// sign up form constants
export interface SignupForm {
  // Identity
  fullName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  // Present address
  gramNam: string;
  para: string;
  thana: string;
  district: string;
  division: string;
  landmark: string;
  // Permanent address
  permanentGramNam: string;
  permanentPara: string;
  permanentThana: string;
  permanentDistrict: string;
  permanentDivision: string;
  // Student fields
  studentClass: string;
  studentSubject: string;
  roll: string;
  schoolName: string;
  // Staff education
  qualification: string;
  degree: "hsc" | "hons" | "masters" | "";
  currentYear: "1st" | "2nd" | "3rd" | "4th" | "mba" | "mbbs" | "ma" | "";
  // Auth
  password: string;
  // Optional
  emergencyContact: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Gender = "পুরুষ" | "নারী" | "ছেলে" | "মেয়ে" | null;
export type Religion = "ইসলাম" | "হিন্দু" | "বৌদ্ধ" | "খ্রিষ্টান" | null;
export type FieldState = "idle" | "valid" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLASSES = [
  "ষষ্ঠ শ্রেণি",
  "সপ্তম শ্রেণি",
  "অষ্টম শ্রেণি",
  "নবম শ্রেণি",
  "দশম শ্রেণি",
  "একাদশ শ্রেণি",
  "দ্বাদশ শ্রেণি",
];

export const CLASSES_WITH_SUBJECT = [
  "নবম শ্রেণি",
  "দশম শ্রেণি",
  "একাদশ শ্রেণি",
  "দ্বাদশ শ্রেণি",
];

export const SUBJECTS = [
  { value: "বিজ্ঞান", icon: "🔬" },
  { value: "মানবিক", icon: "📖" },
  { value: "বাণিজ্য", icon: "💼" },
];

export const DEGREES: {
  value: SignupForm["degree"];
  label: string;
  icon: string;
}[] = [
  { value: "hsc", label: "এইচএসসি / সমমান", icon: "📘" },
  { value: "hons", label: "স্নাতক (সম্মান)", icon: "🎓" },
  { value: "masters", label: "স্নাতকোত্তর", icon: "🏅" },
];

export const YEARS: { value: SignupForm["currentYear"]; label: string }[] = [
  { value: "1st", label: "প্রথম বর্ষ" },
  { value: "2nd", label: "দ্বিতীয় বর্ষ" },
  { value: "3rd", label: "তৃতীয় বর্ষ" },
  { value: "4th", label: "চতুর্থ বর্ষ" },
  { value: "mba", label: "এমবিএ" },
  { value: "mbbs", label: "এমবিবিএস" },
  { value: "ma", label: "এমএ" },
];

export const RELIGIONS = [
  { value: "ইসলাম", icon: "☪️" },
  { value: "হিন্দু", icon: "🕉️" },
  { value: "বৌদ্ধ", icon: "☸️" },
  { value: "খ্রিষ্টান", icon: "✝️" },
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
