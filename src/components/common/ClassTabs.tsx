// src/components/ClassTabs.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Library,
  Bookmark,
  BookMarked,
  ScrollText,
  Award,
  Users,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClassOption {
  id: string;
  label: string;
  Icon: LucideIcon;
  color: string;
}

interface ExamData {
  class: string;
  [key: string]: unknown;
}

interface ClassTabsProps {
  activeId: string;
  onChange: (id: string) => void;
  data?: ExamData[];
}

// ─── Default Classes ──────────────────────────────────────────────────────────
const DEFAULT_CLASSES: ClassOption[] = [
  { id: "all", label: "সকল শ্রেণি", Icon: Users, color: "#6366f1" },
  { id: "৬ষ্ঠ শ্রেণি", label: "ষষ্ঠ শ্রেণি", Icon: BookOpen, color: "#10b981" },
  { id: "৭ম শ্রেণি", label: "সপ্তম শ্রেণি", Icon: Library, color: "#f59e0b" },
  { id: "৮ম শ্রেণি", label: "অষ্টম শ্রেণি", Icon: Bookmark, color: "#ec4899" },
  { id: "৯ম শ্রেণি", label: "নবম শ্রেণি", Icon: BookMarked, color: "#8b5cf6" },
  { id: "১০ম শ্রেণি", label: "দশম শ্রেণি", Icon: ScrollText, color: "#06b6d4" },
  { id: "SSC", label: "এসএসসি", Icon: Award, color: "#ef4444" },
];

// ─── Helper: Get class order for sorting ──────────────────────────────────────
const getClassOrder = (className: string): number => {
  if (className.includes("৬ষ্ঠ")) return 1;
  if (className.includes("৭ম")) return 2;
  if (className.includes("৮ম")) return 3;
  if (className.includes("৯ম")) return 4;
  if (className.includes("১০ম")) return 5;
  if (className.includes("এসএসসি") || className.includes("SSC")) return 6;
  return 99;
};

// ─── Helper: Get class display info ───────────────────────────────────────────
const getClassInfo = (
  cls: string,
): { label: string; Icon: LucideIcon; color: string } => {
  if (cls.includes("৬ষ্ঠ"))
    return { label: "ষষ্ঠ শ্রেণি", Icon: BookOpen, color: "#10b981" };
  if (cls.includes("৭ম"))
    return { label: "সপ্তম শ্রেণি", Icon: Library, color: "#f59e0b" };
  if (cls.includes("৮ম"))
    return { label: "অষ্টম শ্রেণি", Icon: Bookmark, color: "#ec4899" };
  if (cls.includes("৯ম"))
    return { label: "নবম শ্রেণি", Icon: BookMarked, color: "#8b5cf6" };
  if (cls.includes("১০ম"))
    return { label: "দশম শ্রেণি", Icon: ScrollText, color: "#06b6d4" };
  if (cls.includes("এসএসসি") || cls.includes("SSC"))
    return { label: "এসএসসি", Icon: Award, color: "#ef4444" };
  return { label: cls, Icon: GraduationCap, color: "#6366f1" };
};

// ─── Helper: Generate classes from data ───────────────────────────────────────
const getClassesFromData = (data: ExamData[]): ClassOption[] => {
  if (!data || data.length === 0) return DEFAULT_CLASSES;

  // Get unique classes from data
  const uniqueClasses = [
    ...new Set(data.map((item) => item.class).filter(Boolean)),
  ];

  // Sort classes numerically
  const sortedClasses = uniqueClasses.sort(
    (a, b) => getClassOrder(a) - getClassOrder(b),
  );

  // Create class options
  const classOptions: ClassOption[] = sortedClasses.map((cls) => {
    const { label, Icon, color } = getClassInfo(cls);
    return { id: cls, label, Icon, color };
  });

  // Add "All Classes" option at the beginning
  return [
    { id: "all", label: "সকল শ্রেণি", Icon: Users, color: "#6366f1" },
    ...classOptions,
  ];
};

// ─── Component ────────────────────────────────────────────────────────────────
const ClassTabs = ({ activeId, onChange, data = [] }: ClassTabsProps) => {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Generate classes based on provided data
  const classes = getClassesFromData(data);

  const active = classes.find((c) => c.id === activeId) ?? classes[0];
  const ActiveIcon = active.Icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex justify-center">
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen((p) => !p)}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bangla text-lg sm:text-xl opacity-70 hover:opacity-100
          transition-all outline-none select-none text-[var(--color-text)]
          px-4 py-2.5 rounded-xl border border-[var(--color-active-border)]
          bg-[var(--color-active-bg)] hover:border-[var(--color-gray)]"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={active.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2"
          >
            <motion.span
              initial={{ rotate: -15, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex"
              style={{ color: active.color }}
            >
              <ActiveIcon size={20} strokeWidth={2.2} />
            </motion.span>
            <span className="font-semibold">{active.label}</span>
          </motion.span>
        </AnimatePresence>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs opacity-50 ml-1"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2
              bg-[var(--color-bg)] border border-[var(--color-active-border)]
              rounded-xl p-1.5 flex flex-col gap-0.5 min-w-[200px] z-50
              shadow-xl"
          >
            {classes.map((cls, i) => {
              const Icon = cls.Icon;
              const isActive = activeId === cls.id;
              const isHovered = hoveredId === cls.id;

              return (
                <motion.button
                  key={cls.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.04,
                    duration: 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onMouseEnter={() => setHoveredId(cls.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    onChange(cls.id);
                    setOpen(false);
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm bangla text-[var(--color-text)] text-left w-full outline-none"
                >
                  {/* Hover / active bg */}
                  {(isHovered || isActive) && (
                    <motion.span
                      layoutId="class-tab-hover-bg"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundColor: isActive
                          ? `${cls.color}15`
                          : "var(--color-active-bg)",
                        border: isActive
                          ? `1px solid ${cls.color}30`
                          : "1px solid transparent",
                      }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}

                  {/* Icon with color */}
                  <motion.span
                    animate={{
                      scale: isHovered ? 1.15 : 1,
                      rotate: isHovered ? 8 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="relative flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{
                      backgroundColor: `${cls.color}18`,
                      color: cls.color,
                    }}
                  >
                    <Icon size={15} strokeWidth={2.2} />
                  </motion.span>

                  {/* Label */}
                  <motion.span
                    animate={{ x: isHovered ? 2 : 0 }}
                    transition={{ duration: 0.15 }}
                    className={`relative flex-1 ${
                      isActive ? "font-semibold" : ""
                    }`}
                    style={{
                      color: isActive ? cls.color : "var(--color-text)",
                    }}
                  >
                    {cls.label}
                  </motion.span>

                  {/* Active checkmark */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.15 }}
                        className="relative text-xs font-bold"
                        style={{ color: cls.color }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassTabs;
