import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import AnimatedFilterPills from "../../components/common/AnimatedFilterPills";
import SelectInput from "../../components/common/SelectInput";
import { toBn } from "../../utility/Formatters";
import type { WeeklyExamHeaderFiltersProps } from "../../types/types";

const WeeklyExamHeaderFilters = ({
  isGuest,
  isStaff,
  activeExamNumber,
  selectedTeacher,
  onTeacherChange,
  teacherOptions,
  selectedClass,
  onClassChange,
  availableClasses,
  totalExamsInNumber,
  filteredCount,
  onAddExam,
  onGuestAction,
  title = "সাপ্তাহিক পরীক্ষার ধারণা",
  description = "প্রতিটি পরীক্ষার বিষয়ভিত্তিক ধারণা ও নির্দেশনা",
}: WeeklyExamHeaderFiltersProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-5 overflow-hidden bangla"
    >
      <div className="border border-t-0 border-[var(--color-active-border)] rounded bg-[var(--color-bg)] px-4 pb-4 pt-5 sm:px-6">
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1 select-none font-bold leading-none text-[var(--color-text)] bangla md:right-64"
          style={{ fontSize: "clamp(64px, 12vw, 100px)", opacity: 0.04 }}
        >
          {toBn(filteredCount)} / {toBn(totalExamsInNumber)}
        </span>

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-4xl font-bold leading-tight text-[var(--color-text)]">
              {title} - {toBn(activeExamNumber)}
            </h1>
            {description && (
              <p className="mt-1 hidden text-sm md:text-lg leading-relaxed text-[var(--color-gray)] sm:block">
                {description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-1">
            {!isGuest && isStaff && (
              <button
                type="button"
                onClick={onAddExam}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--color-text)] px-3.5 text-[11px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-80 sm:text-xs"
              >
                <Plus size={13} strokeWidth={2.3} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 pt-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="relative min-w-0">
            <SelectInput
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

          <div className="relative min-w-0">
            <AnimatedFilterPills
              items={availableClasses}
              activeId={selectedClass}
              onChange={onClassChange}
              layoutId="weekly-exam-class-pill"
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

export default WeeklyExamHeaderFilters;
