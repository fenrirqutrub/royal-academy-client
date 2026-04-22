import { LayoutGroup, motion } from "framer-motion";

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
}

const getButtonClass = ({
  isActive,
  disabled,
}: {
  isActive: boolean;
  disabled?: boolean;
}) =>
  [
    "relative shrink-0 overflow-hidden rounded border border-[var(--color-active-border)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 bangla sm:px-3.5 sm:text-sm",
    disabled
      ? "cursor-not-allowed opacity-60"
      : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-active-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    isActive
      ? "border-[var(--color-text)] text-[var(--color-bg)]"
      : "border-[var(--color-active-border)] bg-[var(--color-bg)] text-[var(--color-gray)] hover:bg-[var(--color-active-bg)] hover:text-[var(--color-text)] hover:border-[var(--color-active-border)]",
  ].join(" ");

const PillButton = ({
  id,
  label,
  activeId,
  onChange,
  disabled = false,
  layoutId,
}: PillButtonProps) => {
  const isActive = activeId === id;

  return (
    <motion.button
      type="button"
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={() => !disabled && onChange(id)}
      disabled={disabled}
      aria-pressed={isActive}
      className={getButtonClass({ isActive, disabled })}
    >
      {isActive && (
        <motion.span
          layoutId={`${layoutId}-active`}
          className="absolute inset-0 rounded bg-[var(--color-text)]"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}

      <span className="relative z-10">{label}</span>
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
  const uniqueItems = Array.from(new Set(items.filter(Boolean)));

  return (
    <LayoutGroup id={`${layoutId}-group`}>
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-1.5">
          <PillButton
            id="all"
            label={allLabel}
            activeId={activeId}
            onChange={onChange}
            disabled={disabled}
            layoutId={layoutId}
          />

          {uniqueItems.map((item) => (
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
        </div>
      </div>
    </LayoutGroup>
  );
};

export default AnimatedFilterPills;
