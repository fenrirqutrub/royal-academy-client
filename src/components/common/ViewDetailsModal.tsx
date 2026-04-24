// src/components/common/ViewDetailsModal.tsx

import { motion, AnimatePresence } from "framer-motion";
import { X, User } from "lucide-react";
import { toBn } from "../../utility/Formatters";
import { useAuth } from "../../context/AuthContext";
import { isStaffRole, ROLE_LABELS } from "./SeenUserAvatar";

// ✅ role যোগ করা হয়েছে
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

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewedBy: ViewedByUser[];
  viewCount: number;
}

const ViewDetailsModal = ({
  isOpen,
  onClose,
  viewedBy,
  viewCount,
}: ViewDetailsModalProps) => {
  const { user } = useAuth();

  // ✅ _id এর বদলে id
  const currentUserId = user?.id ?? "";
  const currentUserIsStudent = (user?.role ?? "student") === "student";

  const safeViewedBy = Array.isArray(viewedBy)
    ? viewedBy.filter(
        (v) => v?.userId && typeof v.userId === "object" && v.userId.name,
      )
    : [];

  // ✅ count সহ unique users
  const uniqueUsers = safeViewedBy.reduce<(ViewedByUser & { count: number })[]>(
    (acc, cur) => {
      const existing = acc.findIndex((v) => v.userId._id === cur.userId._id);
      if (existing === -1) {
        acc.push({ ...cur, count: 1 });
      } else {
        acc[existing].count += 1;
        if (new Date(cur.viewedAt) > new Date(acc[existing].viewedAt)) {
          acc[existing].viewedAt = cur.viewedAt;
        }
      }
      return acc;
    },
    [],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4 bangla"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--color-bg)] shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[var(--color-active-border)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-active-border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  কে কে দেখেছেন
                </h3>
                <p className="text-xs text-[var(--color-gray)] mt-0.5">
                  মোট {toBn(viewCount)} বার দেখা হয়েছে
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-red-600 text-white transition-colors"
              >
                <X className="w-4 h-4 text-[var(--color-gray)]" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-3">
              {uniqueUsers.length > 0 ? (
                <div className="space-y-1">
                  {uniqueUsers.map((view, index) => {
                    const isStaff = isStaffRole(view.userId.role);
                    const isOwnEntry = view.userId._id === currentUserId;

                    const showAvatar =
                      isStaff || isOwnEntry || !currentUserIsStudent;

                    return (
                      <motion.div
                        key={view.userId._id || index}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-active-bg)] transition-colors"
                      >
                        {/* Avatar */}
                        {showAvatar && view.userId.avatar?.url ? (
                          <img
                            src={view.userId.avatar.url}
                            alt={view.userId.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--color-active-border)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[var(--color-active-bg)] border border-[var(--color-active-border)] flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-[var(--color-gray)]" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[var(--color-text)] truncate">
                            {view.userId.name}
                          </p>
                          <p className="text-xs text-[var(--color-gray)] mt-0.5">
                            {isStaff
                              ? (ROLE_LABELS[view.userId.role!] ??
                                view.userId.role)
                              : view.userId.studentClass
                                ? `শ্রেণি: ${view.userId.studentClass}${
                                    view.userId.roll
                                      ? ` • রোল: ${toBn(view.userId.roll)}`
                                      : ""
                                  }`
                                : "—"}
                          </p>
                        </div>

                        {/* Date */}
                        {/* Date + Count */}
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[10px] text-[var(--color-gray)]">
                            {new Date(view.viewedAt).toLocaleDateString(
                              "bn-BD",
                            )}
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--color-gray)]">
                            {toBn(view.count)} বার
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <p className="text-4xl mb-3">👀</p>
                  <p className="text-sm text-[var(--color-gray)]">
                    এখনো কেউ দেখেনি
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewDetailsModal;
