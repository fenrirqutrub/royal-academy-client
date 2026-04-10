// src/pages/Admin/Management/ManageNotice.tsx
//
// Loading  → <Skeleton variant="notice" count={6} />
// Error    → <ErrorState message="..." />
// Empty    → <EmptyState ... />

import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosPublic from "../../../hooks/axiosPublic";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import EmptyState from "../../../components/common/Emptystate";

interface NoticeItem {
  _id: string;
  noticeSlug: string;
  notice: string;
  expiresAt: string;
  createdAt: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const isExpired = (iso: string) => new Date(iso) < new Date();

const ManageNotice = () => {
  const queryClient = useQueryClient();

  const {
    data: notices = [],
    isLoading,
    isError,
  } = useQuery<NoticeItem[]>({
    queryKey: ["notices"],
    queryFn: async () =>
      (await axiosPublic.get("/api/notices")).data.data as NoticeItem[],
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => axiosPublic.delete(`/api/notices/${slug}`),
    onSuccess: () => {
      toast.success("নোটিশ মুছে ফেলা হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["active-notice"] });
    },
    onError: () => toast.error("মুছতে ব্যর্থ হয়েছে"),
  });

  const activeCount = notices.filter((n) => !isExpired(n.expiresAt)).length;
  const expiredCount = notices.filter((n) => isExpired(n.expiresAt)).length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div
        className="min-h-screen bangla w-full px-4 sm:px-8 py-10"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <Skeleton variant="notice" count={6} />
      </div>
    );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError)
    return (
      <div
        className="min-h-screen bangla flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <ErrorState message="ডেটা লোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।" />
      </div>
    );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bangla w-full px-4 sm:px-8 py-10"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-1 h-9 rounded-full"
            style={{ backgroundColor: "var(--color-text)" }}
          />
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            নোটিশ ম্যানেজ করুন
          </h1>
        </div>
        <p
          className="ml-4 pl-3 text-base sm:text-lg"
          style={{ color: "var(--color-gray)" }}
        >
          প্রকাশিত সকল নোটিশ দেখুন এবং পরিচালনা করুন
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {[
          {
            label: "মোট নোটিশ",
            value: notices.length,
            bg: "var(--color-active-bg)",
            border: "var(--color-active-border)",
            valueColor: "var(--color-text)",
            dot: "var(--color-text)",
          },
          {
            label: "সক্রিয়",
            value: activeCount,
            bg: "rgba(16,185,129,0.08)",
            border: "rgba(16,185,129,0.25)",
            valueColor: "#34d399",
            dot: "#34d399",
          },
          {
            label: "মেয়াদোত্তীর্ণ",
            value: expiredCount,
            bg: "var(--color-active-bg)",
            border: "var(--color-active-border)",
            valueColor: "var(--color-gray)",
            dot: "var(--color-gray)",
          },
        ].map(({ label, value, bg, border, valueColor, dot }) => (
          <div
            key={label}
            className="rounded-2xl p-4 sm:p-5 flex items-center gap-3"
            style={{ backgroundColor: bg, border: `1px solid ${border}` }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: dot }}
            />
            <div>
              <p
                className="text-xl sm:text-2xl font-bold leading-none"
                style={{ color: valueColor }}
              >
                {value}
              </p>
              <p
                className="text-xs sm:text-sm mt-1"
                style={{ color: "var(--color-gray)" }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Empty state — EmptyState দিয়ে */}
      {notices.length === 0 ? (
        <EmptyState
          title="কোনো নোটিশ নেই"
          message="এখনো কোনো নোটিশ প্রকাশিত হয়নি।"
        />
      ) : (
        <>
          <p
            className="text-sm sm:text-base mb-5"
            style={{ color: "var(--color-gray)" }}
          >
            {notices.length}টি নোটিশ
          </p>

          <motion.ul className="space-y-4">
            <AnimatePresence initial={false}>
              {notices.map((item, i) => {
                const expired = isExpired(item.expiresAt);
                return (
                  <motion.li
                    key={item._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="w-full rounded-2xl px-5 sm:px-7 py-5 sm:py-6 flex items-start gap-4 sm:gap-5 group transition-all"
                    style={{
                      backgroundColor: "var(--color-active-bg)",
                      border: "1px solid var(--color-active-border)",
                      opacity: expired ? 0.55 : 1,
                    }}
                  >
                    <div className="w-1 self-stretch rounded-full shrink-0 bg-[var(--color-active-border)]" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold tracking-widest font-mono text-[var(--color-gray)]">
                          {item.noticeSlug}
                        </span>
                        {expired ? (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full tracking-wider font-semibold"
                            style={{
                              backgroundColor: "var(--color-bg)",
                              color: "var(--color-gray)",
                              border: "1px solid var(--color-active-border)",
                            }}
                          >
                            মেয়াদোত্তীর্ণ
                          </span>
                        ) : (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full tracking-wider font-semibold"
                            style={{
                              backgroundColor: "rgba(16,185,129,0.12)",
                              color: "#34d399",
                              border: "1px solid rgba(16,185,129,0.25)",
                            }}
                          >
                            সক্রিয়
                          </span>
                        )}
                      </div>

                      <p
                        className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words"
                        style={{ color: "var(--color-text)" }}
                      >
                        {item.notice}
                      </p>

                      <div
                        className="flex items-center gap-3 mt-3 flex-wrap pt-3"
                        style={{
                          borderTop: "1px solid var(--color-active-border)",
                        }}
                      >
                        <span
                          className="text-xs sm:text-sm"
                          style={{ color: "var(--color-gray)" }}
                        >
                          তৈরি: {formatDate(item.createdAt)}
                        </span>
                        <span style={{ color: "var(--color-active-border)" }}>
                          ·
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--color-gray)]">
                          মেয়াদ শেষ: {formatDate(item.expiresAt)}
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteMutation.mutate(item.noticeSlug)}
                      disabled={deleteMutation.isPending}
                      title="নোটিশ মুছুন"
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#f87171",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(239,68,68,0.18)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(239,68,68,0.08)")
                      }
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </motion.button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </>
      )}
    </div>
  );
};

export default ManageNotice;
