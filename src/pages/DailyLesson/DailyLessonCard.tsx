import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  User,
  FileText,
  Folder,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DailyLessonModal from "./DailyLessonModal";
import { toBn } from "../../utility/Formatters";
import type {
  DailyLessonCardProps,
  TeacherInfo,
  ViewData,
} from "../../types/types";
import LoginPromptOverlay from "../Admin/Auth/LoginPromptOverlay";
import SeenUserAvatar from "../../components/common/SeenUserAvatar";
import ViewDetailsModal from "../../components/common/ViewDetailsModal";
import { axiosPublic } from "../../hooks/axiosPublic";

export const extractTeacher = (teacher: TeacherInfo | string | null) => {
  if (!teacher) return { name: "—", avatarUrl: null };
  if (typeof teacher === "string") return { name: teacher, avatarUrl: null };

  const name = teacher.name?.trim() || "—";
  let avatarUrl: string | null = null;

  if (typeof teacher.avatar === "string" && teacher.avatar.startsWith("http")) {
    avatarUrl = teacher.avatar;
  } else if (
    teacher.avatar &&
    typeof teacher.avatar === "object" &&
    typeof teacher.avatar.url === "string" &&
    teacher.avatar.url.startsWith("http")
  ) {
    avatarUrl = teacher.avatar.url;
  }

  return { name, avatarUrl };
};

const DailyLessonCard = ({
  lesson,
  index,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: DailyLessonCardProps) => {
  const { isAuthenticated } = useAuth();

  const [viewData, setViewData] = useState<ViewData>(() => ({
    viewCount: lesson.viewCount || 0,
    viewedBy: Array.isArray(lesson.viewedBy)
      ? lesson.viewedBy.filter(
          (v: ViewData["viewedBy"][number]) =>
            v?.userId && typeof v.userId === "object",
        )
      : [],
  }));

  const [showModal, setShowModal] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isRecordingView, setIsRecordingView] = useState(false);

  const isGuest = !isAuthenticated;
  const { name: teacherName, avatarUrl } = extractTeacher(lesson.teacher);
  const refLabel = lesson.referenceType === "page" ? "পৃষ্ঠা" : "অধ্যায়";

  const handleOpenLesson = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    setShowModal(true);

    if (isRecordingView) return;

    setIsRecordingView(true);
    try {
      const response = await axiosPublic.patch(
        `/api/daily-lesson/${lesson._id}/record-view`,
      );

      if (response.data?.success) {
        setViewData({
          viewCount: response.data.viewCount ?? viewData.viewCount,
          viewedBy: Array.isArray(response.data.viewedBy)
            ? (response.data.viewedBy as ViewData["viewedBy"]).filter(
                (v) => v?.userId && typeof v.userId === "object",
              )
            : viewData.viewedBy,
        });
      }
    } catch (error) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 401) {
        setShowLoginPrompt(true);
      }
    } finally {
      setIsRecordingView(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.06,
          duration: 0.44,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="group relative flex h-[280px] cursor-pointer flex-col overflow-hidden rounded border border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-sm transition-all duration-300 bangla"
      >
        {/* Guest hover lock */}
        {isGuest && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--color-overlay)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full border border-[var(--color-active-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] shadow-lg backdrop-blur-sm">
              <LogIn className="h-3.5 w-3.5" />
              দেখতে লগইন করুন
            </span>
          </div>
        )}

        {/* Top gradient bar */}
        <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-hover)]" />

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
          {/* Teacher + subject */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={teacherName}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget
                      .nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = "flex";
                  }}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : null}
              <div
                className="h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-hover)] text-sm font-bold text-white shadow-sm"
                style={{ display: avatarUrl ? "none" : "flex" }}
              >
                {teacherName !== "—" ? (
                  teacherName.charAt(0).toUpperCase()
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-base font-extrabold leading-tight text-[var(--color-text)] sm:text-lg">
                {lesson.subject}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-[var(--color-gray)]">
                <Folder className="h-3.5 w-3.5 shrink-0" />
                {teacherName}
              </p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--color-gray)]">
              {lesson.referenceType === "page" ? (
                <FileText className="h-3 w-3" />
              ) : (
                <BookOpen className="h-3 w-3" />
              )}
              {refLabel} {toBn(lesson.chapterNumber)}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--color-gray)]">
              <Calendar className="h-3 w-3" />
              {lesson.date}
            </span>
          </div>

          <div className="h-px rounded-full bg-[var(--color-active-border)]" />

          <div className="min-h-0 flex-1 overflow-hidden">
            <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-gray)]">
              {lesson.topics}
            </p>
          </div>

          {/* ✅ Footer — SeenUserAvatar + বিস্তারিত */}
          <div className="flex items-center justify-between gap-3 mt-auto">
            <SeenUserAvatar
              viewCount={viewData.viewCount}
              viewedBy={viewData.viewedBy}
              onViewDetails={() => setShowViewDetails(true)}
            />
            <button
              onClick={handleOpenLesson}
              className="text-xs font-semibold text-[var(--color-brand)] hover:underline"
            >
              আরও দেখুন →
            </button>
          </div>
        </div>
      </motion.div>

      {/* View Details Modal */}
      <ViewDetailsModal
        isOpen={showViewDetails}
        onClose={() => setShowViewDetails(false)}
        viewedBy={viewData.viewedBy}
        viewCount={viewData.viewCount}
      />

      <LoginPromptOverlay
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      {showModal && !isGuest && (
        <DailyLessonModal
          lesson={lesson}
          onClose={() => setShowModal(false)}
          formattedDate={lesson.date}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default DailyLessonCard;
