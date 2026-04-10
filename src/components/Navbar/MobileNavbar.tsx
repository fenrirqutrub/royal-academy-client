// MobileNavbar.tsx
import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Bell,
  Camera,
  BookOpen,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import type { MenuItem } from "./Navbar";

/* ─── Icon map ──────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  "/": Home,
  "/notice": Bell,
  "/photography": Camera,
  "/dailylesson": BookOpen,
  "/weekly-exam": ClipboardList,
  "/people": GraduationCap,
};

const SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 30,
  mass: 0.6,
} as const;

const BADGE_SPRING = {
  type: "spring",
  stiffness: 500,
  damping: 22,
  mass: 0.5,
} as const;

/* ─── BottomTabItem ─────────────────────────────────────────────────────── */
interface BottomTabItemProps {
  item: MenuItem;
  isActive: boolean;
  badge?: number;
  onClick: (path: string) => void;
}

const BottomTabItem = memo<BottomTabItemProps>(
  ({ item, isActive, badge, onClick }) => {
    const Icon = ICON_MAP[item.path] ?? Home;
    const showBadge = typeof badge === "number" && badge > 0;

    return (
      <button
        onClick={() => onClick(item.path)}
        className="relative flex flex-col items-center justify-center flex-1 py-2 outline-none min-w-0"
        aria-label={item.name}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Active pill background */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="bottomTabActivePill"
              className="absolute inset-x-1 top-1 bottom-1 rounded-2xl pointer-events-none"
              style={{ backgroundColor: "var(--color-active-bg)" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={SPRING}
            />
          )}
        </AnimatePresence>

        {/* Icon + badge wrapper */}
        <motion.div
          animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={SPRING}
          className="relative z-10 mb-0.5"
        >
          <Icon
            className="w-5 h-5 transition-colors duration-200"
            style={{
              color: isActive
                ? "var(--color-active-text)"
                : "var(--color-gray)",
              strokeWidth: isActive ? 2.2 : 1.8,
            }}
          />

          {/* Badge */}
          <AnimatePresence>
            {showBadge && (
              <motion.span
                key={badge}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={BADGE_SPRING}
                className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold leading-none pointer-events-none select-none"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  boxShadow: "0 0 0 1.5px var(--color-bg)",
                }}
              >
                {badge > 99 ? "99+" : badge}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </button>
    );
  },
);
BottomTabItem.displayName = "BottomTabItem";

/* ─── MobileNavbar ──────────────────────────────────────────────────────── */
export interface BadgeCounts {
  [path: string]: number;
}

interface MobileNavbarProps {
  menuConfig: MenuItem[];
  activeItem: string;
  badgeCounts?: BadgeCounts;
  onNavigate: (path: string) => void;
}

const MobileNavbar = memo<MobileNavbarProps>(
  ({ menuConfig, activeItem, badgeCounts = {}, onNavigate }) => {
    return (
      <>
        {/* Bottom tab bar — mobile only */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50"
          style={{
            backgroundColor: "var(--color-bg)",
            borderTop: "1px solid var(--color-active-border)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 -4px 24px 0 rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-stretch h-16 px-1">
            {menuConfig.map((item) => (
              <BottomTabItem
                key={item.name}
                item={item}
                isActive={activeItem === item.name}
                badge={badgeCounts[item.path]}
                onClick={onNavigate}
              />
            ))}
          </div>
        </nav>

        {/* Spacer so page content isn't hidden under the bar */}
        <div className="md:hidden h-16 flex-shrink-0" />
      </>
    );
  },
);
MobileNavbar.displayName = "MobileNavbar";
export default MobileNavbar;
