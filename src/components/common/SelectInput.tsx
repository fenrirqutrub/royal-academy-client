// src/components/common/SelectInput.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import type { ReactNode, RefObject } from "react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectInputProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  isTouched?: boolean;
  className?: string;
}

// ─── Dropdown Portal Component ────────────────────────────
interface DropdownPortalProps {
  children: React.ReactNode;
  triggerRef: RefObject<HTMLButtonElement | null>; // ✅ FIX: Added | null
  isOpen: boolean;
}

const DropdownPortal = ({
  children,
  triggerRef,
  isOpen,
}: DropdownPortalProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = useCallback(() => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [triggerRef, isOpen]);

  useEffect(() => {
    updatePosition();

    if (isOpen) {
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 999999,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

// ─── Main SelectInput Component ───────────────────────────
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
  className = "",
}: SelectInputProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is outside both trigger and dropdown
      const isOutsideTrigger =
        containerRef.current && !containerRef.current.contains(target);
      const dropdownEl = document.getElementById("select-dropdown-portal");
      const isOutsideDropdown = !dropdownEl?.contains(target);

      if (isOutsideTrigger && isOutsideDropdown) {
        setOpen(false);
        onBlur?.();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handler);
    }

    return () => document.removeEventListener("mousedown", handler);
  }, [open, onBlur]);

  // Close on escape
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
    if (isError) {
      return "border-rose-400 shadow-[0_0_0_3px_rgba(244,63,94,0.1)]";
    }
    if (isValidTouched) {
      return "border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]";
    }
    if (open) {
      return "border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]";
    }
    return "border-[var(--color-active-border)] hover:border-violet-300";
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    onBlur?.();
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase mb-2 bangla text-[var(--color-gray)]">
          {label}
          {required && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="text-rose-500"
            >
              *
            </motion.span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <motion.button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: disabled ? 1 : 0.995 }}
        className={`
          w-full px-4 py-3.5 rounded-xl border-2 text-sm 
          transition-all duration-300 
          flex items-center justify-between gap-2 
          disabled:opacity-50 disabled:cursor-not-allowed 
          bg-[var(--color-bg)] text-[var(--color-text)] 
          focus:outline-none bangla cursor-pointer
          ${getBorderClass()}
        `}
      >
        <span className="flex items-center gap-2.5 truncate">
          {selected?.icon && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-base shrink-0 text-violet-500"
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
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>

      {/* Dropdown via Portal */}
      <DropdownPortal triggerRef={triggerRef} isOpen={open}>
        <AnimatePresence>
          {open && (
            <motion.div
              id="select-dropdown-portal"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="rounded-xl overflow-hidden border-2 border-[var(--color-active-border)] 
                bg-[var(--color-bg)] shadow-2xl"
              style={{
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
              }}
            >
              {options.length === 0 ? (
                <p className="px-4 py-4 text-sm text-center bangla text-[var(--color-gray)]">
                  কোনো বিকল্প নেই
                </p>
              ) : (
                <div
                  className="overflow-y-auto max-h-[240px] py-1"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--color-active-border) transparent",
                  }}
                >
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
                          w-full px-4 py-3 text-left text-sm 
                          flex items-center gap-3 bangla 
                          transition-colors relative cursor-pointer
                          hover:bg-[var(--color-active-bg)]
                          ${
                            isSelected
                              ? "bg-violet-500/10 text-violet-600 font-semibold"
                              : "text-[var(--color-text)]"
                          }
                        `}
                      >
                        {/* Selected indicator bar */}
                        {isSelected && (
                          <motion.div
                            layoutId="selectedBar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 
                              bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-r-full"
                          />
                        )}

                        {opt.icon && (
                          <span
                            className={`text-base shrink-0 ${isSelected ? "text-violet-500" : ""}`}
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
                            <Check className="w-4 h-4 text-violet-500" />
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

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-rose-500 text-xs mt-1.5 bangla"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectInput;
