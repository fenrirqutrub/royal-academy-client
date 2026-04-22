import type { ReactNode } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";

interface AnimatedFilterPillsProps {
  items: string[];
  activeId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  allLabel?: string;
  layoutId?: string;
}

interface PillButtonProps {
  id: string;
  label: string;
  activeId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  layoutId: string;
  icon?: ReactNode;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const getButtonClass = ({
  isActive,
  disabled,
}: {
  isActive: boolean;
  disabled?: boolean;
}) =>
  [
    "relative inline-flex items-center gap-2 overflow-hidden rounded-xl border px-3.5 py-2 text-sm font-medium outline-none transition-all duration-200 bangla",
    disabled
      ? "cursor-not-allowed opacity-60"
      : "cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-text-hover)]",
    isActive
      ? "border-[var(--color-brand)] text-[var(--color-brand)]"
      : "border-[var(--color-active-border)] bg-[var(--color-bg)] text-[var(--color-gray)] hover:bg-[var(--color-active-bg)] hover:text-[var(--color-text)]",
  ].join(" ");

const PillButton = ({
  id,
  label,
  activeId,
  onChange,
  disabled = false,
  layoutId,
  icon,
}: PillButtonProps) => {
  const isActive = activeId === id;

  return (
    <motion.button
      type="button"
      variants={itemVariants}
      whileHover={!disabled ? { y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={() => !disabled && onChange(id)}
      disabled={disabled}
      aria-pressed={isActive}
      className={getButtonClass({ isActive, disabled })}
    >
      {isActive && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-xl bg-[var(--color-brand-soft)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
    </motion.button>
  );
};

const AnimatedFilterPills = ({
  items,
  activeId,
  onChange,
  disabled = false,
  allLabel = "সকল",
  layoutId = "filter-pill",
}: AnimatedFilterPillsProps) => {
  if (items.length === 0) return null;

  return (
    <LayoutGroup id={layoutId}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center gap-2"
      >
        <PillButton
          id="all"
          label={allLabel}
          activeId={activeId}
          onChange={onChange}
          disabled={disabled}
          layoutId={layoutId}
          icon={<LayoutGrid size={14} strokeWidth={2.2} />}
        />

        {items.map((item) => (
          <PillButton
            key={item}
            id={item}
            label={item}
            activeId={activeId}
            onChange={onChange}
            disabled={disabled}
            layoutId={layoutId}
          />
        ))}
      </motion.div>
    </LayoutGroup>
  );
};

export default AnimatedFilterPills;
