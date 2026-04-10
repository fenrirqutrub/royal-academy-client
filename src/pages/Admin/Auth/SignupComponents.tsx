// src/pages/Admin/Auth/SignupComponents.tsx
import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Camera,
  X,
  User,
  UserRound,
} from "lucide-react";
import type {
  FieldState,
  Gender,
  SignupForm,
} from "../../../utility/Constants";

export const toBanglaDigits = (val: string): string =>
  val.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const toBanglaPhone = (val: string): string =>
  toBanglaDigits(val.replace(/[^\d০-৯]/g, ""));

/**
 * Strictly Bangla-only: no English letters allowed at all.
 * Allows Bangla Unicode letters, Bangla digits, spaces, and common punctuation.
 */
export const banglaOnly =
  (label: string) =>
  (v: string): string | undefined => {
    if (!v?.trim()) return `${label} লিখুন`;
    // Must NOT contain any English/Latin letters (a-z, A-Z)
    if (/[a-zA-Z]/.test(v))
      return `${label} অবশ্যই বাংলায় লিখতে হবে — ইংরেজি অক্ষর দেওয়া যাবে না`;
    // Must contain at least some Bangla characters
    if (!/[\u0980-\u09FF]/.test(v.trim()))
      return `${label} অবশ্যই বাংলায় লিখতে হবে`;
    return undefined;
  };

/**
 * Validate a Bangladeshi name:
 * - Must be Bangla only
 * - Must look like a real Bangladeshi name (no random chars)
 */
export const bangladeshiNameValidator =
  (label: string) =>
  (v: string): string | undefined => {
    if (!v?.trim()) return `${label} লিখুন`;
    if (/[a-zA-Z]/.test(v))
      return `${label} বাংলায় লিখুন — ইংরেজি অক্ষর দেওয়া যাবে না`;
    if (!/[\u0980-\u09FF]/.test(v.trim())) return `${label} বাংলায় লিখতে হবে`;
    if (v.trim().length < 3) return `${label} কমপক্ষে ৩ অক্ষরের হতে হবে`;
    return undefined;
  };

export function getFieldState(
  name: keyof SignupForm,
  errors: Partial<Record<keyof SignupForm, { message?: string }>>,
  touchedFields: Partial<Record<keyof SignupForm, boolean>>,
  value: string | undefined,
): FieldState {
  if (!value && !touchedFields[name]) return "idle";
  if (errors[name]) return "error";
  if (value && !errors[name]) return "valid";
  return "idle";
}

export const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 64 : -64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -64 : 64, opacity: 0 }),
};
export const slideTrans = {
  duration: 0.28,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

interface BanglaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  numericOnly?: boolean;
}

export function BanglaInput({
  numericOnly = false,
  onChange,
  value,
  ...rest
}: BanglaInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let converted: string;
    if (numericOnly) {
      converted = toBanglaDigits(raw.replace(/[^0-9০-৯]/g, ""));
    } else {
      // Block English letters entirely
      converted = toBanglaDigits(raw.replace(/[a-zA-Z]/g, ""));
    }

    e.target.value = converted;
    onChange?.(e);
  };

  return (
    <input
      {...rest}
      value={value}
      onChange={handleChange}
      inputMode={numericOnly ? "numeric" : "text"}
      lang="bn"
    />
  );
}

// ─── ValidatedInput ───────────────────────────────────────────────────────────

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state: FieldState;
  iconLeft?: React.ElementType;
  label?: string;
  error?: string;
  banglaDigits?: boolean;
  numericOnly?: boolean;
  /** If true, block English letters from being typed */
  blockEnglish?: boolean;
}

export function ValidatedInput({
  state,
  iconLeft: Icon,
  label,
  error,
  className = "",
  banglaDigits = true,
  numericOnly = false,
  blockEnglish = false,
  onChange,
  value,
  type,
  ...props
}: ValidatedInputProps) {
  const borderColor =
    state === "valid" ? "#22c55e" : state === "error" ? "#ef4444" : "#94a3b8";
  const bgColor =
    state === "valid"
      ? "rgba(34,197,94,0.07)"
      : state === "error"
        ? "rgba(239,68,68,0.07)"
        : "var(--color-active-bg)";
  const iconColor =
    state === "valid"
      ? "#22c55e"
      : state === "error"
        ? "#ef4444"
        : "var(--color-gray)";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // For email type, don't block English
    const isEmail = type === "email" || type === "password";
    if (!isEmail && (banglaDigits || numericOnly || blockEnglish)) {
      const raw = e.target.value;
      let converted: string;
      if (numericOnly) {
        converted = toBanglaDigits(raw.replace(/[^0-9০-৯]/g, ""));
      } else if (blockEnglish || banglaDigits) {
        // Block English letters, convert digits to Bangla
        const noEnglish = raw.replace(/[a-zA-Z]/g, "");
        converted = banglaDigits ? toBanglaDigits(noEnglish) : noEnglish;
      } else {
        converted = raw;
      }
      e.target.value = converted;
    }
    onChange?.(e);
  };

  const inputCls = `w-full rounded-xl py-3 outline-none text-sm bangla transition-all duration-200 placeholder:text-[var(--color-gray)] ${Icon ? "pl-10" : "pl-4"} pr-9 ${className}`;

  return (
    <div className="w-full">
      {label && (
        <p className="text-xs font-semibold mb-1.5 bangla text-[var(--color-gray)]">
          {label}
        </p>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3.5 top-[0.88rem] z-10 pointer-events-none"
            style={{ color: iconColor }}
          />
        )}
        <input
          {...props}
          type={type}
          value={value}
          onChange={handleChange}
          inputMode={numericOnly ? "numeric" : "text"}
          lang="bn"
          className={inputCls}
          style={{
            borderColor,
            borderWidth: "2px",
            borderStyle: "solid",
            backgroundColor: bgColor,
            color: "var(--color-text)",
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {state === "valid" && <Check size={14} className="text-green-500" />}
          {state === "error" && (
            <AlertCircle size={14} className="text-red-400" />
          )}
        </span>
      </div>
      <AnimatePresence>
        {state === "error" && error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-xs mt-1 bangla flex items-center gap-1"
          >
            <AlertCircle size={11} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PasswordInput ────────────────────────────────────────────────────────────

interface PasswordInputProps extends Omit<ValidatedInputProps, "type"> {
  showPassword: boolean;
  onToggle: () => void;
  EyeIcon: React.ElementType;
  EyeOffIcon: React.ElementType;
}

export function PasswordInput({
  showPassword,
  onToggle,
  EyeIcon,
  EyeOffIcon,
  ...rest
}: PasswordInputProps) {
  return (
    <div className="relative">
      <ValidatedInput
        type={showPassword ? "text" : "password"}
        banglaDigits={false}
        blockEnglish={false}
        {...rest}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-8 top-[0.88rem] z-20 transition-colors hover:text-blue-500 text-[var(--color-gray)]"
      >
        {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
      </button>
    </div>
  );
}

// ─── Button components ────────────────────────────────────────────────────────

export function CardBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left px-5 py-3.5 rounded-xl border-2 text-sm font-medium bangla transition-all cursor-pointer"
      style={
        selected
          ? {
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59,130,246,0.1)",
              color: "#3b82f6",
            }
          : {
              borderColor: "var(--color-active-border)",
              color: "var(--color-text)",
            }
      }
    >
      {children}
    </motion.button>
  );
}

export function GridBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-full py-3 px-2 rounded-xl border-2 text-sm font-medium bangla transition-all cursor-pointer text-center"
      style={
        selected
          ? {
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59,130,246,0.1)",
              color: "#3b82f6",
            }
          : {
              borderColor: "var(--color-active-border)",
              color: "var(--color-text)",
            }
      }
    >
      {children}
    </motion.button>
  );
}

export function GenderBtn({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 cursor-pointer transition-all w-full"
      style={
        selected
          ? { borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)" }
          : { borderColor: "var(--color-active-border)" }
      }
    >
      <span className="text-4xl">{icon}</span>
      <span
        className="text-sm font-bold bangla"
        style={{ color: selected ? "#3b82f6" : "var(--color-text)" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function ReligionBtn({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 cursor-pointer transition-all w-full"
      style={
        selected
          ? { borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)" }
          : { borderColor: "var(--color-active-border)" }
      }
    >
      <span className="text-3xl">{icon}</span>
      <span
        className="text-xs font-bold bangla"
        style={{ color: selected ? "#3b82f6" : "var(--color-text)" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function PrimaryBtn({
  onClick,
  disabled,
  children,
  type = "button",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bangla transition-all"
      style={
        disabled
          ? {
              backgroundColor: "var(--color-active-bg)",
              color: "var(--color-gray)",
              cursor: "not-allowed",
            }
          : {
              background: "linear-gradient(135deg,#3b82f6,#6366f1)",
              color: "white",
            }
      }
    >
      {children}
    </motion.button>
  );
}

export function SubmitBtn({
  disabled,
  children,
}: {
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="submit"
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bangla transition-all"
      style={
        disabled
          ? {
              backgroundColor: "var(--color-active-bg)",
              color: "var(--color-gray)",
            }
          : {
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "white",
            }
      }
    >
      {children}
    </motion.button>
  );
}

export function SecondaryBtn({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bangla transition-all bg-[var(--color-active-bg)] text-[var(--color-gray)] hover:opacity-80"
    >
      {children}
    </motion.button>
  );
}

export function NavRow({
  onBack,
  onNext,
  disabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-between mt-6">
      <SecondaryBtn onClick={onBack}>
        <ChevronLeft size={15} /> পেছনে
      </SecondaryBtn>
      <PrimaryBtn onClick={onNext} disabled={disabled}>
        পরবর্তী <ChevronRight size={15} />
      </PrimaryBtn>
    </div>
  );
}

// ─── Layout components ────────────────────────────────────────────────────────

export function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-2">
      <div className="mb-5">
        <h3 className="text-[15px] font-bold bangla text-[var(--color-text)]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-0.5 bangla text-[var(--color-gray)]">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function TogglePermanent({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2 bangla text-[var(--color-gray)]">
        স্থায়ী ঠিকানা কি বর্তমান ঠিকানার মতো?{" "}
        <span className="text-red-400">*</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(
          [
            { v: true, l: "✅ হ্যাঁ, একই" },
            { v: false, l: "🏠 না, আলাদা" },
          ] as { v: boolean; l: string }[]
        ).map((o) => (
          <motion.button
            key={String(o.v)}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(o.v)}
            className="py-2.5 rounded-xl border-2 text-xs font-semibold bangla cursor-pointer transition-all"
            style={
              value === o.v
                ? {
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.1)",
                    color: "#3b82f6",
                  }
                : {
                    borderColor: "var(--color-active-border)",
                    color: "var(--color-gray)",
                  }
            }
          >
            {o.l}
          </motion.button>
        ))}
      </div>
      {value === null && (
        <p className="text-red-400 text-xs mt-1 bangla flex items-center gap-1">
          <AlertCircle size={11} /> স্থায়ী ঠিকানা সম্পর্কে জানান
        </p>
      )}
    </div>
  );
}

export function ValidationMsg({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-red-400 text-xs mt-2 bangla flex items-center gap-1"
        >
          <AlertCircle size={11} /> {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function SummaryBox({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="mt-4 rounded-xl p-3.5 text-xs space-y-1.5 bg-[var(--color-active-bg)] border border-[var(--color-active-border)]">
      <p className="font-bold mb-2 bangla text-[var(--color-gray)]">
        তথ্য পর্যালোচনা ✅
      </p>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between bangla">
          <span className="text-[var(--color-gray)]">{r.label}</span>
          <span className="font-semibold text-[var(--color-text)]">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AvatarPicker({
  gender,
  preview,
  onChange,
  onRemove,
}: {
  gender: Gender;
  preview: string | null;
  onChange: (f: File) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const female = gender === "নারী" || gender === "মেয়ে";

  const avatarIconColor = gender
    ? female
      ? "#f472b6"
      : "#60a5fa"
    : "var(--color-gray)";

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => ref.current?.click()}
        className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--color-bg)] border-2 border-[var(--color-active-border)]"
        style={{ borderColor: preview ? "#3b82f6" : undefined }}
      >
        {preview ? (
          <img
            src={preview}
            className="w-full h-full object-cover"
            alt="avatar"
          />
        ) : (
          <div className="flex items-center justify-center">
            {gender ? (
              <UserRound
                size={44}
                strokeWidth={1.5}
                style={{ color: avatarIconColor }}
              />
            ) : (
              <User size={26} className="text-[var(--color-gray)]" />
            )}
          </div>
        )}
        <div
          className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
        >
          <Camera size={13} className="text-white" />
        </div>
      </motion.div>
      <p className="text-xs bangla text-[var(--color-gray)]">
        ক্লিক করে ছবি আপলোড করুন
      </p>
      {preview ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-400 flex items-center gap-1 bangla hover:text-red-500"
        >
          <X size={11} /> ছবি সরান
        </button>
      ) : (
        <p className="text-xs text-red-400 bangla flex items-center gap-1">
          <AlertCircle size={11} /> প্রোফাইল ছবি আপলোড করা বাধ্যতামূলক
        </p>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
    </div>
  );
}

export function PageShell({
  stepIndex,
  totalSteps,
  children,
  footer,
}: {
  stepIndex: number;
  totalSteps: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pct = Math.round(((stepIndex + 1) / totalSteps) * 100);
  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-4 bg-[var(--color-bg)]">
      <div className="w-full md:max-w-2xl mt-2 sm:mt-0">
        <div className="rounded-2xl overflow-hidden border border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-xl">
          <div className="px-4 sm:px-8 pt-5 pb-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs bangla text-[var(--color-gray)]">
                ধাপ {toBanglaDigits(String(stepIndex + 1))} /{" "}
                {toBanglaDigits(String(totalSteps))}
              </span>
              <span className="text-xs font-semibold bangla text-blue-500">
                {toBanglaDigits(String(pct))}% সম্পন্ন
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden bg-[var(--color-active-bg)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#3b82f6,#6366f1)" }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="px-4 sm:px-8 pb-7 overflow-hidden">{children}</div>
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
