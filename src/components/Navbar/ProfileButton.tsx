// src/components/Navbar/ProfileButton.tsx
import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Key } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useProfileDrawer } from "../../context/ProfileDrawerContext";

import { ROLE_CONFIG } from "../../utility/Constants";
import { Avatar } from "../common/Avatar";

interface ProfileButtonProps {
  size?: number;
}

/* ─── ProfileButton ───────────────────────────────────────────────────────── */
const ProfileButton = memo<ProfileButtonProps>(({ size = 35 }) => {
  const { openDrawer } = useProfileDrawer();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const role = user?.role ?? "teacher";
  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.teacher;

  // ── Loading ──
  if (loading) {
    return (
      <div
        className="rounded-full animate-pulse bg-[var(--color-active-bg)] "
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }

  // ── Not logged in ──
  if (!isAuthenticated) {
    return (
      <motion.button
        onClick={() => navigate("/auth")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm outline-none cursor-pointer h-10 bg-[var(--color-text)] text-[var(--color-bg)] border border-[var(--color-active-border)] "
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        <Key className="w-4 h-4 flex-shrink-0" />
        <span>লগইন</span>
      </motion.button>
    );
  }

  // ── Logged in — opens sidebar drawer on ALL devices ──
  return (
    <motion.button
      onClick={openDrawer}
      className="flex items-center gap-1.5 rounded-xl outline-none cursor-pointer px-1.5 py-1 min-h bg-transparent border border-transparent transition-colors min-h-11 min-w-11 "
      whileHover={{
        scale: 1.04,
        backgroundColor: "var(--color-active-bg)",
        borderColor: "var(--color-active-border)",
      }}
      whileTap={{ scale: 0.96 }}
      aria-label="Open profile drawer"
    >
      <Avatar
        name={user?.name ?? "User"}
        url={user?.avatar?.url ?? null}
        color={roleConfig.color}
        size={40}
      />
    </motion.button>
  );
});

ProfileButton.displayName = "ProfileButton";
export default ProfileButton;
