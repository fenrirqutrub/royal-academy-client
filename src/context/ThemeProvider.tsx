import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type FC,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Theme = "light" | "dark";
type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

interface AnimColors {
  bg: string;
  glow: string;
  particle: string;
  particleShadow: string;
}

/* ─── Static constants ───────────────────────────────────────────────────── */
const ANIMATION_CORNER: Corner = "bottom-left";
const THEME_STORAGE_KEY = "theme";
const THEME_SWAP_DELAY = 200;
const ANIM_END_DELAY = 500;

const CLIP_PATHS: Record<Corner, { from: string; to: string }> = {
  "top-right": { from: "circle(0% at 100% 0%)", to: "circle(150% at 100% 0%)" },
  "top-left": { from: "circle(0% at 0% 0%)", to: "circle(150% at 0% 0%)" },
  "bottom-right": {
    from: "circle(0% at 100% 100%)",
    to: "circle(150% at 100% 100%)",
  },
  "bottom-left": {
    from: "circle(0% at 0% 100%)",
    to: "circle(150% at 0% 100%)",
  },
};

const CORNER_OFFSETS: Record<Corner, { side: string; vSide: string }> = {
  "top-right": { side: "top", vSide: "right" },
  "top-left": { side: "top", vSide: "left" },
  "bottom-right": { side: "bottom", vSide: "right" },
  "bottom-left": { side: "bottom", vSide: "left" },
};

const PARTICLE_COUNT = 8;
const PARTICLE_ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: Math.cos((i / PARTICLE_COUNT) * Math.PI * 2) * 180,
  y: Math.sin((i / PARTICLE_COUNT) * Math.PI * 2) * 180,
  delay: i * 0.02,
}));

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Read animation colors from CSS after data-theme is flipped */
const readAnimColors = (): AnimColors => {
  const particle = cssVar("--anim-particle");
  return {
    bg: cssVar("--anim-bg"),
    glow: cssVar("--anim-glow"),
    particle,
    particleShadow: particle.replace(/[\d.]+\)$/, "0.5)"),
  };
};

const getInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* localStorage blocked */
  }
  // localStorage-এ কিছু না থাকলে system preference check করো
  // if (typeof window !== "undefined" && window.matchMedia) {
  //   return window.matchMedia("(prefers-color-scheme: dark)").matches
  //     ? "dark"
  //     : "light";
  // }
  // সব fail হলে default light
  return "light";
};

/* ─── Context ────────────────────────────────────────────────────────────── */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

/* ─── Provider ───────────────────────────────────────────────────────────── */
const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animColors, setAnimColors] = useState<AnimColors | null>(null);

  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(
    () => () => {
      if (t1.current) clearTimeout(t1.current);
      if (t2.current) clearTimeout(t2.current);
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";

    if (t1.current) clearTimeout(t1.current);
    if (t2.current) clearTimeout(t2.current);

    // Flip data-theme first so cssVar() reads the NEW theme's values
    document.documentElement.setAttribute("data-theme", newTheme);

    // Snapshot animation colors from CSS (now reflecting newTheme)
    setAnimColors(readAnimColors());
    setIsAnimating(true);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      /* blocked */
    }

    t1.current = setTimeout(() => setTheme(newTheme), THEME_SWAP_DELAY);
    t2.current = setTimeout(() => setIsAnimating(false), ANIM_END_DELAY);
  }, [theme]);

  const contextValue = useMemo<ThemeContextType>(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  const clipPath = CLIP_PATHS[ANIMATION_CORNER];
  const { side, vSide } = CORNER_OFFSETS[ANIMATION_CORNER];

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}

      <AnimatePresence mode="wait">
        {isAnimating && animColors && (
          <>
            {/* Clip-path reveal */}
            <motion.div
              key="clip"
              className="fixed inset-0 pointer-events-none z-40"
              initial={{ clipPath: clipPath.from }}
              animate={{ clipPath: clipPath.to }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              style={{
                backgroundColor: animColors.bg,
                willChange: "clip-path",
              }}
            />

            {/* Glow burst */}
            <motion.div
              key="glow"
              className="fixed pointer-events-none z-40"
              style={{
                [side]: -250,
                [vSide]: -250,
                width: 500,
                height: 500,
                background: `radial-gradient(circle, ${animColors.glow} 0%, transparent 70%)`,
                filter: "blur(60px)",
                willChange: "opacity, transform",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.5, 2] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Particles */}
            {PARTICLE_ANGLES.map(({ x, y, delay }, i) => (
              <motion.div
                key={i}
                className="fixed pointer-events-none"
                style={{
                  [side]: 0,
                  [vSide]: 0,
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: animColors.particle,
                  boxShadow: `0 0 15px ${animColors.particleShadow}`,
                  zIndex: 39,
                  willChange: "transform, opacity",
                }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x, y }}
                transition={{ duration: 0.4, ease: "easeOut", delay }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </ThemeContext.Provider>
  );
};

export { ThemeProvider };
