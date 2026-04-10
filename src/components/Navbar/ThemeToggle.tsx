// ThemeToggle.tsx
import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeProvider";

interface ThemeToggleProps {
  size?: number;
  animationSpeed?: number;
  onClick?: () => void;
}

// ── Static: defined once at module level, never re-created ──────────────────
const iconVariants = {
  initial: (dir: number) => ({ opacity: 0, scale: 0.6, rotate: dir * -90 }),
  animate: { opacity: 1, scale: 1, rotate: 0 },
  exit: (dir: number) => ({ opacity: 0, scale: 0.6, rotate: dir * 90 }),
} as const;

const btnBaseStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "var(--color-text)",
};
// ────────────────────────────────────────────────────────────────────────────

const ThemeToggle = memo<ThemeToggleProps>(
  ({ size = 50, animationSpeed = 0.4, onClick }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const handleClick = useCallback(() => {
      toggleTheme();
      onClick?.();
    }, [toggleTheme, onClick]);

    return (
      <motion.button
        onClick={handleClick}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        // ✅ Fixed: removed `w-full` — it conflicted with the explicit `width: size` inline style,
        //    causing the button to stretch full-width inside flex containers (e.g. the profile dropdown)
        className="relative flex items-center justify-center outline-none border-none rounded-full cursor-pointer p-2 flex-shrink-0"
        style={{ width: size, height: size, ...btnBaseStyle }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait" initial={false} custom={isDark ? 1 : -1}>
          <motion.div
            key={theme}
            custom={isDark ? 1 : -1}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: animationSpeed, ease: "easeInOut" }}
            style={{ willChange: "transform, opacity" }}
          >
            {isDark ? (
              <Moon size={size * 0.6} color="var(--color-text)" />
            ) : (
              <Sun size={size * 0.65} color="var(--color-text)" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  },
);

ThemeToggle.displayName = "ThemeToggle";
export default ThemeToggle;
