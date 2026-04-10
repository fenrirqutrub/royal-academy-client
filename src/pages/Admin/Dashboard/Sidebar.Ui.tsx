// src/pages/Admin/Dashboard/Sidebar.Ui.tsx
import { useState, useRef } from "react";
import { Link, useLocation } from "react-router";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  LogOut,
  ChevronDown,
  HomeIcon,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import type {
  NavItem,
  SidebarContentProps,
} from "../../../utility/AdminSidebarData";
import { AnimatedAvatar } from "../../../components/common/AnimatedAvatar";

// ═══════════════════════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════════════════════

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { y: -30, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25, delay: 0.05 },
  },
};

const subMenuVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { type: "spring", stiffness: 400, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const MagneticButton = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 400, damping: 25, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FloatingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className="absolute inset-0 rounded-xl bg-[var(--color-active-bg)]
      border border-[var(--color-active-border)] pointer-events-none"
  />
);

const NavLink = ({
  item,
  onNavClick,
  isSubItem = false,
}: {
  item: NavItem;
  onNavClick?: () => void;
  isSubItem?: boolean;
}) => {
  const { pathname } = useLocation();
  const active = pathname === item.path;
  const Icon = item.icon;

  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 400, damping: 25 });
  const iconRotate = useTransform(springX, [-10, 0, 10], [-15, 0, 15]);

  return (
    <div className="relative">
      {/* FIX 1 continued: AnimatePresence দিয়ে indicator animate করা হচ্ছে */}
      <AnimatePresence initial={false}>
        {active && <FloatingIndicator key={item.path} />}
      </AnimatePresence>

      <motion.div
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          x.set(((e.clientX - rect.left) / rect.width - 0.5) * 20);
        }}
        onMouseLeave={() => x.set(0)}
      >
        <Link
          to={item.path!}
          onClick={onNavClick}
          className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
            transition-colors duration-200 ${isSubItem ? "py-2" : ""} ${
              active
                ? "text-[var(--color-active-text)]"
                : "text-[var(--color-gray)] hover:text-[var(--color-text)]"
            }`}
        >
          <motion.span
            style={{ rotate: iconRotate }}
            className={`flex-shrink-0 ${
              active ? "text-[var(--color-text-hover)]" : ""
            }`}
          >
            <Icon
              className={isSubItem ? "w-4 h-4" : "w-5 h-5"}
              strokeWidth={1.8}
            />
          </motion.span>

          <span className="truncate">{item.name}</span>

          {active && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-auto flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-text-hover)]" />
            </motion.div>
          )}
        </Link>
      </motion.div>
    </div>
  );
};

const NavGroup = ({
  item,
  open,
  onToggle,
  onNavClick,
}: {
  item: NavItem;
  index: number;
  open: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
}) => {
  const { pathname } = useLocation();

  if (!item.subItems?.length) {
    return (
      // FIX 2: initial={false} — re-render-এ entrance animation replay হবে না
      <motion.div initial={false} animate={{ opacity: 1, x: 0 }}>
        <NavLink item={item} onNavClick={onNavClick} />
      </motion.div>
    );
  }

  const hasActiveChild = item.subItems.some((sub) => pathname === sub.path);
  const Icon = item.icon;

  return (
    // FIX 2: initial={false} — re-render-এ entrance animation replay হবে না
    <motion.div
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-1"
    >
      <motion.button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl
          text-sm font-medium transition-all duration-200 cursor-pointer group
          ${
            hasActiveChild
              ? "text-[var(--color-active-text)] bg-[var(--color-active-bg)]"
              : "text-[var(--color-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-active-bg)]"
          }`}
      >
        <span className="flex items-center gap-3">
          <motion.span
            animate={open ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={hasActiveChild ? "text-[var(--color-text-hover)]" : ""}
          >
            <Icon className="w-5 h-5" strokeWidth={1.8} />
          </motion.span>
          <span>{item.name}</span>
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="opacity-50 group-hover:opacity-100"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            variants={subMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="ml-4 pl-4 border-l-2 border-[var(--color-active-border)] space-y-1 py-1">
              {item.subItems.map((sub, i) => (
                <motion.div
                  key={sub.path}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  <NavLink item={sub} onNavClick={onNavClick} isSubItem />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Action Button Component
// ═══════════════════════════════════════════════════════════════════════════

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "primary",
  to,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "danger";
  to?: string;
}) => {
  const isPrimary = variant === "primary";
  const buttonColor = isPrimary ? "#10b981" : "#ef4444";

  const baseClasses = `flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl
    text-xs font-semibold transition-all duration-300 cursor-pointer group overflow-hidden relative
    border border-[var(--color-active-border)] bg-[var(--color-bg)]
    hover:bg-[var(--color-active-bg)] active:scale-95`;

  const content = (
    <>
      <motion.div
        className="absolute inset-0 -translate-x-full opacity-30 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${buttonColor}40, transparent)`,
        }}
        animate={{ translateX: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      <motion.span
        whileHover={{ rotate: isPrimary ? 360 : 15 }}
        transition={{ duration: isPrimary ? 0.5 : 0.2 }}
        className="relative z-10"
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </motion.span>
      <span className="relative z-10">{label}</span>
      {isPrimary && (
        <ArrowUpRight
          className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 
          group-hover:translate-x-0 transition-all duration-200"
        />
      )}
    </>
  );

  if (to) {
    return (
      <MagneticButton className="flex-1">
        <Link
          to={to}
          onClick={onClick}
          className={baseClasses}
          style={{ color: buttonColor }}
        >
          {content}
        </Link>
      </MagneticButton>
    );
  }

  return (
    <MagneticButton className="flex-1">
      <button
        type="button"
        onClick={onClick}
        className={baseClasses}
        style={{ color: buttonColor }}
      >
        {content}
      </button>
    </MagneticButton>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// User Card Component
// ═══════════════════════════════════════════════════════════════════════════

const UserCard = ({
  user,
  roleConfig,
  onThemeToggle,
  onLogout,
  onNavClick,
}: Pick<
  SidebarContentProps,
  "user" | "roleConfig" | "onThemeToggle" | "onLogout" | "onNavClick"
>) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      className="relative p-5 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        style={{
          background: `radial-gradient(circle at center, ${roleConfig.color}15 0%, transparent 70%)`,
        }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative space-y-4">
        <motion.div
          className="flex flex-col items-center"
          animate={{ y: isHovered ? -2 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <motion.div
              className="absolute -inset-2 rounded-full opacity-0 pointer-events-none"
              animate={{
                opacity: isHovered ? 0.4 : 0,
                scale: isHovered ? 1.1 : 1,
              }}
              style={{
                background: `radial-gradient(circle, ${roleConfig.color}50 0%, transparent 70%)`,
              }}
              transition={{ duration: 0.3 }}
            />
            <AnimatedAvatar
              url={user?.avatar?.url ?? null}
              name={user?.name ?? "User"}
              color={roleConfig.color}
              size={100}
              onClick={onThemeToggle}
            />
          </motion.div>

          <Link
            to="/dashboard/profile"
            onClick={onNavClick}
            className="mt-3 text-center group"
          >
            <motion.h3
              className="text-lg font-bold text-[var(--color-text)] 
                group-hover:text-[var(--color-text-hover)] transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {user?.name ?? "User"}
            </motion.h3>

            <motion.div
              className="flex items-center justify-center gap-2 mt-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
                  text-xs font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${roleConfig.color}18`,
                  color: roleConfig.color,
                  borderColor: `${roleConfig.color}40`,
                }}
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: roleConfig.color }}
                />
                {roleConfig.label}
              </motion.span>
              <span className="text-[10px] text-[var(--color-gray)] font-mono">
                #{user?.slug ?? "000"}
              </span>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          className="flex gap-2 pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <ActionButton
            icon={HomeIcon}
            label="হোম"
            to="/"
            onClick={onNavClick}
            variant="primary"
          />
          <ActionButton
            icon={LogOut}
            label="লগ আউট"
            onClick={() => {
              onLogout();
              onNavClick?.();
            }}
            variant="danger"
          />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-4 right-4 h-px bg-[var(--color-active-border)]" />
    </motion.div>
  );
};

export const SidebarContent = ({
  user,
  navGroups,
  roleConfig,
  onLogout,
  onThemeToggle,
  onNavClick,
}: SidebarContentProps) => {
  const [openGroup, setOpenGroup] = useState<number | null>(null);

  return (
    <motion.div
      className="flex flex-col h-full bg-[var(--color-bg)]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* User Card */}
      <UserCard
        user={user}
        roleConfig={roleConfig}
        onThemeToggle={onThemeToggle}
        onLogout={onLogout}
        onNavClick={onNavClick}
      />

      {/* FIX 3: plain <nav> ব্যবহার করা হচ্ছে — motion.nav + variants সরানো হয়েছে */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navGroups.map((group, idx) => (
          <div key={`${group.name}-${idx}`}>
            {idx > 0 && (
              <div className="my-3 mx-3 h-px bg-[var(--color-active-border)]" />
            )}
            <NavGroup
              item={group}
              index={idx}
              open={openGroup === idx}
              onToggle={() =>
                setOpenGroup((prev) => (prev === idx ? null : idx))
              }
              onNavClick={onNavClick}
            />
          </div>
        ))}
      </nav>
    </motion.div>
  );
};
