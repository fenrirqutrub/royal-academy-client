// src/components/common/PersonModal.tsx

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Swal from "sweetalert2";

// ── formatDOB ─────────────────────────────────────────────────────────────────
export const formatDOB = (dob: string): string => {
  try {
    return new Date(dob).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dob;
  }
};

// ── InfoRow ───────────────────────────────────────────────────────────────────
export const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) =>
  value ? (
    <div className="flex items-start gap-3 group">
      <span className="text-xs md:text-sm font-bold uppercase tracking-[0.5px] shrink-0 bangla text-[var(--color-gray)] w-16 pt-0.5">
        {label}
      </span>
      <span className="text-xs md:text-sm opacity-40 text-[var(--color-gray)]">
        :
      </span>
      <span className="text-xs md:text-sm bangla text-[var(--color-text)] leading-relaxed flex-1">
        {value}
      </span>
    </div>
  ) : null;

// ── Section ───────────────────────────────────────────────────────────────────
export const Section = ({
  title,
  color,
  borderColor,
  titleColor,
  icon,
  children,
}: {
  title: string;
  color: string;
  borderColor: string;
  titleColor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    className="p-5 rounded-2xl space-y-3 transition-all duration-300 hover:shadow-md"
    style={{
      backgroundColor: color,
      border: `1px solid ${borderColor}`,
    }}
  >
    <div className="flex items-center gap-2">
      {icon && <div className="text-lg">{icon}</div>}
      <p
        className="text-xs font-bold uppercase tracking-widest bangla"
        style={{ color: titleColor ?? "var(--color-gray)" }}
      >
        {title}
      </p>
    </div>
    <div className="pl-1">{children}</div>
  </div>
);

// ── SweetAlert Confirm Close ─────────────────────────────────────────────────
const confirmClose = (onClose: () => void) => {
  Swal.fire({
    title: "আপনি কি নিশ্চিত?",
    text: "মোডাল বন্ধ করতে চান?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "হ্যাঁ, বন্ধ করুন",
    cancelButtonText: "না, রাখুন",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    customClass: {
      popup: "bangla",
      title: "bangla",
      confirmButton: "bangla",
      cancelButton: "bangla",
    },
    backdrop: "rgba(0,0,0,0.7)",
  }).then((result) => {
    if (result.isConfirmed) {
      onClose();
    }
  });
};

// ── PersonModal ───────────────────────────────────────────────────────────────
interface PersonModalProps {
  onClose: () => void;
  accentColor: string;
  header: React.ReactNode;
  children: React.ReactNode;
  showConfirmOnClose?: boolean;
}

const PersonModal = ({
  onClose,
  accentColor,
  header,
  children,
  showConfirmOnClose = false,
}: PersonModalProps) =>
  createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[9999] flex items-start justify-center px-2 bg-black/60 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => (showConfirmOnClose ? confirmClose(onClose) : onClose())}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="
            w-full overflow-hidden shadow-2xl relative flex flex-col rounded-t-xl bg-[var(--color-bg)] border border-[var(--color-active-border)] h-full  "
        >
          {/* Premium Accent Gradient Strip */}
          <div
            className="h-1.5 w-full shrink-0"
            style={{
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, transparent)`,
            }}
          />

          {/* Mobile Drag Handle */}
          <div className="flex justify-center pt-3 pb-2 sm:hidden shrink-0">
            <div className="w-11 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() =>
                showConfirmOnClose ? confirmClose(onClose) : onClose()
              }
              className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md bg-red-500 text-[var(--color-gray)] "
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>

          {/* Scrollable Content - Scrollbar Hidden */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none px-6 pb-10 pt-6">
            <div className="mb-8 flex justify-center">{header}</div>

            {/* Content */}
            <div className="space-y-4">{children}</div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );

export default PersonModal;
