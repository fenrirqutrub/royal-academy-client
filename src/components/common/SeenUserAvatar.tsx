// src/components/common/SeenUserAvatar.tsx

import { Eye, User } from "lucide-react";
import { toBn } from "../../utility/Formatters";
import { useAuth } from "../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────
interface ViewedByUser {
  userId: {
    _id: string;
    name: string;
    role?: string;
    studentClass?: string;
    roll?: string;
    avatar?: { url: string };
  };
  viewedAt: string;
}

interface SeenUserAvatarProps {
  viewCount: number;
  viewedBy: ViewedByUser[];
  onViewDetails: () => void;
}

// ─── Role label map ───────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  teacher: "শিক্ষক",
  principal: "পরিচালক",
  admin: "প্রশাসক",
  owner: "মালিক",
};

const STAFF_ROLES = ["teacher", "principal", "admin", "owner"];

const isStaffRole = (role?: string) => !!role && STAFF_ROLES.includes(role);

// ─── Component ────────────────────────────────────────────────
const SeenUserAvatar = ({
  viewCount,
  viewedBy,
  onViewDetails,
}: SeenUserAvatarProps) => {
  const { user } = useAuth();

  const currentUserId = user?.id ?? "";
  const currentUserRole = user?.role ?? "student";
  const currentUserIsStudent = currentUserRole === "student";

  // ─── Safe filter ─────────────────────────────────────────────
  const safeViewedBy = Array.isArray(viewedBy)
    ? viewedBy.filter(
        (v) => v?.userId && typeof v.userId === "object" && v.userId.name,
      )
    : [];

  // ─── Unique users (latest viewedAt) ──────────────────────────
  const uniqueUsers = safeViewedBy.reduce<ViewedByUser[]>((acc, cur) => {
    const existingIdx = acc.findIndex((v) => v.userId._id === cur.userId._id);
    if (existingIdx === -1) {
      acc.push(cur);
    } else if (new Date(cur.viewedAt) > new Date(acc[existingIdx].viewedAt)) {
      acc[existingIdx] = cur;
    }
    return acc;
  }, []);

  const canSeeAvatar = (viewedUser: ViewedByUser["userId"]): boolean => {
    if (!currentUserIsStudent) return true;
    if (viewedUser._id === currentUserId) return true;
    if (isStaffRole(viewedUser.role)) return true;
    return false;
  };

  // ─── Zero state ───────────────────────────────────────────────
  if (viewCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[var(--color-gray)]">
        <Eye className="w-4 h-4" />
        <span className="text-xs">{toBn(0)}</span>
      </div>
    );
  }

  const visible = uniqueUsers.slice(0, 3);
  const extra = Math.max(0, uniqueUsers.length - 3);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onViewDetails();
      }}
      className="flex items-center gap-2 hover:opacity-75 transition-opacity"
      title="কে কে দেখেছেন"
    >
      {/* Avatars */}
      <div className="flex -space-x-2">
        {visible.map((view, i) => {
          const showAvatar =
            canSeeAvatar(view.userId) && !!view.userId.avatar?.url;

          return showAvatar ? (
            <img
              key={view.userId._id || i}
              src={view.userId.avatar!.url}
              alt={view.userId.name}
              title={view.userId.name}
              className="w-6 h-6 rounded-full border-2 border-[var(--color-bg)] object-cover"
            />
          ) : (
            <div
              key={view.userId._id || i}
              title={
                currentUserIsStudent && !isStaffRole(view.userId.role)
                  ? "ছাত্র/ছাত্রী"
                  : view.userId.name
              }
              className="w-6 h-6 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-active-bg)] flex items-center justify-center"
            >
              <User className="w-3 h-3 text-[var(--color-gray)]" />
            </div>
          );
        })}

        {extra > 0 && (
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-active-bg)] flex items-center justify-center">
            <span className="text-[9px] font-bold text-[var(--color-gray)]">
              +{extra}
            </span>
          </div>
        )}
      </div>

      {/* Count */}
      <span className="text-xs text-[var(--color-gray)]">
        {toBn(viewCount)} জন
      </span>
    </button>
  );
};

export { ROLE_LABELS, isStaffRole };
export type { ViewedByUser };
export default SeenUserAvatar;
