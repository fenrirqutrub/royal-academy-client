import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import AnimatedFilterPills from "../../components/common/AnimatedFilterPills";
import SelectInput from "../../components/common/SelectInput";
import { BN_DAYS_FULL, BN_MONTHS, toBn } from "../../utility/Formatters";
import DatePicker from "../../components/common/Datepicker";
import type { DailyLessonHeaderProps } from "../../types/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeDate = (date: Date | undefined): Date => {
  if (date instanceof Date && !isNaN(date.getTime())) return date;
  return new Date();
};

// ─── Component ────────────────────────────────────────────────────────────────
const DailyLessonHeader = ({
  isGuest = false,
  isStaff = false,

  title = "আজকের পড়া",
  description = "প্রতিদিনের পাঠ, নির্দেশনা ও বিষয়ভিত্তিক প্রস্তুতি",

  selectedDate,
  onDateChange,
  activeDates,

  selectedTeacher,
  onTeacherChange,
  teacherOptions,
  selectedClass,
  onClassChange,
  availableClasses,
  totalLessons,
  filteredCount,
  onAddLesson,
  onGuestAction,
  teacherLabel = "শিক্ষক",
  classLabel = "শ্রেণি",
  dateLabel = "তারিখ",
}: DailyLessonHeaderProps) => {
  const resolvedDate = safeDate(selectedDate);

  const formatDisplay = (date: Date) =>
    `${BN_DAYS_FULL[date.getDay()]}, ${toBn(date.getDate())} ${BN_MONTHS[date.getMonth()]} ${toBn(date.getFullYear())}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-5 overflow-hidden bangla"
    >
      <div className="border border-t-0 border-[var(--color-active-border)] bg-[var(--color-bg)] px-4 pb-4 pt-5 sm:px-6">
        {/* ── Watermark ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1 select-none font-bold leading-none text-[var(--color-text)] md:right-64"
          style={{ fontSize: "clamp(64px, 12vw, 100px)", opacity: 0.04 }}
        >
          {toBn(filteredCount)} / {toBn(totalLessons)}
        </span>

        {/* ── Title row ── */}
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-4xl font-bold leading-tight text-[var(--color-text)] sm:text-2xl">
              {title}
            </h1>

            {description && (
              <p className="mt-1 hidden text-sm md:text-lg leading-relaxed text-[var(--color-gray)] sm:block">
                {description}
              </p>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="flex shrink-0 items-center gap-2 pt-1">
            {!isGuest && isStaff && !!onAddLesson && (
              <button
                type="button"
                onClick={onAddLesson}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--color-text)] px-3.5 text-[11px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-80 sm:text-xs"
              >
                <Plus size={13} strokeWidth={2.3} />
              </button>
            )}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="mt-4 grid gap-3 border-t border-dashed border-[var(--color-active-border)] pt-4 md:grid-cols-[220px_180px_minmax(0,1fr)]">
          {/* ── DatePicker ── */}
          <div className="relative min-w-0">
            <DatePicker
              label={dateLabel}
              value={formatDisplay(resolvedDate)}
              onChange={() => {}}
              onDateChange={onDateChange}
              selectedDate={resolvedDate}
              activeDates={activeDates}
            />

            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={onGuestAction}
              />
            )}
          </div>

          {/* ── Teacher ── */}
          <div className="relative min-w-0">
            <SelectInput
              label={teacherLabel}
              value={selectedTeacher}
              onChange={onTeacherChange}
              options={teacherOptions}
              disabled={teacherOptions.length <= 1}
              placeholder="শিক্ষক নির্বাচন করুন"
            />

            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={onGuestAction}
              />
            )}
          </div>

          {/* ── Subject + Class pills ── */}
          <div className="relative min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gray)] bangla">
              {classLabel}
            </p>

            <AnimatedFilterPills
              items={availableClasses}
              activeId={selectedClass}
              onChange={onClassChange}
              layoutId="daily-lesson-class-pill"
            />

            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={onGuestAction}
              />
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default DailyLessonHeader;
