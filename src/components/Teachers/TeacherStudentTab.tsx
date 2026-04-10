// src/components/TeacherStudentTab.tsx
import { NavLink, Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen } from "lucide-react";

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

/* ── Tab Item ────────────────────────────────────────────────────────────── */
const TabItem = ({
  tab,
  isActive,
}: {
  tab: (typeof tabs)[number];
  isActive: boolean;
}) => {
  const { Icon } = tab;

  return (
    <NavLink to={tab.to} className="relative group">
      <motion.div
        className={`
          relative flex items-center gap-2.5 px-5 py-3 cursor-pointer select-none
          rounded-xl transition-colors duration-200
          ${
            isActive
              ? "bg-[var(--color-active-bg)] text-[var(--color-active-text)]"
              : "text-[var(--color-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-active-bg)]"
          }
        `}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* Animated icon */}
        <motion.div
          animate={
            isActive
              ? { scale: 1.12, rotate: -5, y: -1 }
              : { scale: 1, rotate: 0, y: 0 }
          }
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          <Icon
            size={17}
            strokeWidth={isActive ? 2.3 : 1.7}
            className={`transition-colors duration-200 ${
              isActive
                ? "text-[var(--color-active-text)]"
                : "text-[var(--color-gray)] group-hover:text-[var(--color-text)]"
            }`}
          />
        </motion.div>

        {/* Labels */}
        <div className="flex flex-col items-start gap-0.5 leading-none">
          <span
            className={`bangla text-sm font-semibold tracking-wide transition-colors duration-200 ${
              isActive
                ? "text-[var(--color-active-text)]"
                : "text-[var(--color-gray)] group-hover:text-[var(--color-text)]"
            }`}
          >
            {tab.label}
          </span>
        </div>

        {/* Sliding underline indicator */}
        {isActive && (
          <motion.span
            layoutId="active-tab-bar"
            className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-[var(--color-active-text)]"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
      </motion.div>
    </NavLink>
  );
};

/* ── Main ────────────────────────────────────────────────────────────────── */
const TeacherStudentTab = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 lg:pt-4 pb-0">
          {/* Tab row */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
            className="flex items-center gap-0.5"
          >
            {/* Pill wrapper */}
            <div
              className="flex items-stretch gap-0.5 p-[3px] rounded-[14px]"
              style={{
                background: "var(--color-active-bg)",
                border: "1px solid var(--color-active-border)",
              }}
            >
              {tabs.map((tab) => {
                const isActive = location.pathname.includes(tab.to);
                return <TabItem key={tab.to} tab={tab} isActive={isActive} />;
              })}
            </div>
          </motion.div>

          {/* Spacer so border doesn't collide with tab underline */}
          <div className="h-0" />
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
