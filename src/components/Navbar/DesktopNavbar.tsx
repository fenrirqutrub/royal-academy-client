// DesktopNavbar.tsx
import { memo } from "react";
import { motion } from "framer-motion";
import ProfileButton from "./ProfileButton";
import type { MenuItem } from "./Navbar";
import Logo from "./Logo";
import { Notification } from "./Notification";

const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.75,
} as const;

/* ─── NavItem ───────────────────────────────────────────────────────────── */
interface NavItemProps {
  item: MenuItem;
  isActive: boolean;
  onClick: (path: string) => void;
}

const NavItem = memo<NavItemProps>(({ item, isActive, onClick }) => (
  <li className="relative">
    {/* Active pill — rendered FIRST so it sits behind the button text */}
    {isActive && (
      <motion.div
        layoutId="desktopActiveTab"
        className="absolute inset-0 rounded-lg border border-[var(--color-active-border)] pointer-events-none bg-[var(--color-active-bg)]"
        transition={SPRING_TRANSITION}
      />
    )}
    <button
      onClick={() => onClick(item.path)}
      className="relative z-10 px-5 py-2.5 rounded-lg font-medium capitalize transition-colors cursor-pointer outline-none bangla"
      style={{
        color: isActive ? "var(--color-active-text)" : "var(--color-gray)",
      }}
    >
      {item.name}
    </button>
  </li>
));
NavItem.displayName = "NavItem";

/* ─── DesktopNavbar ─────────────────────────────────────────────────────── */
interface DesktopNavbarProps {
  menuConfig: MenuItem[];
  activeItem: string;
  onNavigate: (path: string) => void;
  onLogoClick: () => void;
}

const DesktopNavbar = memo<DesktopNavbarProps>(
  ({ menuConfig, activeItem, onNavigate, onLogoClick }) => (
    <div className="container mx-auto flex justify-between">
      {/* Logo — left */}
      <Logo className="" onClick={onLogoClick} />

      {/* Nav links — center */}
      <ul className="hidden md:flex items-center space-x-1 relative">
        {menuConfig.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={activeItem === item.name}
            onClick={onNavigate}
          />
        ))}
      </ul>

      {/* Profile — right */}
      <div className="hidden md:flex items-center gap-x-5 flex-shrink-0">
        <Notification />
        <ProfileButton size={35} />
      </div>
    </div>
  ),
);
DesktopNavbar.displayName = "DesktopNavbar";
export default DesktopNavbar;
