import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, type AuthUser } from "../../context/AuthContext";

interface NoticeTabsProps {
  activeId: string;
  onChange: (id: string) => void;
}

type Tab = {
  id: string;
  label: string;
  icon: string;
  roles?: AuthUser["role"][];
};

const NoticeTabs = ({ activeId, onChange }: NoticeTabsProps) => {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const allTabs: Tab[] = [
    { id: "notice", label: "নোটিশ বোর্ড", icon: "📋" },

    {
      id: "complain",
      label: "আভিযোগ বাক্স",
      icon: "📋",
      roles: ["principal", "admin", "owner"],
    },

    { id: "routine", label: "ক্লাস রুটিন", icon: "📅" },
    { id: "marks", label: "মান বন্টন", icon: "📊" },
  ];

  const tabs = allTabs.filter(
    (tab) => !tab.roles || tab.roles.some((r) => hasRole(r)),
  );

  const active = allTabs.find((t) => t.id === activeId) ?? allTabs[0];

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
        className="flex items-center gap-1.5 bangla text-xl opacity-50 hover:opacity-100
          transition-opacity outline-none select-none"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={active.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5"
          >
            <motion.span
              initial={{ rotate: -15, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: 16, display: "inline-block" }}
            >
              {active.icon}
            </motion.span>
            <span>{active.label}</span>
          </motion.span>
        </AnimatePresence>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs"
        >
          ▾
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
              rounded-xl p-1.5 flex flex-col gap-0.5 min-w-[160px] z-50"
          >
            {tabs.map((tab, i) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onHoverStart={() => setHoveredId(tab.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => {
                  onChange(tab.id);
                  setOpen(false);
                }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg
                  text-sm bangla text-[var(--color-text)] text-left w-full outline-none"
              >
                {/* Hover / active bg */}
                {(hoveredId === tab.id || activeId === tab.id) && (
                  <motion.span
                    layoutId="tab-hover-bg"
                    className="absolute inset-0 rounded-lg bg-[var(--color-active-bg)]"
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}

                <motion.span
                  animate={{
                    scale: hoveredId === tab.id ? 1.2 : 1,
                    rotate: hoveredId === tab.id ? 8 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 14, display: "inline-block" }}
                  className="relative"
                >
                  {tab.icon}
                </motion.span>

                <motion.span
                  animate={{ x: hoveredId === tab.id ? 2 : 0 }}
                  transition={{ duration: 0.15 }}
                  className={`relative flex-1 ${activeId === tab.id ? "font-semibold" : ""}`}
                >
                  {tab.label}
                </motion.span>

                {/* Active checkmark */}
                <AnimatePresence>
                  {activeId === tab.id && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 0.4, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.15 }}
                      className="relative text-xs"
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoticeTabs;
