// src/pages/Admin/Dashboard/AdminSidebar.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeProvider";
import { SidebarContent } from "./Sidebar.Ui";
import { ROLES } from "../../../utility/Constants";
import {
  contentNav,
  dashboardNav,
  managementNav,
  studentNav,
  type NavItem,
} from "../../../utility/AdminSidebarData";
import { AnimatedAvatar } from "../../../components/common/AnimatedAvatar";

const buildNav = (role: string): NavItem[] => {
  if (role === "student") return studentNav();
  const isPrivileged = ["admin", "principal", "owner"].includes(role);
  return [
    ...dashboardNav(),
    ...contentNav(isPrivileged),
    ...managementNav(isPrivileged),
  ];
};

const AdminSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();

  const role = user?.role ?? "teacher";
  const roleConfig = ROLES[role] ?? ROLES.teacher;
  const navGroups = buildNav(role);

  const contentProps = {
    user,
    navGroups,
    roleConfig,
    onLogout: logout,
    onThemeToggle: toggleTheme,
    onNavClick: () => setMobileOpen(false),
  };

  useEffect(() => {
    const sync = () => {
      const lg = window.innerWidth >= 1024;
      setDesktopOpen(lg);
      if (lg) setMobileOpen(false);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Floating Avatar Toggle */}
      <AnimatePresence>
        {!mobileOpen && (
          <motion.button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-[70] rounded-full bg-[var(--color-bg)] backdrop-blur-xl shadow-xl cursor-pointer"
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <AnimatedAvatar
              name={user?.name ?? "User"}
              url={user?.avatar?.url ?? null}
              color={roleConfig.color}
              size={46}
              showRings={true}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Dark Overlay - Click to close */}
            <motion.div
              key="backdrop"
              className="lg:hidden fixed inset-0 z-[60] cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileOpen(false)}
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
              }}
            >
              {/* Extra shadow from sidebar edge */}
              <motion.div
                className="absolute top-0 bottom-0 left-0 w-[320px] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  boxShadow: "20px 0 60px 20px rgba(0,0,0,0.5)",
                }}
              />
            </motion.div>

            {/* Sidebar Panel */}
            <motion.aside
              key="mobile-sidebar"
              id="mobile-sidebar"
              className="lg:hidden fixed top-0 bottom-0 left-0 z-[65] w-[85vw] max-w-[320px]
                bg-[var(--color-bg)] overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              style={{
                boxShadow: "4px 0 30px rgba(0,0,0,0.3)",
              }}
            >
              {/* Top accent line */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${roleConfig.color}, ${roleConfig.color}40, transparent)`,
                }}
                initial={{ scaleX: 0, transformOrigin: "left" }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              />

              <SidebarContent {...contentProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: desktopOpen ? 280 : 0,
          opacity: desktopOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:block sticky top-0 h-screen overflow-hidden shrink-0"
      >
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[var(--color-active-border)]" />

        <div className="relative w-[280px] h-full">
          <SidebarContent {...contentProps} />
        </div>
      </motion.aside>
    </>
  );
};

export default AdminSidebar;
