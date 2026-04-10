// src/pages/dashboard/home/Dashboard.tsx
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ClipboardList,
  ArrowRight,
  Check,
  X,
  Users,
  TrendingUp,
  Circle,
} from "lucide-react";
import { Link } from "react-router";
import axiosPublic from "../../../hooks/axiosPublic";
import { useAuth } from "../../../context/AuthContext";
import Skeleton from "../../../components/common/Skeleton";

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const isTodayInRange = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

const getCurrentWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const sun = new Date(now);
  sun.setDate(now.getDate() - (day === 6 ? -1 : day));
  sun.setHours(0, 0, 0, 0);
  const fri = new Date(sun);
  fri.setDate(sun.getDate() + 5);
  fri.setHours(23, 59, 59, 999);
  return { start: sun, end: fri };
};

const isThisWeek = (dateStr: string) => {
  const { start, end } = getCurrentWeekRange();
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

const getBanglaDate = () =>
  new Date().toLocaleDateString("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* ══════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════ */
interface WeeklyExamDoc {
  _id: string;
  teacherSlug: string;
  createdAt: string;
  ExamNumber: string;
  class: string;
  subject?: string;
}

interface DailyLessonDoc {
  _id: string;
  teacherSlug: string;
  createdAt: string;
  class: string;
  subject?: string;
  chapterNumber?: string;
}

interface UserDoc {
  slug: string;
  name: string;
  role?: string;
}

/* ══════════════════════════════════════════════════
   TASK ROW
══════════════════════════════════════════════════ */
const TaskRow = ({
  icon: Icon,
  label,
  done,
  doneLabel,
  pendingLabel,
  to,
  isLast,
}: {
  icon: React.ElementType;
  label: string;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
  to: string;
  isLast?: boolean;
}) => (
  <>
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: done
              ? "var(--color-text)"
              : "var(--color-active-bg)",
            border: done ? "none" : "1px solid var(--color-active-border)",
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: done ? "var(--color-bg)" : "var(--color-gray)" }}
          />
        </div>
        <div>
          <p
            className="text-sm font-medium bangla"
            style={{ color: "var(--color-text)" }}
          >
            {label}
          </p>
          <p
            className="text-xs bangla mt-0.5"
            style={{ color: "var(--color-gray)" }}
          >
            {done ? doneLabel : pendingLabel}
          </p>
        </div>
      </div>

      {done ? (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--color-text)" }}
        >
          <Check className="w-3.5 h-3.5" style={{ color: "var(--color-bg)" }} />
        </div>
      ) : (
        <Link
          to={to}
          className="flex items-center gap-1.5 text-xs font-semibold bangla px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-75"
          style={{
            backgroundColor: "var(--color-text)",
            color: "var(--color-bg)",
          }}
        >
          জমা দিন
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
    {!isLast && (
      <div
        style={{
          height: "1px",
          backgroundColor: "var(--color-active-border)",
        }}
      />
    )}
  </>
);

/* ══════════════════════════════════════════════════
   MY STATUS CARD
══════════════════════════════════════════════════ */
const MyStatusCard = ({
  hasLesson,
  hasExam,
  isLoading,
}: {
  hasLesson: boolean;
  hasExam: boolean;
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return <Skeleton variant="rect" height="190px" rounded="16px" />;
  }

  const done = [hasLesson, hasExam].filter(Boolean).length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--color-active-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{
          backgroundColor: "var(--color-active-bg)",
          borderBottom: "1px solid var(--color-active-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest bangla"
          style={{ color: "var(--color-gray)" }}
        >
          আজকের কাজ
        </p>
        <span
          className="text-xs font-bold bangla tabular-nums"
          style={{
            color: done === 2 ? "var(--color-text)" : "var(--color-gray)",
          }}
        >
          {done}/2 সম্পন্ন
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-0.5"
        style={{ backgroundColor: "var(--color-active-bg)" }}
      >
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${(done / 2) * 100}%`,
            backgroundColor: "var(--color-text)",
          }}
        />
      </div>

      {/* Rows */}
      <div className="px-5">
        <TaskRow
          icon={BookOpen}
          label="আজকের পড়া"
          done={hasLesson}
          doneLabel="জমা দেওয়া হয়েছে"
          pendingLabel="এখনো জমা দেননি"
          to="/dashboard/add-daily-lesson"
        />
        <TaskRow
          icon={ClipboardList}
          label="সাপ্তাহিক পরীক্ষা"
          done={hasExam}
          doneLabel="এই সপ্তাহে জমা হয়েছে"
          pendingLabel="এখনো জমা দেননি"
          to="/dashboard/add-weekly-exam"
          isLast
        />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   ALL TEACHERS PANEL (manager only)
══════════════════════════════════════════════════ */
const AllTeachersPanel = ({ currentSlug }: { currentSlug: string }) => {
  const { data: allExams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["dash-all-weekly-exams"],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/weekly-exams");
      return data as WeeklyExamDoc[];
    },
  });

  const { data: allLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["dash-all-daily-lessons"],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/daily-lesson");
      return (data?.data ?? data) as DailyLessonDoc[];
    },
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["dash-teachers"],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/users");
      return data as UserDoc[];
    },
  });

  // Show skeleton while any query is loading
  if (examsLoading || lessonsLoading || teachersLoading) {
    return <Skeleton variant="rect" height="380px" rounded="16px" />;
  }

  const filteredTeachers = teachers.filter((t) => {
    const role = t.role?.toLowerCase();
    return role !== "owner" && role !== "student";
  });

  const examMap = new Map<string, number>();
  const lessonMap = new Map<string, number>();

  for (const exam of allExams) {
    if (!exam.teacherSlug || !isThisWeek(exam.createdAt)) continue;
    examMap.set(exam.teacherSlug, (examMap.get(exam.teacherSlug) ?? 0) + 1);
  }
  for (const lesson of allLessons) {
    if (!lesson.teacherSlug || !isTodayInRange(lesson.createdAt)) continue;
    lessonMap.set(
      lesson.teacherSlug,
      (lessonMap.get(lesson.teacherSlug) ?? 0) + 1,
    );
  }

  const submitted = filteredTeachers.filter(
    (t) => examMap.has(t.slug) || lessonMap.has(t.slug),
  ).length;

  const submissionRate = filteredTeachers.length
    ? Math.round((submitted / filteredTeachers.length) * 100)
    : 0;

  const sorted = [...filteredTeachers].sort((a, b) => {
    if (a.slug === currentSlug) return -1;
    if (b.slug === currentSlug) return 1;
    const aDone =
      (examMap.has(a.slug) ? 1 : 0) + (lessonMap.has(a.slug) ? 1 : 0);
    const bDone =
      (examMap.has(b.slug) ? 1 : 0) + (lessonMap.has(b.slug) ? 1 : 0);
    return bDone - aDone;
  });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--color-active-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{
          backgroundColor: "var(--color-active-bg)",
          borderBottom: "1px solid var(--color-active-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: "var(--color-gray)" }} />
          <span
            className="text-sm font-semibold bangla"
            style={{ color: "var(--color-text)" }}
          >
            শিক্ষকদের অবস্থা
          </span>
        </div>
        <span className="text-xs bangla" style={{ color: "var(--color-gray)" }}>
          {submitted}/{filteredTeachers.length} জমা · {submissionRate}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-0.5"
        style={{ backgroundColor: "var(--color-active-bg)" }}
      >
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${submissionRate}%`,
            backgroundColor: "var(--color-text)",
          }}
        />
      </div>

      {/* Column labels */}
      <div
        className="grid grid-cols-[1fr_auto] gap-4 px-5 py-2"
        style={{ borderBottom: "1px solid var(--color-active-border)" }}
      >
        <span
          className="text-[11px] uppercase tracking-wider bangla"
          style={{ color: "var(--color-gray)" }}
        >
          শিক্ষক
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] uppercase tracking-wider w-10 text-center bangla"
            style={{ color: "var(--color-gray)" }}
          >
            পড়া
          </span>
          <span
            className="text-[11px] uppercase tracking-wider w-10 text-center"
            style={{ color: "var(--color-gray)" }}
          >
            Exam
          </span>
        </div>
      </div>

      {/* Rows */}
      <div
        className="divide-y"
        style={{ borderColor: "var(--color-active-border)" }}
      >
        {sorted.map((t) => {
          const hasLesson = lessonMap.has(t.slug);
          const hasExam = examMap.has(t.slug);
          const isMe = t.slug === currentSlug;
          const bothDone = hasLesson && hasExam;
          const noneDone = !hasLesson && !hasExam;

          return (
            <div
              key={t.slug}
              className="grid grid-cols-[1fr_auto] gap-4 items-center px-5 py-3"
              style={{
                backgroundColor: isMe
                  ? "var(--color-active-bg)"
                  : "transparent",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {bothDone ? (
                  <Check
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "var(--color-text)" }}
                  />
                ) : noneDone ? (
                  <X
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "var(--color-gray)", opacity: 0.3 }}
                  />
                ) : (
                  <Circle
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "var(--color-text)", opacity: 0.45 }}
                  />
                )}
                <span
                  className="text-sm bangla truncate"
                  style={{
                    color: noneDone ? "var(--color-gray)" : "var(--color-text)",
                    fontWeight: isMe ? 600 : 400,
                  }}
                >
                  {t.name}
                  {isMe && (
                    <span
                      className="ml-1 text-xs"
                      style={{ color: "var(--color-gray)" }}
                    >
                      (আপনি)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-10 flex justify-center">
                  {hasLesson ? (
                    <Check
                      className="w-4 h-4"
                      style={{ color: "var(--color-text)" }}
                    />
                  ) : (
                    <X
                      className="w-4 h-4"
                      style={{ color: "var(--color-gray)", opacity: 0.25 }}
                    />
                  )}
                </div>
                <div className="w-10 flex justify-center">
                  {hasExam ? (
                    <Check
                      className="w-4 h-4"
                      style={{ color: "var(--color-text)" }}
                    />
                  ) : (
                    <X
                      className="w-4 h-4"
                      style={{ color: "var(--color-gray)", opacity: 0.25 }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly report */}
      <div style={{ borderTop: "1px solid var(--color-active-border)" }}>
        <Link
          to="/dashboard/monthly-report"
          className="flex items-center justify-between px-5 py-3.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--color-text)" }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp
              className="w-4 h-4"
              style={{ color: "var(--color-gray)" }}
            />
            <span className="text-sm font-medium bangla">মাসিক রিপোর্ট</span>
          </div>
          <ArrowRight
            className="w-4 h-4"
            style={{ color: "var(--color-gray)" }}
          />
        </Link>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role ?? "teacher";
  const slug = user?.slug ?? "";
  const isManager = ["principal", "admin", "owner"].includes(role);

  const { data: myExams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["dash-my-exams", slug],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/weekly-exams");
      return data as WeeklyExamDoc[];
    },
  });

  const { data: myLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["dash-my-lessons", slug],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/daily-lesson");
      return (data?.data ?? data) as DailyLessonDoc[];
    },
  });

  const isLoading = examsLoading || lessonsLoading;

  const hasSubmittedLesson = myLessons.some((l) => isTodayInRange(l.createdAt));
  const hasSubmittedExam = myExams.some((e) => isThisWeek(e.createdAt));

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="w-full px-4 sm:px-8  py-10 lg:py-14  mx-auto">
        {/* ── HEADER ── */}
        <div className="mt-10 lg:mt-0 mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 bangla text-[var(--color-gray)] ">
            {getBanglaDate()}
          </p>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton
                variant="rect"
                width="220px"
                height="40px"
                rounded="8px"
              />
              <Skeleton
                variant="rect"
                width="180px"
                height="16px"
                rounded="6px"
              />
            </div>
          ) : (
            <>
              <h1
                className="text-3xl sm:text-4xl font-bold bangla"
                style={{ color: "var(--color-text)" }}
              >
                {user?.name ?? "Dashboard"}
              </h1>
              <p
                className="mt-1 text-sm bangla"
                style={{ color: "var(--color-gray)" }}
              >
                {isManager
                  ? "সকল শিক্ষকের অগ্রগতি দেখুন"
                  : "আজকের কাজ সম্পন্ন করুন"}
              </p>
            </>
          )}
        </div>

        {/* ── LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: my status */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <MyStatusCard
              hasLesson={hasSubmittedLesson}
              hasExam={hasSubmittedExam}
              isLoading={isLoading}
            />

            {/* Monthly report — teacher only */}
            {!isManager && !isLoading && (
              <Link
                to="/dashboard/monthly-report"
                className="rounded-2xl p-4 flex items-center justify-between transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: "var(--color-active-bg)",
                  border: "1px solid var(--color-active-border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "var(--color-gray)" }}
                  />
                  <span
                    className="text-sm font-medium bangla"
                    style={{ color: "var(--color-text)" }}
                  >
                    মাসিক রিপোর্ট
                  </span>
                </div>
                <ArrowRight
                  className="w-4 h-4"
                  style={{ color: "var(--color-gray)" }}
                />
              </Link>
            )}
            {!isManager && isLoading && (
              <Skeleton variant="rect" height="52px" rounded="16px" />
            )}
          </div>

          {/* Right: all teachers — manager only */}
          {isManager && (
            <div className="lg:col-span-3">
              <AllTeachersPanel currentSlug={slug} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
