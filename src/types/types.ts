// types.ts

import type { ReactNode, RefObject } from "react";
import type { ColorConfig } from "../utility/Formatters";

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
  viewCount?: number;
  viewedBy?: ViewData["viewedBy"];
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

export interface ExamModalProps {
  exam: Exam;
  color: ColorConfig;
  onClose: () => void;
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

export interface ExamImage {
  imageUrl?: string;
  url?: string;
  publicId?: string;
}

export interface WeeklyExamData {
  _id: string;
  slug: string;
  subject: string;
  teacher: string;
  teacherSlug?: string;
  class: string;
  mark: number;
  ExamNumber: string;
  topics: string;
  question?: string | null;
  images: (string | ExamImage)[];
  viewCount?: number;
  viewedBy?: ViewData["viewedBy"];
  createdAt: string;
}

export interface EditFormValues {
  subject: string;
  class: string;
  ExamNumber: string;
  topics: string;
  teacher: string;
  teacherSlug: string;
  mark: string;
  question: string;
}

export interface TeacherOption {
  slug: string;
  name: string;
}

export interface CompactSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}

export interface WeeklyExamHeaderFiltersProps {
  isGuest: boolean;
  isStaff: boolean;
  activeExamNumber: string | null;

  selectedTeacher: string;
  onTeacherChange: (value: string) => void;
  teacherOptions: SelectOption[];

  selectedClass: string;
  onClassChange: (value: string) => void;
  availableClasses: string[];

  totalExamsInNumber: number;
  filteredCount: number;
  activeFilterCount: number;

  onAddExam: () => void;
  onReset: () => void;
  onGuestAction: () => void;

  badgeText?: string;
  title?: string;
  description?: string;
  teacherLabel?: string;
  addButtonLabel?: string;
  classLabel?: string;
  resetTitle?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NormalizedImage {
  url: string;
  publicId: string;
}

export type RawImage =
  | string
  | { imageUrl?: string; url?: string; publicId?: string };

/* ─── Props ──────────────────────────────────────────────────────────────── */

export interface WeeklyExamCardProps {
  exam: Exam;
  index: number;
  activeExamNumber?: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export type FilterPillItem = {
  id: string;
  label: string;
};

export interface DailyLessonHeaderProps {
  isGuest?: boolean;
  isStaff?: boolean;

  title?: string;
  description?: string;

  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  activeDates?: Set<string>;

  selectedTeacher: string;
  onTeacherChange: (value: string) => void;
  teacherOptions: SelectOption[];

  selectedSubject?: string;
  onSubjectChange?: (value: string) => void;
  subjectOptions?: SelectOption[];

  selectedClass: string;
  onClassChange: (value: string) => void;
  availableClasses: FilterPillItem[];

  totalLessons: number;
  filteredCount: number;
  activeFilterCount: number;

  onAddLesson?: () => void;
  onReset?: () => void;
  onGuestAction?: () => void;

  teacherLabel?: string;
  subjectLabel?: string;
  classLabel?: string;
  dateLabel?: string;
  addButtonLabel?: string;
  resetTitle?: string;
}

export interface ViewData {
  viewCount: number;
  viewedBy: {
    userId: {
      _id: string;
      name: string;
      role?: string;
      studentClass?: string;
      roll?: string;
      avatar?: { url: string };
    };
    viewedAt: string;
  }[];
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

  viewCount?: number;
  viewedBy?: {
    userId: {
      _id: string;
      name: string;
      role?: string;
      studentClass?: string;
      roll?: string;
      avatar?: { url: string };
    };
    viewedAt: string;
  }[];
}
