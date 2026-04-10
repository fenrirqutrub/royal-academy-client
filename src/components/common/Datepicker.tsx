// src/components/common/DatePicker.tsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoChevronBack,
  IoChevronForward,
  IoCalendarOutline,
} from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { toBn } from "../../utility/shared";

export const BN_DAYS_SHORT = [
  "রবি",
  "সোম",
  "মঙ্গল",
  "বুধ",
  "বৃহ",
  "শুক্র",
  "শনি",
];
export const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];
export const BN_DAYS_FULL = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

const formatDisplay = (date: Date) =>
  `${BN_DAYS_FULL[date.getDay()]}, ${toBn(date.getDate())} ${BN_MONTHS[date.getMonth()]} ${toBn(date.getFullYear())}`;

const MIN_YEAR = 1950;

interface DatePickerProps {
  value?: string;
  onChange: (display: string) => void;
  onDateChange?: (date: Date) => void;
  /**
   * ✅ NEW: parent যে Date object ধরে রেখেছে সেটা pass করুন।
   * এটা দিলে programmatic date set (reset, auto-fill) এর পরেও
   * picker-এর internal selected state sync থাকবে।
   */
  selectedDate?: Date | null;
  label?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  /**
   * Set of "YYYY-M-D" keys (getFullYear-getMonth-getDate, no zero-padding).
   * Days found in this set get a green activity dot in the calendar.
   */
  activeDates?: Set<string>;
}

type Mode = "day" | "month" | "year";

const DatePicker = ({
  value,
  onChange,
  onDateChange,
  selectedDate,
  label,
  required,
  placeholder = "তারিখ বেছে নিন",
  error,
  disabled,
  minDate,
  maxDate,
  activeDates,
}: DatePickerProps) => {
  const today = new Date();
  const MAX_YEAR = today.getFullYear();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("day");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(selectedDate ?? null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  // ✅ selectedDate prop পরিবর্তন হলে internal state sync করো
  // (reset, auto-fill, programmatic set সব এখানে ধরা পড়বে)
  useEffect(() => {
    if (selectedDate === undefined) return; // prop pass না হলে ignore

    if (!selectedDate) {
      setSelected(null);
      return;
    }

    setSelected(selectedDate);
    // calendar view ও selected date-এর month/year এ নিয়ে যাও
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  // ── Outside-click + reposition ─────────────────────────────────────────────
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const reposition = () => {
      if (!open || !triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const calW = Math.max(r.width, 288);
      const calH = 360;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      let top: number;
      if (spaceBelow >= calH) top = r.bottom + 6;
      else if (spaceAbove >= calH) top = r.top - calH - 6;
      else top = Math.max(8, (window.innerHeight - calH) / 2);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - calW - 8));
      setDropPos({ top, left, width: r.width });
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  // ── Auto-scroll year list ──────────────────────────────────────────────────
  useEffect(() => {
    if (mode === "year" && yearListRef.current) {
      const el = yearListRef.current.querySelector(
        `[data-yr="${viewYear}"]`,
      ) as HTMLElement | null;
      el?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [mode, viewYear]);

  // ── Month navigation ───────────────────────────────────────────────────────
  const prevMonth = () => {
    setDirection(-1);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => Math.max(MIN_YEAR, y - 1));
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setDirection(1);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => Math.min(MAX_YEAR, y + 1));
    } else setViewMonth((m) => m + 1);
  };

  const canPrev = !(viewYear === MIN_YEAR && viewMonth === 0);
  const canNext = !(viewYear === MAX_YEAR && viewMonth >= today.getMonth());

  // ── Day grid ───────────────────────────────────────────────────────────────
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isFriSat = (day: number) =>
    new Date(viewYear, viewMonth, day).getDay() >= 5;
  const isToday_ = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;
  const isSel = (day: number) =>
    selected?.getDate() === day &&
    selected?.getMonth() === viewMonth &&
    selected?.getFullYear() === viewYear;
  const isDis = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate) {
      const mn = new Date(minDate);
      mn.setHours(0, 0, 0, 0);
      if (d < mn) return true;
    }
    if (maxDate) {
      const mx = new Date(maxDate);
      mx.setHours(23, 59, 59, 999);
      if (d > mx) return true;
    }
    return false;
  };

  const hasActivity = (day: number) =>
    activeDates?.has(`${viewYear}-${viewMonth}-${day}`) ?? false;

  // ── Pick handlers ──────────────────────────────────────────────────────────
  const pickDay = (day: number) => {
    if (isDis(day)) return;
    const date = new Date(viewYear, viewMonth, day);
    setSelected(date);
    onChange(formatDisplay(date));
    onDateChange?.(date);
    setOpen(false);
  };

  const pickMonth = (m: number) => {
    setViewMonth(m);
    setMode("day");
  };
  const pickYear = (y: number) => {
    setViewYear(y);
    setMode("month");
  };

  const pickToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelected(t);
    onChange(formatDisplay(t));
    onDateChange?.(t);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(null);
    onChange("");
    onDateChange?.(new Date(0)); // ✅ clear হলেও parent কে notify করো
  };

  const openCalendar = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const calW = Math.max(r.width, 288);
    const calH = 360;
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    let top: number;
    if (spaceBelow >= calH) top = r.bottom + 6;
    else if (spaceAbove >= calH) top = r.top - calH - 6;
    else top = Math.max(8, (window.innerHeight - calH) / 2);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - calW - 8));
    setDropPos({ top, left, width: r.width });
  };

  const allYears = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, i) => MAX_YEAR - i,
  );
  const monthKey = `${viewYear}-${viewMonth}`;
  const accent = "#6d28d9";

  return (
    <div ref={wrapRef} className="w-full relative">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 bangla text-[var(--color-gray)]">
          {label}
          {required && (
            <span className="text-rose-500 ml-1 normal-case">*</span>
          )}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        ref={triggerRef}
        onClick={() => {
          openCalendar();
          setOpen((v) => !v);
          setMode("day");
        }}
        className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed bangla transition-all"
        style={{
          backgroundColor: "var(--color-active-bg)",
          border: `1px solid ${error ? "#f43f5e" : open ? accent : "var(--color-active-border)"}`,
          color: "var(--color-text)",
          boxShadow: open ? `0 0 0 2px ${accent}30` : "none",
        }}
      >
        <span
          className="flex items-center gap-2 min-w-0"
          style={{ color: value ? "var(--color-text)" : "var(--color-gray)" }}
        >
          <IoCalendarOutline
            className="text-base shrink-0"
            style={{ color: "var(--color-gray)" }}
          />
          <span className="truncate">{value || placeholder}</span>
        </span>
        {value ? (
          <RxCross2
            onClick={clear}
            className="shrink-0 cursor-pointer transition-colors hover:text-rose-500"
            style={{ color: "var(--color-gray)" }}
          />
        ) : (
          <IoChevronBack
            className={`shrink-0 transition-transform duration-200 ${open ? "-rotate-90" : "rotate-180"}`}
            style={{ color: "var(--color-gray)" }}
          />
        )}
      </button>

      {error && <p className="text-rose-500 text-xs mt-1 bangla">{error}</p>}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed z-[9999] rounded-2xl overflow-hidden"
            style={{
              top: dropPos.top,
              left: dropPos.left,
              width: Math.max(dropPos.width, 288),
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-active-border)",
              boxShadow: "0 20px 60px -10px rgba(0,0,0,0.28)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2 gap-1">
              <button
                type="button"
                onClick={prevMonth}
                disabled={!canPrev || mode !== "day"}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-20 disabled:cursor-default"
                style={{ color: "var(--color-gray)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-active-bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <IoChevronBack className="text-sm" />
              </button>

              <div className="flex items-center gap-1 flex-1 justify-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "month" ? "day" : "month")}
                  className="px-2.5 py-1.5 rounded-lg text-sm font-bold bangla transition-all"
                  style={
                    mode === "month"
                      ? { backgroundColor: accent, color: "#fff" }
                      : { color: "var(--color-text)" }
                  }
                  onMouseEnter={(e) => {
                    if (mode !== "month")
                      e.currentTarget.style.backgroundColor =
                        "var(--color-active-bg)";
                  }}
                  onMouseLeave={(e) => {
                    if (mode !== "month")
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {BN_MONTHS[viewMonth]}
                </button>
                <button
                  type="button"
                  onClick={() => setMode(mode === "year" ? "day" : "year")}
                  className="px-2.5 py-1.5 rounded-lg text-sm font-bold bangla transition-all"
                  style={
                    mode === "year"
                      ? { backgroundColor: accent, color: "#fff" }
                      : { color: "var(--color-text)" }
                  }
                  onMouseEnter={(e) => {
                    if (mode !== "year")
                      e.currentTarget.style.backgroundColor =
                        "var(--color-active-bg)";
                  }}
                  onMouseLeave={(e) => {
                    if (mode !== "year")
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {toBn(viewYear)}
                </button>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                disabled={!canNext || mode !== "day"}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-20 disabled:cursor-default"
                style={{ color: "var(--color-gray)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-active-bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <IoChevronForward className="text-sm" />
              </button>
            </div>

            {/* Year grid */}
            {mode === "year" && (
              <div
                ref={yearListRef}
                className="h-52 overflow-y-auto px-3 pb-3 grid grid-cols-4 gap-1"
                style={{ scrollbarWidth: "thin" }}
              >
                {allYears.map((y) => (
                  <button
                    key={y}
                    type="button"
                    data-yr={y}
                    onClick={() => pickYear(y)}
                    className="py-1.5 rounded-lg text-xs font-semibold bangla transition-all"
                    style={
                      viewYear === y
                        ? { backgroundColor: accent, color: "#fff" }
                        : { color: "var(--color-text)" }
                    }
                    onMouseEnter={(e) => {
                      if (viewYear !== y)
                        e.currentTarget.style.backgroundColor =
                          "var(--color-active-bg)";
                    }}
                    onMouseLeave={(e) => {
                      if (viewYear !== y)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {toBn(y)}
                  </button>
                ))}
              </div>
            )}

            {/* Month grid */}
            {mode === "month" && (
              <div className="grid grid-cols-3 gap-1.5 px-3 pb-4">
                {BN_MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => pickMonth(i)}
                    className="py-2 rounded-lg text-xs font-semibold bangla transition-all"
                    style={
                      viewMonth === i
                        ? { backgroundColor: accent, color: "#fff" }
                        : { color: "var(--color-text)" }
                    }
                    onMouseEnter={(e) => {
                      if (viewMonth !== i)
                        e.currentTarget.style.backgroundColor =
                          "var(--color-active-bg)";
                    }}
                    onMouseLeave={(e) => {
                      if (viewMonth !== i)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* Day grid */}
            {mode === "day" && (
              <>
                <div className="grid grid-cols-7 px-3 pb-1">
                  {BN_DAYS_SHORT.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[10px] font-semibold py-1 select-none bangla"
                      style={{
                        color:
                          d === "শুক্র" || d === "শনি"
                            ? "#f87171"
                            : "var(--color-gray)",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={monthKey}
                    initial={{ opacity: 0, x: direction * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -20 }}
                    transition={{ duration: 0.16 }}
                    className="grid grid-cols-7 gap-y-0.5 px-3 pb-3"
                  >
                    {cells.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} />;
                      const dis = isDis(day);
                      const sel = isSel(day);
                      const tod = isToday_(day);
                      const fri = isFriSat(day);
                      const active = hasActivity(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={dis}
                          onClick={() => pickDay(day)}
                          className="relative h-9 w-full flex flex-col items-center justify-center rounded-lg text-xs font-medium select-none bangla transition-all duration-150 gap-0.5"
                          style={
                            dis
                              ? {
                                  opacity: 0.25,
                                  cursor: "not-allowed",
                                  color: "var(--color-text)",
                                }
                              : sel
                                ? {
                                    background: `linear-gradient(135deg, ${accent}, #7c3aed)`,
                                    color: "#fff",
                                  }
                                : tod
                                  ? {
                                      backgroundColor: `${accent}18`,
                                      color: accent,
                                      fontWeight: 700,
                                      outline: `1px solid ${accent}50`,
                                    }
                                  : fri
                                    ? { color: "#f87171" }
                                    : { color: "var(--color-text)" }
                          }
                          onMouseEnter={(e) => {
                            if (!dis && !sel)
                              e.currentTarget.style.backgroundColor =
                                "var(--color-active-bg)";
                          }}
                          onMouseLeave={(e) => {
                            if (!dis && !sel && !tod)
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            else if (tod)
                              e.currentTarget.style.backgroundColor = `${accent}18`;
                          }}
                        >
                          <span className="leading-none">{toBn(day)}</span>
                          {(active || (tod && !sel)) && (
                            <span
                              className="w-1 h-1 rounded-full shrink-0"
                              style={{
                                backgroundColor: sel
                                  ? "rgba(255,255,255,0.7)"
                                  : active
                                    ? "#10b981"
                                    : accent,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <div className="px-4 pb-3 pt-2 border-t border-[var(--color-active-border)] flex items-center justify-between gap-2">
                  {activeDates && activeDates.size > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] bangla text-[var(--color-gray)]">
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: "#10b981" }}
                      />
                      পাঠ আছে
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={pickToday}
                    className="text-xs font-semibold bangla hover:underline transition-opacity hover:opacity-80 ml-auto"
                    style={{ color: accent }}
                  >
                    আজকের তারিখ নির্বাচন করুন
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
