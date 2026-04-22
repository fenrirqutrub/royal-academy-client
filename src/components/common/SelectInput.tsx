import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import type { DropdownPortalProps, SelectInputProps } from "../../types/types";

/* ──────────────────────────────────────────────────────────────────────────
   Dropdown Portal
   trigger button-এর position ধরে dropdown body তে render হবে
   ────────────────────────────────────────────────────────────────────────── */
const DropdownPortal = ({
  children,
  triggerRef,
  isOpen,
}: DropdownPortalProps) => {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const syncPosition = useCallback(() => {
    if (!triggerRef.current || !isOpen) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, [triggerRef, isOpen]);

  useEffect(() => {
    syncPosition();

    if (!isOpen) return;

    window.addEventListener("scroll", syncPosition, true);
    window.addEventListener("resize", syncPosition);

    return () => {
      window.removeEventListener("scroll", syncPosition, true);
      window.removeEventListener("resize", syncPosition);
    };
  }, [isOpen, syncPosition]);

  if (!isOpen) return null;

  const style: CSSProperties = {
    top: pos.top,
    left: pos.left,
    width: pos.width,
  };

  return createPortal(
    <div className="fixed z-[99999]" style={style}>
      {children}
    </div>,
    document.body,
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   Select Input
   ────────────────────────────────────────────────────────────────────────── */
const SelectInput = ({
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Select option",
  label,
  required,
  disabled,
  error,
  isTouched,
  defaultValue,
  className = "",
}: SelectInputProps) => {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedDefault = useRef(false);

  const selected = options.find((o) => o.value === value);

  /* defaultValue একবার apply হবে */
  useEffect(() => {
    if (
      defaultValue &&
      !hasAppliedDefault.current &&
      !value &&
      options.length > 0
    ) {
      const exists = options.some((o) => o.value === defaultValue);

      if (exists) {
        onChange(defaultValue);
        hasAppliedDefault.current = true;
      }
    }
  }, [defaultValue, value, options, onChange]);

  /* বাইরে click করলে dropdown বন্ধ */
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedInsideTrigger =
        !!containerRef.current && containerRef.current.contains(target);

      const clickedInsideDropdown =
        !!dropdownRef.current && dropdownRef.current.contains(target);

      if (!clickedInsideTrigger && !clickedInsideDropdown) {
        setOpen(false);
        onBlur?.();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open, onBlur]);

  /* Escape press করলে dropdown বন্ধ */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const isError = !!error;
  const isValidTouched = isTouched && !error && !!value;

  const borderClass = isError
    ? "border-red-400"
    : isValidTouched || open
      ? "border-[var(--color-gray)]"
      : "border-[var(--color-active-border)] hover:border-[var(--color-gray)]/50";

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    onBlur?.();
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gray)] bangla">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <motion.button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        whileTap={{ scale: disabled ? 1 : 0.99 }}
        className={[
          "flex w-full items-center justify-between gap-3 rounded border bg-[var(--color-bg)] px-4 py-2 text-sm transition-all duration-200 bangla",
          "focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
          borderClass,
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-2 truncate text-left">
          {selected?.icon && (
            <span className="shrink-0 text-[var(--color-text-hover)]">
              {selected.icon}
            </span>
          )}

          <span
            className={
              selected ? "text-[var(--color-text)]" : "text-[var(--color-gray)]"
            }
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[var(--color-gray)]"
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <DropdownPortal triggerRef={triggerRef} isOpen={open}>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="overflow-hidden rounded border border-[var(--color-active-border)] bg-[var(--color-bg)] p-1.5 shadow-xl"
            >
              {options.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-[var(--color-gray)] bangla">
                  কোনো বিকল্প নেই
                </p>
              ) : (
                <div className="max-h-[240px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {options.map((opt, index) => {
                    const isSelected = opt.value === value;

                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: index * 0.015 },
                        }}
                        whileHover={{ x: 2 }}
                        onClick={() => handleSelect(opt.value)}
                        className={[
                          "flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm transition-colors duration-150 bangla",
                          isSelected
                            ? "bg-[var(--color-text)] text-[var(--color-bg)]"
                            : "text-[var(--color-text)] hover:bg-[var(--color-active-bg)]",
                        ].join(" ")}
                      >
                        {opt.icon && (
                          <span className="shrink-0">{opt.icon}</span>
                        )}

                        <span className="flex-1 truncate">{opt.label}</span>

                        {isSelected && (
                          <Check
                            size={16}
                            className="shrink-0 text-[var(--color-brand)]"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DropdownPortal>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-xs text-red-500 bangla"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectInput;
