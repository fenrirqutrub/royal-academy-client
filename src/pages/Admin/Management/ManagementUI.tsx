// src/pages/Admin/Management/ManagementUI.tsx
// ─── PURE DESIGN LAYER ───────────────────────────────────────────────────────
// No business logic. No API calls. No state management.
// Every component here is purely presentational — pass props, get UI.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  BookOpen,
  User,
  Award,
  ImagePlus,
} from "lucide-react";
import type { ManagedRecord, ExamImage } from "./ManagementShell";

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS (exported so logic layer can use if needed)
// ─────────────────────────────────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
  }),
};
export const overlayV: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};
export const modalV: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2 } },
};
export const cardV: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.32, ease: "easeOut" },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const inputCls = (isError: boolean, isValidTouched = false) =>
  `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200
   focus:outline-none focus:ring-2 focus:border-transparent
   bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-gray)]
   ${
     isError
       ? "border-rose-400 focus:ring-rose-400"
       : isValidTouched
         ? "border-emerald-400 focus:ring-emerald-400"
         : "border-[var(--color-active-border)] focus:ring-violet-500"
   }`;

export const labelCls =
  "block text-xs font-semibold tracking-wide uppercase text-[var(--color-gray)] mb-1.5";

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────
export const RequiredStar = () => (
  <span className="text-rose-500 normal-case tracking-normal font-normal ml-0.5">
    *
  </span>
);

export const ErrMsg = ({ msg }: { msg?: string }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="text-rose-500 text-xs mt-1 bangla"
      >
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

export const Badge = ({ label, color }: { label: string; color: string }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
  >
    {label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
export interface StatItem {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export const StatCard = ({
  stat,
  index,
}: {
  stat: StatItem;
  index: number;
}) => (
  <motion.div
    custom={index}
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-active-border)] p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:shadow-md transition-shadow"
  >
    <div
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}
    >
      {stat.icon}
    </div>
    <div className="min-w-0">
      <p
        className={`font-bold text-[var(--color-text)] leading-none truncate bangla ${
          typeof stat.value === "number"
            ? "text-lg sm:text-xl"
            : "text-xs sm:text-sm"
        }`}
      >
        {stat.value}
      </p>
      <p className="text-[10px] sm:text-xs text-[var(--color-gray)] mt-0.5 bangla">
        {stat.label}
      </p>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────
export const PageHeader = ({
  title,
  subtitle,
  roleBadge,
}: {
  title: string;
  subtitle: string;
  roleBadge?: { label: string; color: string } | null;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="mb-8"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="w-1 h-8 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
      <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight bangla">
        {title}
      </h1>
    </div>
    <div className="ml-4 pl-3 flex items-center gap-2 flex-wrap">
      <p className="text-sm text-[var(--color-gray)] bangla">{subtitle}</p>
      {roleBadge && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${roleBadge.color}`}
        >
          {roleBadge.label}
        </span>
      )}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH & FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────
export const FilterBar = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15, duration: 0.38 }}
    className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap"
  >
    {children}
  </motion.div>
);

export const SearchBox = ({
  value,
  onChange,
  placeholder = "খুঁজুন…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="relative flex-1 min-w-48">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-gray)]" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-active-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] placeholder-[var(--color-gray)] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all bangla"
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// RESULT COUNT
// ─────────────────────────────────────────────────────────────────────────────
export const ResultCount = ({
  visible,
  total,
  hasFilter,
}: {
  visible: number;
  total: number;
  hasFilter: boolean;
}) => (
  <p className="text-xs text-[var(--color-gray)] mb-4 bangla">
    {visible}টি ফলাফল
    {hasFilter && ` (মোট ${total}টির মধ্যে)`}
  </p>
);

// ─────────────────────────────────────────────────────────────────────────────
// RECORD CARD
// ─────────────────────────────────────────────────────────────────────────────
const imgSrc = (img: string | ExamImage) =>
  typeof img === "string" ? img : img.imageUrl;

export const RecordCard = ({
  record,
  index,
  groupLabel,
  onEdit,
  onDelete,
}: {
  record: ManagedRecord;
  index: number;
  groupLabel: string;
  onEdit: (r: ManagedRecord) => void;
  onDelete: (r: ManagedRecord) => void;
}) => (
  <motion.div
    custom={index}
    variants={cardV}
    initial="hidden"
    animate="visible"
    layout
    className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-active-border)] p-5
               hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700
               transition-all duration-300 group relative overflow-hidden"
  >
    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-gradient-to-b from-violet-500/60 to-fuchsia-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <Badge
            label={record.class}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
          />
          <Badge
            label={`${groupLabel} #${record.groupKey}`}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          />
        </div>
        <h3 className="font-bold text-[var(--color-text)] truncate bangla text-lg md:text-xl leading-snug">
          {record.subject}
        </h3>
        <p className="text-xs text-[var(--color-gray)] mt-0.5 bangla">
          {record.teacher}
        </p>
      </div>

      {/* Action buttons — always visible */}
      <div className="flex items-center gap-1.5 shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(record)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(record)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500 dark:text-rose-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>

    <p className="text-xs text-[var(--color-gray)] line-clamp-2 leading-relaxed border-t border-[var(--color-active-border)] pt-3 mb-3 bangla">
      {record.topics}
    </p>

    {record.images && record.images.length > 0 && (
      <div className="flex gap-2 flex-wrap">
        {record.images.slice(0, 4).map((img, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--color-active-border)] shrink-0 hover:scale-105 transition-transform"
          >
            <img
              src={imgSrc(img)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {record.images.length > 4 && (
          <div className="w-12 h-12 rounded-lg bg-[var(--color-active-bg)] flex items-center justify-center text-xs font-medium text-[var(--color-gray)] shrink-0 border border-[var(--color-active-border)]">
            +{record.images.length - 4}
          </div>
        )}
      </div>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const DeleteModal = ({
  record,
  groupLabel,
  onConfirm,
  onCancel,
  isPending,
}: {
  record: ManagedRecord;
  groupLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) => (
  <motion.div
    variants={overlayV}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
    onClick={onCancel}
  >
    <motion.div
      variants={modalV}
      className="bg-[var(--color-bg)] rounded-2xl shadow-xl border border-[var(--color-active-border)] p-6 w-full max-w-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-text)] bangla">
            মুছে ফেলুন
          </h3>
          <p className="text-xs text-[var(--color-gray)] bangla">
            এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-active-bg)] rounded-xl p-3 mb-5 text-sm border border-[var(--color-active-border)]">
        <p className="font-medium text-[var(--color-text)] bangla">
          {record.subject} — {record.class}
        </p>
        <p className="text-[var(--color-gray)] text-xs mt-0.5 bangla">
          {groupLabel} #{record.groupKey}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-active-bg)] hover:bg-[var(--color-active-border)] text-[var(--color-text)] transition-all disabled:opacity-50 bangla"
        >
          বাতিল
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 bangla"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          মুছে ফেলুন
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL SHELL (layout + header + footer only — form fields injected via children)
// ─────────────────────────────────────────────────────────────────────────────
export const EditModalShell = ({
  onClose,
  onSubmit,
  isPending,
  isValid,
  isDirty,
  children,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isValid: boolean;
  isDirty: boolean;
  children: React.ReactNode;
}) => (
  <motion.div
    variants={overlayV}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 overflow-y-auto"
    onClick={onClose}
  >
    <motion.div
      variants={modalV}
      className="bg-[var(--color-bg)] rounded-2xl shadow-xl border border-[var(--color-active-border)] w-full max-w-xl my-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-active-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
          <h2 className="font-bold text-[var(--color-text)] bangla">
            সম্পাদনা করুন
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-active-bg)] transition-colors"
        >
          <X className="w-4 h-4 text-[var(--color-gray)]" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="p-6 space-y-5" noValidate>
        {children}

        {/* Footer */}
        <div className="flex gap-3 pt-1 border-t border-[var(--color-active-border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="sm:w-28 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-active-bg)] hover:bg-[var(--color-active-border)] text-[var(--color-text)] transition-all disabled:opacity-50 bangla"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={!isValid || !isDirty || isPending}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 bangla
              ${
                isValid && isDirty && !isPending
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-[var(--color-active-bg)] text-[var(--color-gray)] cursor-not-allowed"
              }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> আপডেট হচ্ছে…
              </>
            ) : (
              "আপডেট করুন"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE UPLOADER (design only — callbacks injected from outside)
// ─────────────────────────────────────────────────────────────────────────────
export const ImageUploader = ({
  previews,
  onPickFiles,
  onRemove,
  fileInputRef,
  onFileChange,
}: {
  previews: string[];
  onPickFiles: () => void;
  onRemove: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <label className={labelCls}>ছবি (ঐচ্ছিক)</label>
    <div
      onClick={onPickFiles}
      className="cursor-pointer border-2 border-dashed border-[var(--color-active-border)] hover:border-violet-400 rounded-xl p-4 flex items-center gap-3 transition-colors group"
    >
      <ImagePlus className="w-5 h-5 text-[var(--color-gray)] group-hover:text-violet-500 transition-colors" />
      <p className="text-sm text-[var(--color-gray)] group-hover:text-violet-500 transition-colors bangla">
        ক্লিক করুন বা ছবি টেনে আনুন
      </p>
    </div>
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={onFileChange}
    />
    <AnimatePresence>
      {previews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3"
        >
          {previews.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-active-border)]"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
    {previews.length > 0 && (
      <p className="text-xs text-[var(--color-gray)] mt-2 bangla">
        {previews.length}টি ছবি
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// RECORD GRID WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
export const RecordGrid = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    key="grid"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
      {children}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT STAT ICONS (convenience re-exports so logic layer doesn't need lucide)
// ─────────────────────────────────────────────────────────────────────────────
export { BookOpen, User, Award };
