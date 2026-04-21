// types.ts

import type { ReactNode, RefObject } from "react";

// ─────────────────────────────────────────────────────────────
// 🔹 FORM TYPES
// ─────────────────────────────────────────────────────────────

export interface SignupForm {
  fullName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  password: string;
  gramNam: string;
  para: string;
  landmark: string;
  permanentGramNam: string;
  permanentPara: string;
  roll: string;
  schoolName: string;
  degree: string;
  qualification: string;
  currentYear: string;
  emergencyContact: string;
}

// SelectInputProps
export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

// Add to your SelectInputProps in types/types.ts

export interface SelectInputProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  isTouched?: boolean;
  defaultValue?: string;
  className?: string;
}

export interface DropdownPortalProps {
  children: ReactNode;
  triggerRef: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TeacherInfo {
  _id: string;
  name: string;
  avatar?: { url: string | null; publicId?: string | null } | string | null;
  role?: string;
  slug?: string;
}

export interface DailyLessonItem {
  _id: string;
  subject: string;
  teacher: TeacherInfo | string;
  class: string;
  mark: number;
  referenceType: "chapter" | "page";
  chapterNumber: string;
  topics: string;
  images: { url: string; public_id: string }[];
  date: string;
  createdAt: string;
  slug?: string;
  teacherSlug?: string;
}

export interface DailyLessonCardProps {
  lesson: DailyLessonItem;
  index: number;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface DailyLessonModalProps {
  lesson: DailyLessonItem;
  onClose: () => void;
  formattedDate: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// login promt
export interface LoginPromptOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DailyLessonFormData {
  subject: string;
  teacher: string;
  class: string;
  chapterNumber: string;
  topics: string;
  date: string;
}

export interface TeacherItem {
  _id: string;
  name: string;
  slug: string;
  role: string;
}

export type ReferenceType = "chapter" | "page";

export interface WeeklyExamFormData {
  subject: string;
  teacher: string;
  class: string;
  mark: number;
  ExamNumber: string;
  numberType: "pageNumber" | "chapterNumber";
  numberValue: string;
  topics: string;
  question: string;
  slug?: string;
}

export interface TeacherItem {
  name: string;
  slug: string;
  role: string;
}
