// src/components/TeacherStudentTab.tsx
import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, ChevronDown } from "lucide-react";

const tabs = [
  {
    to: "students",
    label: "ছাত্রছাত্রী তালিকা",
    Icon: GraduationCap,
  },
  {
    to: "teachers",
    label: "শিক্ষক তালিকা",
    Icon: BookOpen,
  },
] as const;

/* ── Main ────────────────────────────────────────────────────────────────── */
const TeacherStudentTab = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [hoveredTo, setHoveredTo] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Find active tab based on current path
  const activeTab =
    tabs.find((t) => location.pathname.includes(t.to)) ?? tabs[0];

  // Close dropdown when clicking outside
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
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 lg:pt-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
            className="flex justify-center"
          >
            {/* Dropdown container */}
            <div ref={ref} className="relative inline-flex justify-center">
              {/* Trigger Button */}
              <motion.button
                onClick={() => setOpen((p) => !p)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bangla text-xl opacity-60 hover:opacity-100
                  transition-opacity outline-none select-none text-[var(--color-text)] border border-[var(--color-active-border)] px-3 py-2 rounded-lg"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeTab.to}
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
                    >
                      <activeTab.Icon size={20} strokeWidth={2} />
                    </motion.span>
                    <span>{activeTab.label}</span>
                  </motion.span>
                </AnimatePresence>

                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="text-xs opacity-60"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2
                      bg-[var(--color-bg)] border border-[var(--color-active-border)]
                      rounded-xl p-1.5 flex flex-col gap-0.5 min-w-[180px] z-50
                      shadow-lg"
                  >
                    {tabs.map((tab, i) => {
                      const isActive = location.pathname.includes(tab.to);
                      const Icon = tab.Icon;

                      return (
                        <motion.div
                          key={tab.to}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: i * 0.05,
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <NavLink
                            to={tab.to}
                            onClick={() => setOpen(false)}
                            onMouseEnter={() => setHoveredTo(tab.to)}
                            onMouseLeave={() => setHoveredTo(null)}
                            className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                              text-sm bangla text-[var(--color-text)] text-left w-full outline-none"
                          >
                            {/* Hover / active background */}
                            {(hoveredTo === tab.to || isActive) && (
                              <motion.span
                                layoutId="tab-hover-bg"
                                className="absolute inset-0 rounded-lg bg-[var(--color-active-bg)]"
                                transition={{
                                  duration: 0.18,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            )}

                            {/* Icon */}
                            <motion.span
                              animate={{
                                scale: hoveredTo === tab.to ? 1.2 : 1,
                                rotate: hoveredTo === tab.to ? 8 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                              className="relative inline-flex text-[var(--color-gray)]"
                            >
                              <Icon
                                size={16}
                                strokeWidth={isActive ? 2.2 : 1.8}
                              />
                            </motion.span>

                            {/* Label */}
                            <motion.span
                              animate={{ x: hoveredTo === tab.to ? 2 : 0 }}
                              transition={{ duration: 0.15 }}
                              className={`relative flex-1 ${
                                isActive
                                  ? "font-semibold text-[var(--color-active-text)]"
                                  : "text-[var(--color-text)]"
                              }`}
                            >
                              {tab.label}
                            </motion.span>

                            {/* Active checkmark */}
                            <AnimatePresence>
                              {isActive && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 0.5, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  transition={{ duration: 0.15 }}
                                  className="relative text-xs text-[var(--color-active-text)]"
                                >
                                  ✓
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </NavLink>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Page content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TeacherStudentTab;
