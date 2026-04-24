import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import toast from "react-hot-toast";
import axiosPublic from "../../hooks/axiosPublic";
import Skeleton from "../../components/common/Skeleton";
import EmptyState from "../../components/common/Emptystate";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { useGuestPreview } from "../../hooks/useGuestPreview";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";
import { BN_DAYS_FULL, BN_MONTHS, toBn } from "../../utility/Formatters";
import {
  CLASS_ORDER,
  PRIVILEGED_ROLES,
  STAFF_DASHBOARD_ROLES,
  type UserRole,
} from "../../utility/Constants";
import {
  DeleteModal,
  EditModal,
  resolveTeacherSlug,
  type DailyLessonData,
} from "./DailyLessonUpdateModals";
import DailyLessonCard from "./DailyLessonCard";
import { useNavigate } from "react-router";
import DailyLessonHeader from "./DailyLessonHeader";

const GUEST_PREVIEW_CLASS = "৬ষ্ঠ শ্রেণি";

// ─── Helpers ──────────────────────────────────────────────────────────────────
// DailyLesson.tsx — এই helper যোগ করো উপরে
const formatLessonDate = (iso: string): string => {
  const d = new Date(iso);
  return `${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]}, ${BN_DAYS_FULL[d.getDay()]}`;
};

const getTeacherDefault = (role?: UserRole, slug?: string) =>
  STAFF_DASHBOARD_ROLES.includes(role as UserRole) && slug ? slug : "all";

const toLocalDate = (value: string | Date) => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
  }

  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const isSameLocalDay = (a: string | Date, b: string | Date) => {
  const d1 = toLocalDate(a);
  const d2 = toLocalDate(b);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const buildDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const getLessonSubject = (subject: unknown) => {
  if (typeof subject === "string") return subject.trim();

  if (subject && typeof subject === "object" && "name" in subject) {
    const name = (subject as { name?: string }).name;
    return typeof name === "string" ? name.trim() : "";
  }

  return "";
};

// ─── Animation Variants ───────────────────────────────────────────────────────
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const groupTitleVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ─── ClassGroupTitle ──────────────────────────────────────────────────────────
const ClassGroupTitle = ({
  className,
  index,
  count,
}: {
  className: string;
  index: number;
  count: number;
}) => (
  <motion.div
    custom={index}
    variants={groupTitleVariants}
    initial="hidden"
    animate="visible"
    className="relative mb-5 mt-8 overflow-hidden rounded bangla sm:mt-10 border-y border-[var(--color-active-border)]"
  >
    <div className="flex flex-1 flex-col items-center justify-center gap-x-10 bg-[var(--color-active-bg)] px-4 py-3.5 sm:flex-row sm:gap-x-10 sm:px-5 sm:py-4">
      <h2 className="text-lg font-extrabold leading-tight text-[var(--color-text)] sm:text-xl md:text-2xl">
        {className}
      </h2>

      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: index * 0.07 + 0.3,
          type: "spring",
          stiffness: 500,
        }}
        className="text-xs font-black text-[var(--color-gray)] sm:text-sm border-x border-[var(--color-active-border)] px-5"
      >
        {toBn(count)}টি পাঠ
      </motion.span>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DailyLesson = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isGuest } = useGuestPreview();
  const navigate = useNavigate();

  const userRole = (user?.role ?? "student") as UserRole;
  const userSlug = user?.slug ?? "";
  const isManager = PRIVILEGED_ROLES.includes(userRole);
  const isStaff = STAFF_DASHBOARD_ROLES.includes(userRole);

  const defaultTeacherFilter = useMemo(
    () => getTeacherDefault(userRole, userSlug),
    [userRole, userSlug],
  );

  // ─── State ────────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const prevDefaultRef = useRef("all");

  const [editTarget, setEditTarget] = useState<DailyLessonData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyLessonData | null>(
    null,
  );
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ─── Sync teacher default when role loads ─────────────────────────────────
  useEffect(() => {
    const prevDefault = prevDefaultRef.current;
    setSelectedTeacher((prev) =>
      prev === prevDefault ? defaultTeacherFilter : prev,
    );
    prevDefaultRef.current = defaultTeacherFilter;
  }, [defaultTeacherFilter]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<DailyLessonData[]>({
    queryKey: ["daily-lessons"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/daily-lesson");
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  // ─── Calendar active dates (current teacher/class/subject অনুযায়ী) ───────
  const calendarBaseData = useMemo(() => {
    let result = data ?? [];

    if (selectedClass !== "all") {
      result = result.filter((l) => l.class === selectedClass);
    }

    if (selectedTeacher !== "all") {
      result = result.filter(
        (l) => resolveTeacherSlug(l.teacher, l.teacherSlug) === selectedTeacher,
      );
    }

    if (selectedSubject !== "all") {
      result = result.filter(
        (l) =>
          getLessonSubject(
            (l as DailyLessonData & { subject?: unknown }).subject,
          ) === selectedSubject,
      );
    }

    return result;
  }, [data, selectedClass, selectedTeacher, selectedSubject]);

  const activeDates = useMemo(() => {
    const set = new Set<string>();

    calendarBaseData.forEach((lesson) => {
      const d = toLocalDate(lesson.date);
      set.add(buildDateKey(d));
    });

    return set;
  }, [calendarBaseData]);

  // ─── Derived Data ─────────────────────────────────────────────────────────
  const dateFilteredData = useMemo(() => {
    return (data ?? []).filter((lesson) =>
      isSameLocalDay(lesson.date, selectedDate),
    );
  }, [data, selectedDate]);

  const teacherBaseData = useMemo(() => {
    let result = dateFilteredData;

    if (selectedClass !== "all") {
      result = result.filter((l) => l.class === selectedClass);
    }

    if (selectedSubject !== "all") {
      result = result.filter(
        (l) =>
          getLessonSubject(
            (l as DailyLessonData & { subject?: unknown }).subject,
          ) === selectedSubject,
      );
    }

    return result;
  }, [dateFilteredData, selectedClass, selectedSubject]);

  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();

    teacherBaseData.forEach((l) => {
      const name =
        typeof l.teacher === "object" && l.teacher?.name
          ? l.teacher.name
          : typeof l.teacher === "string"
            ? l.teacher
            : "";

      const slug = resolveTeacherSlug(l.teacher, l.teacherSlug);
      if (name && slug) map.set(slug, name);
    });

    // student ছাড়া বাকি সব role-এর user নিজেকে list-এ দেখতে পাবে
    if (userRole !== "student" && userSlug && !map.has(userSlug)) {
      map.set(userSlug, user?.name || "আমার পাঠ");
    }

    return [
      { value: "all", label: "সকল শিক্ষক" },
      ...Array.from(map.entries()).map(([slug, name]) => ({
        value: slug,
        label: name,
      })),
    ];
  }, [teacherBaseData, userRole, userSlug, user?.name]);

  const subjectBaseData = useMemo(() => {
    let result = dateFilteredData;

    if (selectedClass !== "all") {
      result = result.filter((l) => l.class === selectedClass);
    }

    if (selectedTeacher !== "all") {
      result = result.filter(
        (l) => resolveTeacherSlug(l.teacher, l.teacherSlug) === selectedTeacher,
      );
    }

    return result;
  }, [dateFilteredData, selectedClass, selectedTeacher]);

  const subjectOptions = useMemo(() => {
    const subjects = new Map<string, string>();

    subjectBaseData.forEach((lesson) => {
      const subject = getLessonSubject(
        (lesson as DailyLessonData & { subject?: unknown }).subject,
      );

      if (subject) subjects.set(subject, subject);
    });

    if (subjects.size === 0) return [];

    return [
      { value: "all", label: "সকল বিষয়" },
      ...Array.from(subjects.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [subjectBaseData]);

  useEffect(() => {
    if (selectedSubject === "all") return;

    const exists = subjectOptions.some(
      (item) => item.value === selectedSubject,
    );
    if (!exists) {
      setSelectedSubject("all");
    }
  }, [subjectOptions, selectedSubject]);

  useEffect(() => {
    if (selectedTeacher === "all") return;

    const exists = teacherOptions.some(
      (item) => item.value === selectedTeacher,
    );
    if (!exists) {
      setSelectedTeacher(defaultTeacherFilter);
    }
  }, [teacherOptions, selectedTeacher, defaultTeacherFilter]);

  const filteredData = useMemo(() => {
    let result = dateFilteredData;

    if (selectedClass !== "all") {
      result = result.filter((l) => l.class === selectedClass);
    }

    if (selectedTeacher !== "all") {
      result = result.filter(
        (l) => resolveTeacherSlug(l.teacher, l.teacherSlug) === selectedTeacher,
      );
    }

    if (selectedSubject !== "all") {
      result = result.filter(
        (l) =>
          getLessonSubject(
            (l as DailyLessonData & { subject?: unknown }).subject,
          ) === selectedSubject,
      );
    }

    return result;
  }, [dateFilteredData, selectedClass, selectedTeacher, selectedSubject]);

  const groupedByClass = useMemo(() => {
    const map = new Map<string, DailyLessonData[]>();

    filteredData.forEach((l) => {
      if (!map.has(l.class)) map.set(l.class, []);
      map.get(l.class)!.push(l);
    });

    map.forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );

    return Array.from(map.entries())
      .sort(([a], [b]) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99))
      .map(([className, lessons]) => ({ className, lessons }));
  }, [filteredData]);

  const availableClasses = useMemo(() => {
    const classKeys = Object.keys(CLASS_ORDER).filter(
      (key) => typeof key === "string" && key.trim() !== "",
    );

    return [
      { id: "all", label: "সকল শ্রেণি" },
      ...classKeys.map((cls) => ({
        id: String(cls),
        label: String(cls),
      })),
    ];
  }, []);

  const isToday = useMemo(
    () => isSameLocalDay(selectedDate, new Date()),
    [selectedDate],
  );

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (!isToday) c++;
    if (selectedClass !== "all") c++;
    if (selectedTeacher !== defaultTeacherFilter) c++;
    if (selectedSubject !== "all") c++;
    return c;
  }, [
    isToday,
    selectedClass,
    selectedTeacher,
    selectedSubject,
    defaultTeacherFilter,
  ]);

  // ─── Permissions ──────────────────────────────────────────────────────────
  const getLessonPermissions = (lesson: DailyLessonData) => {
    if (isGuest) return { canEdit: false, canDelete: false };
    if (isManager) return { canEdit: true, canDelete: true };

    const slug = resolveTeacherSlug(lesson.teacher, lesson.teacherSlug);
    const isOwn = userRole === "teacher" && slug === userSlug;

    return { canEdit: isOwn, canDelete: isOwn };
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedDate(new Date());
    setSelectedClass("all");
    setSelectedTeacher(defaultTeacherFilter);
    setSelectedSubject("all");
  };

  const handleAddLesson = () => {
    navigate("/dashboard/add-daily-lesson");
  };

  const handleGuestAction = () => {
    setShowLoginPrompt(true);
  };

  const handleDateChange = (date: Date | null) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;

    // DatePicker clear করলে epoch 0 পাঠায়
    if (date.getTime() === 0) {
      setSelectedDate(new Date());
      return;
    }

    setSelectedDate(toLocalDate(date));
  };

  const getClassLabel = (classId: string) => {
    if (classId.includes("৬ষ্ঠ")) return "ষষ্ঠ";
    if (classId.includes("৭ম")) return "সপ্তম";
    if (classId.includes("৮ম")) return "অষ্টম";
    if (classId.includes("৯ম")) return "নবম";
    if (classId.includes("১০ম")) return "দশম";
    if (classId.includes("এসএসসি") || classId.includes("SSC")) return "এসএসসি";
    return classId;
  };

  // ─── Delete Mutation ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosPublic.delete(`/api/daily-lesson/${id}`),
    onSuccess: () => {
      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["daily-lessons"] });
      setDeleteTarget(null);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message || err?.message || "মুছতে ব্যর্থ হয়েছে",
      ),
  });

  // ─── Guest Content ────────────────────────────────────────────────────────
  const buildGuestContent = () => {
    const class6 = groupedByClass.find(
      ({ className }) => className === GUEST_PREVIEW_CLASS,
    );

    if (!class6) {
      return (
        <p className="py-8 text-center text-sm text-[var(--color-gray)] bangla">
          আজকের ৬ষ্ঠ শ্রেণির কোনো পাঠ পাওয়া যায়নি।
        </p>
      );
    }

    return (
      <div>
        <ClassGroupTitle
          className={class6.className}
          index={0}
          count={class6.lessons.length}
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3"
        >
          {class6.lessons.slice(0, 2).map((lesson, i) => (
            <motion.div key={lesson._id} variants={fadeUp}>
              <DailyLessonCard
                lesson={{ ...lesson, date: formatLessonDate(lesson.date) }}
                index={i}
                canEdit={false}
                canDelete={false}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return <Skeleton variant="daily-lesson" />;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative mx-auto max-w-7xl">
      {/* ── Header + Filters ── */}
      <DailyLessonHeader
        isGuest={isGuest}
        isStaff={isStaff}
        title="আজকের পড়া"
        description="প্রতিদিনের পাঠ, নির্দেশনা ও বিষয়ভিত্তিক প্রস্তুতি"
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        activeDates={activeDates}
        selectedTeacher={selectedTeacher}
        onTeacherChange={setSelectedTeacher}
        teacherOptions={teacherOptions}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        subjectOptions={subjectOptions}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        availableClasses={availableClasses}
        totalLessons={dateFilteredData.length}
        filteredCount={filteredData.length}
        activeFilterCount={activeFilterCount}
        onAddLesson={handleAddLesson}
        onReset={handleReset}
        onGuestAction={handleGuestAction}
      />

      {/* ── Main Content ── */}
      {isError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bangla sm:py-20"
        >
          <div className="mb-3 text-4xl">⚠️</div>
          <p className="text-sm text-[var(--color-gray)] sm:text-base">
            ডেটা লোড করতে সমস্যা হয়েছে।
          </p>
          <Button
            onClick={() => qc.refetchQueries({ queryKey: ["daily-lessons"] })}
            className="mt-4 bangla"
          >
            পুনরায় চেষ্টা করুন
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDate.toDateString()}-${selectedClass}-${selectedTeacher}-${selectedSubject}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="px-2 sm:px-3 md:px-0"
          >
            {groupedByClass.length > 0 ? (
              isGuest ? (
                buildGuestContent()
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {groupedByClass.map(({ className, lessons }, groupIndex) => (
                    <motion.div key={className} variants={fadeUp}>
                      <ClassGroupTitle
                        className={className}
                        index={groupIndex}
                        count={lessons.length}
                      />
                      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                        {lessons.map((lesson, i) => {
                          const { canEdit, canDelete } =
                            getLessonPermissions(lesson);

                          return (
                            <motion.div
                              key={lesson._id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: i * 0.04 + groupIndex * 0.08,
                                  duration: 0.35,
                                  ease: [0.22, 1, 0.36, 1],
                                },
                              }}
                            >
                              <DailyLessonCard
                                lesson={{
                                  ...lesson,
                                  date: formatLessonDate(lesson.date),
                                }}
                                index={i}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                onEdit={
                                  canEdit
                                    ? () => setEditTarget(lesson)
                                    : undefined
                                }
                                onDelete={
                                  canDelete
                                    ? () => setDeleteTarget(lesson)
                                    : undefined
                                }
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )
            ) : isGuest ? (
              <EmptyState
                message="এই তারিখে কোনো পাঠ নেই"
                action={
                  <Button onClick={handleReset} className="bangla">
                    আজকের পাঠ দেখুন
                  </Button>
                }
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="py-14 text-center sm:py-20"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                  className="mb-5 text-5xl sm:text-6xl"
                >
                  📭
                </motion.div>

                <p className="mb-5 text-sm text-[var(--color-gray)] bangla sm:text-base">
                  {selectedSubject !== "all"
                    ? `${selectedSubject} বিষয়ের কোনো পাঠ পাওয়া যায়নি`
                    : selectedTeacher !== "all"
                      ? "এই শিক্ষকের কোনো পাঠ পাওয়া যায়নি"
                      : selectedClass !== "all"
                        ? `${getClassLabel(selectedClass)} শ্রেণির কোনো পাঠ পাওয়া যায়নি`
                        : "এই তারিখে কোনো পাঠ নেই"}
                </p>

                <div className="flex flex-wrap justify-center gap-2.5">
                  {(selectedClass !== "all" ||
                    selectedTeacher !== defaultTeacherFilter ||
                    selectedSubject !== "all" ||
                    !isToday) && (
                    <Button
                      onClick={handleReset}
                      variant="secondary"
                      className="bangla"
                    >
                      সকল ফিল্টার সরান
                    </Button>
                  )}

                  {!isToday && (
                    <Button onClick={handleReset} className="bangla">
                      আজকের পাঠ দেখুন
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {editTarget && !isGuest && (
          <EditModal
            key="edit"
            record={editTarget}
            onClose={() => setEditTarget(null)}
            onSuccess={() =>
              qc.invalidateQueries({ queryKey: ["daily-lessons"] })
            }
          />
        )}

        {deleteTarget && !isGuest && (
          <DeleteModal
            key="delete"
            record={deleteTarget}
            onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* ── Guest Login Prompt ── */}
      <LoginPromptOverlay
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  );
};

export default DailyLesson;
