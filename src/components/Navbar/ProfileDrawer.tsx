// ProfileDrawer.tsx

import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeProvider";
import { useProfileDrawer } from "../../context/ProfileDrawerContext";
import { SidebarContent } from "../../pages/Admin/Dashboard/Sidebar.Ui";
import {
  ROLE_CONFIG,
  isPrivilegedRole,
  type UserRole,
} from "../../utility/Constants";
import {
  contentNav,
  dashboardNav,
  managementNav,
  studentNav,
  type NavItem,
} from "../../utility/AdminSidebarData";

const buildNav = (role: UserRole): NavItem[] => {
  if (role === "student") return studentNav();

  const privileged = isPrivilegedRole(role);

  return [
    ...dashboardNav(),
    ...contentNav(privileged),
    ...managementNav(privileged),
  ];
};

const ProfileDrawer = () => {
  const { open, closeDrawer } = useProfileDrawer();
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();

  const role: UserRole = user?.role ?? "teacher";
  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.teacher;
  const navGroups = buildNav(role);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="profile-backdrop"
            className="fixed inset-0 z-[55] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
          />

          <motion.aside
            key="profile-drawer"
            aria-label="Profile navigation drawer"
            className="fixed top-0 bottom-0 right-0 z-[60] w-[280px] border-l border-[var(--color-active-border)] bg-[var(--color-bg)]"
            initial={{ x: 280 }}
            animate={{ x: 0 }}
            exit={{ x: 280 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <SidebarContent
              user={user}
              navGroups={navGroups}
              roleConfig={roleConfig}
              onLogout={logout}
              onThemeToggle={toggleTheme}
              onNavClick={closeDrawer}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileDrawer;
