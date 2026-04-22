import { LayoutGroup, motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";

export type FilterPillItem =
  | string
  | {
      id: string;
      label: ReactNode;
      disabled?: boolean;
      title?: string;
      className?: string;
    };

type NormalizedPillItem = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
};

interface AnimatedFilterPillsProps {
  items: ReadonlyArray<FilterPillItem>;
  activeId: string;
  onChange: (id: string) => void;

  disabled?: boolean;

  showAll?: boolean;
  allId?: string;
  allLabel?: ReactNode;

  layoutId?: string;
  className?: string;
  wrapperClassName?: string;
}

interface PillButtonProps {
  id: string;
  label: ReactNode;
  activeId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  layoutId: string;
}

const getButtonClass = ({
  isActive,
  disabled,
  className = "",
}: {
  isActive: boolean;
  disabled?: boolean;
  className?: string;
}) =>
  [
    "relative shrink-0 overflow-hidden rounded border px-3 py-1.5 text-xs font-medium transition-colors duration-200 bangla sm:px-3.5 sm:text-sm",
    disabled
      ? "cursor-not-allowed opacity-60"
      : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-active-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    isActive
      ? "border-[var(--color-text)] text-[var(--color-bg)]"
      : "border-[var(--color-active-border)] bg-[var(--color-bg)] text-[var(--color-gray)] hover:bg-[var(--color-active-bg)] hover:text-[var(--color-text)] hover:border-[var(--color-active-border)]",
    className,
  ].join(" ");

const normalizeItem = (item: FilterPillItem): NormalizedPillItem | null => {
  if (typeof item === "string") {
    const trimmed = item.trim();
    if (!trimmed) return null;

    return {
      id: trimmed,
      label: trimmed,
    };
  }

  if (!item || typeof item !== "object") return null;

  const id = String(item.id ?? "").trim();
  if (!id) return null;

  return {
    id,
    label: item.label,
    disabled: item.disabled,
    title: item.title,
    className: item.className,
  };
};

const PillButton = ({
  id,
  label,
  activeId,
  onChange,
  disabled = false,
  title,
  className,
  layoutId,
}: PillButtonProps) => {
  const isActive = activeId === id;

  return (
    <motion.button
      type="button"
      title={title}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={() => !disabled && onChange(id)}
      disabled={disabled}
      aria-pressed={isActive}
      className={getButtonClass({ isActive, disabled, className })}
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
  showAll = true,
  allId = "all",
  allLabel = "সকল",
  layoutId = "filter-pill",
  className = "",
  wrapperClassName = "",
}: AnimatedFilterPillsProps) => {
  const normalizedItems = useMemo(() => {
    const map = new Map<string, NormalizedPillItem>();

    for (const rawItem of items) {
      const item = normalizeItem(rawItem);
      if (!item) continue;

      // prevent duplicate "all" item in list
      if (item.id === allId) continue;

      map.set(item.id, item);
    }

    return Array.from(map.values());
  }, [items, allId]);

  const resolvedAllLabel = useMemo(() => {
    const allItem = items.find(
      (item) => typeof item !== "string" && item?.id === allId,
    );

    if (allItem && typeof allItem !== "string") {
      return allItem.label;
    }

    return allLabel;
  }, [items, allId, allLabel]);

  return (
    <LayoutGroup id={`${layoutId}-group`}>
      <div
        className={`overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${wrapperClassName}`}
      >
        <div className={`flex min-w-max items-center gap-1.5 ${className}`}>
          {showAll && (
            <PillButton
              id={allId}
              label={resolvedAllLabel}
              activeId={activeId}
              onChange={onChange}
              disabled={disabled}
              layoutId={layoutId}
            />
          )}

          {normalizedItems.map((item) => (
            <PillButton
              key={item.id}
              id={item.id}
              label={item.label}
              activeId={activeId}
              onChange={onChange}
              disabled={disabled || item.disabled}
              title={item.title}
              className={item.className}
              layoutId={layoutId}
            />
          ))}
        </div>
      </div>
    </LayoutGroup>
  );
};

export default AnimatedFilterPills;
