// src/components/Students/StudentsFiles.Ui.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  MapPin,
  BookOpen,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import PersonModal, {
  formatDOB,
  InfoRow,
  Section,
} from "../../components/common/PersonModal";
import { Avatar } from "../../components/common/Avatar";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Student {
  _id: string;
  name: string;
  fatherName?: string | null;
  motherName?: string | null;
  phone?: string | null;
  slug?: string;
  gender?: string | null;
  religion?: string | null;
  dateOfBirth?: string | null;
  emergencyContact?: string | null;
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
  studentClass?: string | null;
  studentSubject?: string | null;
  roll?: string | null;
  schoolName?: string | null;
  avatar?: { url: string | null };
  role?: string;
  isHardcoded?: boolean;
}

// ── gender → accent color ─────────────────────────────────────────────────────
const getAccent = (gender?: string | null) =>
  gender === "মেয়ে" || gender === "নারী" ? "#ec4899" : "#3b82f6";

// ══════════════════════════════════════════════════
// DELETE CONFIRM MODAL
// ══════════════════════════════════════════════════
const DeleteConfirmModal = ({
  student,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  student: Student;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) => {
  const accent = getAccent(student.gender);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxWidth: 380,
          backgroundColor: "var(--color-bg)",
          border: "1px solid var(--color-active-border)",
        }}
      >
        <div className="h-[3px] bg-rose-500" />

        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-4 bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>

          <h3
            className="text-lg font-bold text-center bangla mb-1"
            style={{ color: "var(--color-text)" }}
          >
            ছাত্র/ছাত্রী মুছে ফেলবেন?
          </h3>
          <p
            className="text-sm text-center bangla mb-1"
            style={{ color: "var(--color-gray)" }}
          >
            নিচের ছাত্র/ছাত্রীকে স্থায়ীভাবে মুছে ফেলা হবে:
          </p>

          {/* Student preview */}
          <div
            className="flex items-center gap-3 rounded-xl p-3 mt-3 mb-5"
            style={{
              backgroundColor: "var(--color-active-bg)",
              border: "1px solid var(--color-active-border)",
            }}
          >
            <Avatar
              name={student.name}
              url={student.avatar?.url}
              color={accent}
              size={40}
            />
            <div className="min-w-0">
              <p
                className="text-sm font-semibold bangla truncate"
                style={{ color: "var(--color-text)" }}
              >
                {student.name}
              </p>
              <p
                className="text-xs font-mono"
                style={{ color: "var(--color-gray)" }}
              >
                {student.phone ?? student.slug ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bangla transition-all"
              style={{
                backgroundColor: "var(--color-active-bg)",
                border: "1px solid var(--color-active-border)",
                color: "var(--color-gray)",
              }}
            >
              বাতিল
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bangla transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                backgroundColor: isDeleting
                  ? "rgb(239,68,68,0.6)"
                  : "rgb(239,68,68)",
                color: "#fff",
              }}
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? "মুছছে..." : "হ্যাঁ, মুছুন"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── StudentModal ──────────────────────────────────────────────────────────────
export const StudentModal = ({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) => {
  const accent = getAccent(student.gender);

  const pAddr = student.permanentSameAsPresent
    ? {
        gram: student.gramNam,
        para: student.para,
        thana: student.thana,
        district: student.district,
        division: student.division,
      }
    : {
        gram: student.permanentGramNam,
        para: student.permanentPara,
        thana: student.permanentThana,
        district: student.permanentDistrict,
        division: student.permanentDivision,
      };

  const hasPresent = student.gramNam || student.thana || student.district;
  const hasPermanent = pAddr.gram || pAddr.thana || pAddr.district;

  return (
    <PersonModal
      onClose={onClose}
      accentColor={accent}
      header={
        <div className="flex flex-col justify-center items-center bangla">
          <Avatar
            name={student.name}
            url={student.avatar?.url}
            color={accent}
            size={250}
          />
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold bangla leading-snug text-[var(--color-text)] mt-5">
              {student.name}
            </p>
            {student.fatherName && (
              <p className="text-sm bangla mt-0.5 text-[var(--color-gray)]">
                পিতা: {student.fatherName}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {student.slug && (
                <span className="text-sm md:text-md font-mono px-1.5 py-0.5 rounded bg-[var(--color-active-bg)] text-[var(--color-gray)] ">
                  #{student.slug}
                </span>
              )}
              {student.gender && (
                <span
                  className="text-sm md:text-md px-1.5 py-0.5 rounded font-bold bangla"
                  style={{ backgroundColor: accent + "18", color: accent }}
                >
                  {student.gender}
                </span>
              )}
              {student.religion && (
                <span className="text-sm md:text-md px-1.5 py-0.5 rounded font-bold bangla bg-[var(--color-active-bg)] text-[var(--color-gray)]">
                  {student.religion}
                </span>
              )}
            </div>
          </div>
        </div>
      }
    >
      <Section
        title="মূল তথ্য"
        color="var(--color-active-bg)"
        borderColor="var(--color-active-border)"
      >
        <InfoRow label="ফোন" value={student.phone} />
        <InfoRow label="শ্রেণি" value={student.studentClass} />
        <InfoRow label="বিভাগ" value={student.studentSubject} />
        <InfoRow label="রোল" value={student.roll} />
        <InfoRow label="বিদ্যা." value={student.schoolName} />
        <InfoRow
          label="জন্ম"
          value={student.dateOfBirth ? formatDOB(student.dateOfBirth) : null}
        />
        <InfoRow label="মা" value={student.motherName} />
        <InfoRow label="জরুরি" value={student.emergencyContact} />
      </Section>

      {hasPresent && (
        <Section
          title="বর্তমান ঠিকানা"
          color="rgba(239,68,68,0.06)"
          borderColor="rgba(239,68,68,0.2)"
          titleColor="#ef4444"
          icon={<MapPin className="w-3 h-3" />}
        >
          <InfoRow label="গ্রাম" value={student.gramNam} />
          <InfoRow label="পাড়া" value={student.para} />
          <InfoRow label="থানা" value={student.thana} />
          <InfoRow label="জেলা" value={student.district} />
          <InfoRow label="বিভাগ" value={student.division} />
          <InfoRow label="চিহ্ন" value={student.landmark} />
        </Section>
      )}

      {hasPermanent && (
        <Section
          title="স্থায়ী ঠিকানা"
          color="rgba(245,158,11,0.06)"
          borderColor="rgba(245,158,11,0.2)"
          titleColor="#f59e0b"
          icon={<MapPin className="w-3 h-3" />}
        >
          {student.permanentSameAsPresent && (
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
    </PersonModal>
  );
};

// ── StudentCard ───────────────────────────────────────────────────────────────
export const StudentCard = ({
  student,
  index,
  onDelete,
}: {
  student: Student;
  index: number;
  onDelete?: (id: string) => Promise<void>;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const accent = getAccent(student.gender);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(student._id);
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

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
        <div
          className="h-1.5"
          style={{ background: `linear-gradient(90deg,${accent},${accent}40)` }}
        />

        <div className="p-4 flex flex-col flex-1">
          {/* avatar + name */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar
              name={student.name}
              url={student.avatar?.url}
              color={accent}
              size={52}
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold bangla leading-snug text-[var(--color-text)]">
                {student.name}
              </p>
              {student.fatherName && (
                <p className="text-xs bangla mt-0.5 text-[var(--color-gray)]">
                  পিতা: {student.fatherName}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {student.slug && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--color-active-bg)",
                      color: "var(--color-gray)",
                    }}
                  >
                    #{student.slug}
                  </span>
                )}
                {student.gender && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold bangla"
                    style={{ backgroundColor: accent + "18", color: accent }}
                  >
                    {student.gender}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* info rows */}
          <div
            className="space-y-2.5 pt-3 flex-1"
            style={{ borderTop: "1px solid var(--color-active-border)" }}
          >
            {student.phone && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(16,185,129,0.1)]">
                  <Phone className="w-3 h-3" style={{ color: "#10b981" }} />
                </div>
                <span className="text-sm font-mono text-[var(--color-text)]">
                  {student.phone}
                </span>
              </div>
            )}
            {student.studentClass && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(139,92,246,0.1)]">
                  <BookOpen className="w-3 h-3" style={{ color: "#8b5cf6" }} />
                </div>
                <span className="text-sm bangla text-[var(--color-text)]">
                  {student.studentClass}
                </span>
              </div>
            )}
            {(student.thana || student.gramNam) && (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[rgba(239,68,68,0.08)]">
                  <MapPin className="w-3 h-3" style={{ color: "#ef4444" }} />
                </div>
                <div className="space-y-0.5">
                  {student.gramNam && (
                    <p className="text-xs bangla text-[var(--color-gray)]">
                      {student.gramNam}
                    </p>
                  )}
                  {student.thana && (
                    <p className="text-xs bangla text-[var(--color-gray)]">
                      {student.thana}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bangla cursor-pointer transition-all bg-transparent text-[var(--color-gray)] border border-[var(--color-active-border)] "
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent + "88";
                e.currentTarget.style.color = accent;
                e.currentTarget.style.backgroundColor = accent + "0a";
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

            {onDelete && (
              <motion.button
                type="button"
                onClick={() => setDeleteOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all shrink-0"
                style={{
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "rgba(239,68,68,0.6)",
                  backgroundColor: "rgba(239,68,68,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.6)";
                  e.currentTarget.style.color = "rgb(239,68,68)";
                  e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
                  e.currentTarget.style.color = "rgba(239,68,68,0.6)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(239,68,68,0.05)";
                }}
                title="মুছুন"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {modalOpen && (
        <StudentModal student={student} onClose={() => setModalOpen(false)} />
      )}

      <AnimatePresence>
        {deleteOpen && (
          <DeleteConfirmModal
            student={student}
            onConfirm={handleDelete}
            onCancel={() => setDeleteOpen(false)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  );
};
