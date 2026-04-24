// src/components/common/SeenUserAvatar.tsx

import { Eye, User } from "lucide-react";
import { toBn } from "../../utility/Formatters";

interface ViewedByUser {
  userId: {
    _id: string;
    name: string;
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

const SeenUserAvatar = ({
  viewCount,
  viewedBy,
  onViewDetails,
}: SeenUserAvatarProps) => {
  const safeViewedBy = Array.isArray(viewedBy)
    ? viewedBy.filter(
        (v) => v?.userId && typeof v.userId === "object" && v.userId.name,
      )
    : [];

  // ─── Zero state ───────────────────────────────────────────────
  if (viewCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[var(--color-gray)]">
        <Eye className="w-4 h-4" />
        <span className="text-xs">{toBn(0)}</span>
      </div>
    );
  }

  // ─── Seen state ───────────────────────────────────────────────
  // unique users শুধু avatar-এ দেখাবো (viewedBy তে duplicates থাকতে পারে)
  const uniqueUsers = safeViewedBy.reduce<ViewedByUser[]>((acc, cur) => {
    const alreadyIn = acc.some((v) => v.userId._id === cur.userId._id);
    if (!alreadyIn) acc.push(cur);
    return acc;
  }, []);

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
        {visible.map((view, i) =>
          view.userId?.avatar?.url ? (
            <img
              key={view.userId._id || i}
              src={view.userId.avatar.url}
              alt={view.userId.name}
              title={view.userId.name}
              className="w-6 h-6 rounded-full border-2 border-[var(--color-bg)] object-cover"
            />
          ) : (
            <div
              key={view.userId?._id || i}
              title={view.userId?.name || ""}
              className="w-6 h-6 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-active-bg)] flex items-center justify-center"
            >
              <User className="w-3 h-3 text-[var(--color-gray)]" />
            </div>
          ),
        )}

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

export default SeenUserAvatar;
