// TeacherFiles.Ui.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  MapPin,
  Mail,
  Eye,
  GraduationCap,
  BadgeCheck,
  Trash2,
  Monitor,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import PersonModal, {
  InfoRow,
  Section,
  formatDOB,
} from "../common/PersonModal";
import { Avatar } from "../common/Avatar";
import {
  SessionInfoSections,
  type SessionSummary,
  formatBrowser,
  formatDateTime,
  formatLocation,
} from "../common/SessionSections";
import {
  ROLE_CONFIG,
  DEGREE_LABEL,
  YEARS,
  type UserRole,
} from "../../utility/Constants";

// ── Build year label map from YEARS SelectOption[] ───────────────────────────
const YEAR_LABEL: Record<string, string> = Object.fromEntries(
  YEARS.map((y) => [y.value, y.label as string]),
);

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Teacher {
  _id: string;
  name: string;
  fatherName?: string | null;
  motherName?: string | null;
  phone?: string | null;
  email?: string | null;
  slug?: string;
  role?: string;
  gender?: string | null;
  religion?: string | null;
  dateOfBirth?: string | null;
  emergencyContact?: string | null;
  collegeName?: string | null;
  degree?: string | null;
  currentYear?: string | null;
  educationComplete?: boolean | null;
  gramNam?: string | null;
  para?: string | null;
  thana?: string | null;
  district?: string | null;
  division?: string | null;
  landmark?: string | null;
  permanentSameAsPresent?: boolean;
  permanentGramNam?: string | null;
  permanentPara?: string | null;
  permanentThana?: string | null;
  permanentDistrict?: string | null;
  permanentDivision?: string | null;
  avatar?: { url: string | null };
  isHardcoded?: boolean;
}

// ══════════════════════════════════════════════════
// TEACHER MODAL
// ══════════════════════════════════════════════════
export const TeacherModal = ({
  teacher,
  sessionInfo,
  onClose,
  onDelete,
}: {
  teacher: Teacher;
  sessionInfo?: SessionSummary | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const role = (teacher.role as UserRole) ?? "teacher";
  const { color, label } = ROLE_CONFIG[role] ?? ROLE_CONFIG.teacher;

  const handleDelete = async () => {
    if (!onDelete) return;

    const result = await Swal.fire({
      title: "শিক্ষক মুছে ফেলবেন?",
      html: `<p style="font-size:14px;color:#94a3b8"><strong style="color:#f87171">${teacher.name}</strong> কে স্থায়ীভাবে মুছে ফেলা হবে।<br/>এটি পূর্বাবস্থায় ফেরানো যাবে না।</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "বাতিল",
      background: "var(--color-bg)",
      color: "var(--color-text)",
      customClass: {
        popup: "rounded-2xl",
        container: "!z-[9999]",
        title: "bangla",
        confirmButton: "bangla",
        cancelButton: "bangla",
      },
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(teacher._id);
      onClose();
      Swal.fire({
        title: "মুছে ফেলা হয়েছে!",
        text: `${teacher.name} সফলভাবে মুছে ফেলা হয়েছে।`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: "var(--color-bg)",
        color: "var(--color-text)",
        customClass: {
          popup: "rounded-2xl",
          container: "!z-[9999]",
          title: "bangla",
        },
      });
    } catch {
      Swal.fire({
        title: "ত্রুটি!",
        text: "মুছে ফেলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        customClass: {
          popup: "rounded-2xl",
          container: "!z-[9999]",
          title: "bangla",
          confirmButton: "bangla",
        },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const pAddr = teacher.permanentSameAsPresent
    ? {
        gram: teacher.gramNam,
        para: teacher.para,
        thana: teacher.thana,
        district: teacher.district,
        division: teacher.division,
      }
    : {
        gram: teacher.permanentGramNam,
        para: teacher.permanentPara,
        thana: teacher.permanentThana,
        district: teacher.permanentDistrict,
        division: teacher.permanentDivision,
      };

  const hasPresent = teacher.gramNam || teacher.thana || teacher.district;
  const hasPermanent = pAddr.gram || pAddr.thana || pAddr.district;
  const hasEducation =
    teacher.collegeName ||
    teacher.degree ||
    teacher.currentYear ||
    teacher.educationComplete !== null;

  return (
    <PersonModal
      onClose={onClose}
      accentColor={color}
      header={
        <div className="flex flex-col items-center justify-center gap-y-3">
          <Avatar
            name={teacher.name}
            url={teacher.avatar?.url}
            color={color}
            size={200}
            className=""
          />
          <div className="min-w-0">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-xl md:text-2xl font-bold bangla leading-snug text-[var(--color-text)]">
                {teacher.name}
              </p>
              <BadgeCheck
                className="w-4 h-4 md:w-5.5 md:h-5.5 shrink-0"
                style={{ color }}
              />
            </div>
            <div className="flex items-center gap-2 mt-1 ml-2 flex-wrap">
              <span
                className="text-xs md:text-sm font-black px-3 py-0.5 rounded-full uppercase tracking-widest bangla"
                style={{ backgroundColor: color + "20", color }}
              >
                {label}
              </span>

              {teacher.slug && (
                <span
                  className="text-xs md:text-sm font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--color-active-bg)",
                    color: "var(--color-gray)",
                  }}
                >
                  #{teacher.slug}
                </span>
              )}
              {sessionInfo && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bangla"
                  style={{
                    backgroundColor: sessionInfo.isOnline
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(148,163,184,0.12)",
                    color: sessionInfo.isOnline ? "#22c55e" : "#94a3b8",
                  }}
                >
                  {sessionInfo.isOnline ? "🟢 অনলাইন" : "⚫ অফলাইন"}
                </span>
              )}
            </div>
          </div>
        </div>
      }
    >
      {/* ── মূল তথ্য ── */}
      <Section
        title="মূল তথ্য"
        color="var(--color-active-bg)"
        borderColor="var(--color-active-border)"
      >
        <InfoRow label="ফোন" value={teacher.phone} />
        <InfoRow label="ইমেইল" value={teacher.email} />
        <InfoRow label="লিঙ্গ" value={teacher.gender} />
        <InfoRow label="ধর্ম" value={teacher.religion} />
        <InfoRow
          label="জন্ম"
          value={teacher.dateOfBirth ? formatDOB(teacher.dateOfBirth) : null}
        />
        <InfoRow label="বাবা" value={teacher.fatherName} />
        <InfoRow label="মা" value={teacher.motherName} />
        <InfoRow label="জরুরি" value={teacher.emergencyContact} />
      </Section>

      {/* ── শিক্ষাগত যোগ্যতা ── */}
      {hasEducation && (
        <Section
          title="শিক্ষাগত যোগ্যতা"
          color="rgba(139,92,246,0.06)"
          borderColor="rgba(139,92,246,0.2)"
          titleColor="#8b5cf6"
          icon={<GraduationCap className="w-3 h-3" />}
        >
          <InfoRow label="কলেজ/বিশ্ববিদ্যালয়" value={teacher.collegeName} />
          <InfoRow
            label="ডিগ্রি"
            value={
              teacher.degree
                ? (DEGREE_LABEL[teacher.degree] ?? teacher.degree)
                : null
            }
          />
          <InfoRow
            label="অধ্যয়ন"
            value={
              teacher.educationComplete === true
                ? "সম্পন্ন"
                : teacher.educationComplete === false
                  ? "চলমান"
                  : null
            }
          />
          <InfoRow
            label="বর্ষ"
            value={
              teacher.currentYear
                ? (YEAR_LABEL[teacher.currentYear] ?? teacher.currentYear)
                : null
            }
          />
        </Section>
      )}

      {/* ── বর্তমান ঠিকানা ── */}
      {hasPresent && (
        <Section
          title="বর্তমান ঠিকানা"
          color="rgba(239,68,68,0.06)"
          borderColor="rgba(239,68,68,0.2)"
          titleColor="#ef4444"
          icon={<MapPin className="w-3 h-3" />}
        >
          <InfoRow label="গ্রাম" value={teacher.gramNam} />
          <InfoRow label="পাড়া" value={teacher.para} />
          <InfoRow label="থানা" value={teacher.thana} />
          <InfoRow label="জেলা" value={teacher.district} />
          <InfoRow label="বিভাগ" value={teacher.division} />
          <InfoRow label="চিহ্ন" value={teacher.landmark} />
        </Section>
      )}

      {/* ── স্থায়ী ঠিকানা ── */}
      {hasPermanent && (
        <Section
          title="স্থায়ী ঠিকানা"
          color="rgba(245,158,11,0.06)"
          borderColor="rgba(245,158,11,0.2)"
          titleColor="#f59e0b"
          icon={<MapPin className="w-3 h-3" />}
        >
          {teacher.permanentSameAsPresent && (
            <p
              className="text-[10px] bangla mb-1 px-1 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(245,158,11,0.12)",
                color: "#f59e0b",
              }}
            >
              ★ বর্তমান ঠিকানার মতো
            </p>
          )}
          <InfoRow label="গ্রাম" value={pAddr.gram} />
          <InfoRow label="পাড়া" value={pAddr.para} />
          <InfoRow label="থানা" value={pAddr.thana} />
          <InfoRow label="জেলা" value={pAddr.district} />
          <InfoRow label="বিভাগ" value={pAddr.division} />
        </Section>
      )}

      {/* ── Session Info ── */}
      <SessionInfoSections
        userId={teacher._id}
        sessionInfo={sessionInfo}
        accent={color}
      />

      {/* ── Delete Button ── */}
      {onDelete && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: "1px solid var(--color-active-border)" }}
        >
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bangla cursor-pointer transition-all disabled:opacity-60"
            style={{
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              backgroundColor: "rgba(239,68,68,0.06)",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.15)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.6)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            }}
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-red-400/40 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isDeleting ? "মুছছে..." : "শিক্ষক মুছে ফেলুন"}
          </button>
        </div>
      )}
    </PersonModal>
  );
};

// ══════════════════════════════════════════════════
// TEACHER CARD
// ══════════════════════════════════════════════════
export const TeacherCard = ({
  teacher,
  sessionInfo,
  index,
  onDelete,
}: {
  teacher: Teacher;
  sessionInfo?: SessionSummary | null;
  index: number;
  onDelete?: (id: string) => Promise<void>;
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const role = (teacher.role as UserRole) ?? "teacher";
  const { color, label } = ROLE_CONFIG[role] ?? ROLE_CONFIG.teacher;

  const eduDisplay =
    teacher.collegeName?.trim() ||
    (teacher.degree
      ? (DEGREE_LABEL[teacher.degree] ?? teacher.degree)
      : null) ||
    (teacher.currentYear
      ? (YEAR_LABEL[teacher.currentYear] ?? teacher.currentYear)
      : null) ||
    "যোগ্যতা অজানা";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.04,
          type: "spring",
          stiffness: 260,
          damping: 22,
        }}
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--color-bg)",
          border: "1px solid var(--color-active-border)",
        }}
      >
        {/* top accent bar */}
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(90deg,${color},${color}40)`,
          }}
        />

        <div className="p-4 flex flex-col flex-1">
          {/* avatar + name */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar
              name={teacher.name}
              url={teacher.avatar?.url}
              color={color}
              size={52}
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold bangla leading-snug text-[var(--color-text)] truncate">
                  {teacher.name}
                </p>
                <BadgeCheck
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color }}
                />
              </div>
              <p
                className="text-xs font-black w-fit py-1 px-3 rounded-full uppercase tracking-widest bangla"
                style={{ backgroundColor: color + "18", color }}
              >
                {label}
              </p>
            </div>
          </div>

          {/* info rows */}
          <div
            className="space-y-2.5 pt-3 flex-1"
            style={{ borderTop: "1px solid var(--color-active-border)" }}
          >
            {/* education */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + "15" }}
              >
                <GraduationCap className="w-3 h-3" style={{ color }} />
              </div>
              <span className="text-sm bangla text-[var(--color-gray)] truncate">
                {eduDisplay}
              </span>
            </div>

            {teacher.phone && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(16,185,129,0.1)]">
                  <Phone className="w-3 h-3" style={{ color: "#10b981" }} />
                </div>
                <span className="text-sm font-mono text-[var(--color-text)]">
                  {teacher.phone}
                </span>
              </div>
            )}

            {teacher.email && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.1)]">
                  <Mail className="w-3 h-3" style={{ color: "#3b82f6" }} />
                </div>
                <span className="text-xs text-[var(--color-gray)] truncate">
                  {teacher.email}
                </span>
              </div>
            )}

            {(teacher.thana || teacher.district) && (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[rgba(239,68,68,0.08)]">
                  <MapPin className="w-3 h-3" style={{ color: "#ef4444" }} />
                </div>
                <div className="space-y-0.5">
                  {teacher.thana && (
                    <p className="text-xs bangla text-[var(--color-gray)]">
                      {teacher.thana}
                    </p>
                  )}
                  {teacher.district && (
                    <p className="text-xs bangla text-[var(--color-gray)]">
                      {teacher.district}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* IP location */}
            {sessionInfo?.lastLocation?.city && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(16,185,129,0.1)]">
                  <MapPin className="w-3 h-3" style={{ color: "#10b981" }} />
                </div>
                <span className="text-xs bangla text-[var(--color-gray)] truncate">
                  📍 {formatLocation(sessionInfo.lastLocation)}
                </span>
              </div>
            )}

            {/* browser */}
            {sessionInfo?.lastBrowser?.name && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.1)]">
                  <Monitor className="w-3 h-3" style={{ color: "#3b82f6" }} />
                </div>
                <span className="text-xs text-[var(--color-gray)] truncate">
                  {formatBrowser(sessionInfo.lastBrowser)}
                </span>
              </div>
            )}

            {/* last active */}
            {sessionInfo?.lastActiveAt && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(245,158,11,0.12)]">
                  <Clock className="w-3 h-3" style={{ color: "#f59e0b" }} />
                </div>
                <span className="text-xs bangla text-[var(--color-gray)] truncate">
                  সর্বশেষ: {formatDateTime(sessionInfo.lastActiveAt)}
                </span>
              </div>
            )}
          </div>

          {/* action button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bangla cursor-pointer transition-all bg-transparent text-[var(--color-gray)] border border-[var(--color-active-border)]"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color + "88";
                e.currentTarget.style.color = color;
                e.currentTarget.style.backgroundColor = color + "0a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--color-active-border)";
                e.currentTarget.style.color = "var(--color-gray)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              বিস্তারিত
            </button>
          </div>
        </div>
      </motion.div>

      {modalOpen && (
        <TeacherModal
          teacher={teacher}
          sessionInfo={sessionInfo}
          onClose={() => setModalOpen(false)}
          onDelete={onDelete}
        />
      )}
    </>
  );
};
