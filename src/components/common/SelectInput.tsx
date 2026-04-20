import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import type { DropdownPortalProps, SelectInputProps } from "../../types/types";

/* ─── Portal: renders dropdown at exact screen position ─────────────────────── */
const DropdownPortal = ({
  children,
  triggerRef,
  isOpen,
}: DropdownPortalProps) => {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const sync = useCallback(() => {
    if (triggerRef.current && isOpen) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 8,
        left: r.left + window.scrollX,
        width: r.width,
      });
    }
  }, [triggerRef, isOpen]);

  useEffect(() => {
    sync();
    if (isOpen) {
      window.addEventListener("scroll", sync, true);
      window.addEventListener("resize", sync);
    }
    return () => {
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [isOpen, sync]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="absolute z-[999999]"
      style={
        {
          "--_t": `${pos.top}px`,
          "--_l": `${pos.left}px`,
          "--_w": `${pos.width}px`,
          top: "var(--_t)",
          left: "var(--_l)",
          width: "var(--_w)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>,
    document.body,
  );
};

/* ─── SelectInput ───────────────────────────────────────────────────────────── */
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
  const hasAppliedDefault = useRef(false);

  const selected = options.find((o) => o.value === value);

  /* ── Apply defaultValue once when options become available ── */
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

  /* ── Outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const outsideTrigger =
        containerRef.current && !containerRef.current.contains(target);
      const dropdownEl = document.getElementById("select-dropdown-portal");
      const outsideDropdown = !dropdownEl?.contains(target);

      if (outsideTrigger && outsideDropdown) {
        setOpen(false);
        onBlur?.();
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onBlur]);

  /* ── Escape key ── */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const isError = !!error;
  const isValidTouched = isTouched && !error && !!value;

  const getBorderClass = () => {
    if (isError) return "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]";
    if (isValidTouched)
      return "border-[var(--color-text-hover)] shadow-[0_0_0_3px_rgba(37,99,235,0.1)]";
    if (open)
      return "border-[var(--color-text-hover)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]";
    return "border-[var(--color-active-border)] hover:border-[var(--color-text-hover)]/50";
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    onBlur?.();
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* ── Label ── */}
      {label && (
        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-gray)] bangla">
          {label}
          {required && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="text-red-500"
            >
              *
            </motion.span>
          )}
        </label>
      )}

      {/* ── Trigger Button ── */}
      <motion.button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: disabled ? 1 : 0.995 }}
        className={`
          flex w-full cursor-pointer items-center justify-between gap-2
          rounded-xl border-2 bg-[var(--color-bg)] px-4 py-3.5
          text-sm text-[var(--color-text)] transition-all duration-300
          focus:outline-none disabled:cursor-not-allowed disabled:opacity-50
          bangla
          ${getBorderClass()}
        `}
      >
        <span className="flex items-center gap-2.5 truncate">
          {selected?.icon && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="shrink-0 text-base text-[var(--color-text-hover)]"
            >
              {selected.icon}
            </motion.span>
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
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="shrink-0 text-[var(--color-gray)]"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.button>

      {/* ── Dropdown ── */}
      <DropdownPortal triggerRef={triggerRef} isOpen={open}>
        <AnimatePresence>
          {open && (
            <motion.div
              id="select-dropdown-portal"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="overflow-hidden rounded-xl border-2 border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-2xl ring-1 ring-black/5"
            >
              {options.length === 0 ? (
                <p className="px-4 py-4 text-center text-sm text-[var(--color-gray)] bangla">
                  কোনো বিকল্প নেই
                </p>
              ) : (
                <div className="max-h-[240px] overflow-y-auto py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--color-active-border)]">
                  {options.map((opt, index) => {
                    const isSelected = opt.value === value;

                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: { delay: index * 0.015 },
                        }}
                        onClick={() => handleSelect(opt.value)}
                        whileHover={{ x: 4 }}
                        className={`
                          relative flex w-full cursor-pointer items-center gap-3
                          px-4 py-3 text-left text-sm transition-colors
                          hover:bg-[var(--color-active-bg)] bangla
                          ${
                            isSelected
                              ? "bg-[var(--color-active-bg)] font-semibold text-[var(--color-text-hover)]"
                              : "text-[var(--color-text)]"
                          }
                        `}
                      >
                        {/* Selected accent bar */}
                        {isSelected && (
                          <motion.div
                            layoutId="selectedBar"
                            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-text-hover)]"
                          />
                        )}

                        {opt.icon && (
                          <span
                            className={`shrink-0 text-base ${
                              isSelected ? "text-[var(--color-text-hover)]" : ""
                            }`}
                          >
                            {opt.icon}
                          </span>
                        )}

                        <span className="flex-1 truncate">{opt.label}</span>

                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Check className="h-4 w-4 text-[var(--color-text-hover)]" />
                          </motion.span>
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

      {/* ── Error Message ── */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            transition={{ duration: 0.2 }}
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
