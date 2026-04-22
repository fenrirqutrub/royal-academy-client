import { AnimatePresence, motion, type Variants } from "framer-motion";
import { BookPlus, Filter, RotateCcw } from "lucide-react";
import SelectInput from "../../components/common/SelectInput";
import AnimatedFilterPills from "../../components/common/AnimatedFilterPills";
import { toBn } from "../../utility/Formatters";
import type { WeeklyExamHeaderFiltersProps } from "../../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────────────────────────────────────
const filterBarVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const badgePulse: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Small UI
// ─────────────────────────────────────────────────────────────────────────────
const ActiveFilterBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-text-hover)] text-[10px] font-bold text-[var(--color-bg)] shadow-lg"
    >
      {toBn(count)}
    </motion.span>
  );
};

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
  activeFilterCount,
  onAddExam,
  onReset,
  onGuestAction,
  badgeText = "সাপ্তাহিক আপডেট",
  title = "সাপ্তাহিক পরীক্ষার ধারণা",
  description = "প্রতিটি পরীক্ষার বিষয়ভিত্তিক ধারণা ও নির্দেশনা",
  teacherLabel = "শিক্ষক",
  addButtonLabel = "ধারণা জমা দিন",
  classLabel = "শ্রেণি",
  resetTitle = "ফিল্টার রিসেট করুন",
}: WeeklyExamHeaderFiltersProps) => {
  const hasSelection = selectedClass !== "all" || selectedTeacher !== "all";

  return (
    <>
      {/* Header */}
      <header className="mb-8 px-3 text-center bangla sm:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-3 inline-flex rounded-full border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-text-hover)]">
            {badgeText}
          </div>

          <h1 className="text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl md:text-4xl">
            {title}
          </h1>

          <p className="mt-3 text-sm text-[var(--color-gray)] sm:text-base">
            {description}
          </p>
        </motion.div>
      </header>

      {/* Filter Bar */}
      <motion.section
        variants={filterBarVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 rounded-3xl border border-[var(--color-active-border)] bg-[var(--color-bg)] p-4 shadow-sm sm:mb-8 sm:p-5"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr_auto] lg:items-end">
          {/* Teacher Select */}
          <div className="relative min-w-0">
            <SelectInput
              label={teacherLabel}
              value={selectedTeacher}
              onChange={onTeacherChange}
              placeholder="শিক্ষক বাছুন"
              options={teacherOptions}
              disabled={teacherOptions.length <= 1}
            />

            {isGuest && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={onGuestAction}
              />
            )}
          </div>

          {/* Add exam button */}
          <AnimatePresence>
            {!isGuest && isStaff && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="flex"
              >
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAddExam}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-text)] px-5 text-sm font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-text-hover)] bangla"
                >
                  <BookPlus size={16} />
                  {addButtonLabel}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats + Reset */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <AnimatePresence mode="wait">
              {totalExamsInNumber > 0 && (
                <motion.div
                  key={`${activeExamNumber}-${selectedClass}-${selectedTeacher}`}
                  variants={badgePulse}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-3.5 py-2 text-sm text-[var(--color-gray)] bangla"
                >
                  {hasSelection ? (
                    <div>
                      দেখানো{" "}
                      <span className="font-semibold text-[var(--color-text)]">
                        {toBn(filteredCount)}
                      </span>
                      {" / "}
                      মোট{" "}
                      <span className="font-semibold text-[var(--color-text)]">
                        {toBn(totalExamsInNumber)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      মোট{" "}
                      <span className="font-semibold text-[var(--color-text)]">
                        {toBn(totalExamsInNumber)}
                      </span>
                      টি ধারণা
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative"
                >
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onReset}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-active-border)] bg-[var(--color-bg)] text-[var(--color-gray)] transition-colors hover:bg-[var(--color-active-bg)] hover:text-[var(--color-text-hover)]"
                    title={resetTitle}
                  >
                    <RotateCcw size={16} />
                  </motion.button>

                  <ActiveFilterBadge count={activeFilterCount} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Class Filter */}
        <div className="mt-4 border-t border-[var(--color-active-border)] pt-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gray)] bangla">
            <Filter size={13} />
            {classLabel}
          </div>

          <div className="relative">
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
      </motion.section>
    </>
  );
};

export default WeeklyExamHeaderFilters;
