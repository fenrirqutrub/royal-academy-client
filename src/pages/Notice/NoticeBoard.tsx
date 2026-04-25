// NoticeBoard.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router";
import axiosPublic from "../../hooks/axiosPublic";
import NoticeModal, { type NoticeItem } from "./NoticeModal";
import { Pagination } from "../../components/common/Pagination";
import { toBn } from "../../utility/Formatters";
import ErrorState from "../../components/common/ErrorState";
import Skeleton from "../../components/common/Skeleton";
import EmptyState from "../../components/common/Emptystate";
import NoticeTabs from "../../components/common/NoticeTabs";
import Routine from "../Routine/Routine";
import ExamMarks from "../ExamMarks/ExamMarks";

const HOME_LIMIT = 5;
const PAGE_LIMIT = 10;

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const isStillActive = (expiresAt: string) => new Date(expiresAt) > new Date();

// ── Notice Row ─────────────────────────────────────────────
const NoticeRow = ({
  item,
  index,
  onClick,
}: {
  item: NoticeItem;
  index: number;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const active = isStillActive(item.expiresAt);

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.07,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.button
        onClick={onClick}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileTap={{ scale: 0.99 }}
        className="w-full text-left relative overflow-hidden outline-none bg-transparent border-none"
      >
        {/* Hover fill */}
        <motion.div
          initial={false}
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 rounded-xl origin-left bg-[var(--color-active-bg)]"
        />

        <div className="relative flex items-center gap-5 px-4 py-4 sm:py-5 border-b border-[var(--color-active-border)]">
          {/* Index */}
          <motion.span
            animate={{
              color: hovered ? "var(--color-text)" : "var(--color-gray)",
              scale: hovered ? 1.15 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="w-7 shrink-0 text-lg md:text-xl font-bold tabular-nums bangla select-none"
          >
            {toBn(String(index + 1).padStart(2, "0"))}
          </motion.span>

          {/* Notice text */}
          <motion.p
            animate={{ x: hovered ? 4 : 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-w-0 text-lg md:text-xl font-medium leading-snug truncate text-[var(--color-text)] bangla"
          >
            {item.notice}
          </motion.p>

          {/* Status */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0.55 }}
            transition={{ duration: 0.2 }}
            className="hidden sm:flex items-center gap-2 shrink-0"
          >
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border
              ${
                active
                  ? "bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[rgba(16,185,129,0.3)]"
                  : "bg-[rgba(239,68,68,0.10)] text-[#f87171] border-[rgba(239,68,68,0.25)]"
              }`}
            >
              {active ? "সক্রিয়" : "মেয়াদ শেষ"}
            </span>

            <span className="text-xs tabular-nums text-[var(--color-gray)]">
              {fmt(item.expiresAt)}
            </span>
          </motion.div>

          {/* Arrow */}
          <motion.span
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-bold text-[var(--color-text)] shrink-0"
          >
            →
          </motion.span>
        </div>
      </motion.button>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────
const NoticeBoard = () => {
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTabId, setActiveTabId] = useState("notice");

  const location = useLocation();
  const navigate = useNavigate();
  const isNoticePage = location.pathname === "/notice";

  const {
    data: notices,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/notices");
      return res.data.data as NoticeItem[];
    },
  });

  const totalPages = useMemo(
    () => Math.ceil((notices?.length ?? 0) / PAGE_LIMIT),
    [notices],
  );

  const visibleNotices = useMemo(() => {
    if (!notices) return [];
    if (!isNoticePage) return notices.slice(0, HOME_LIMIT);
    const start = (currentPage - 1) * PAGE_LIMIT;
    return notices.slice(start, start + PAGE_LIMIT);
  }, [notices, isNoticePage, currentPage]);

  const hasMore = !isNoticePage && (notices?.length ?? 0) > HOME_LIMIT;

  const renderContent = () => {
    if (activeTabId === "routine") return <Routine />;
    if (activeTabId === "marks") return <ExamMarks />;
    return null;
  };

  refetch();

  return (
    <div className="pt-3 bg-[var(--color-bg)] text-[var(--color-text)] relative">
      <div className="w-full mx-auto relative">
        {/* Content */}
        {isLoading ? (
          <Skeleton variant="notice" count={3} />
        ) : isError ? (
          <ErrorState message="Could not fetch notices. Please try again later." />
        ) : !notices?.length ? (
          <EmptyState
            title="No notices yet"
            message="No notices have been published yet."
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header Row */}
            <div className="flex items-center gap-5 px-4 py-3 mb-4 rounded-lg border bg-[var(--color-active-bg)] border-[var(--color-active-border)] text-xl bangla">
              <span className="w-7 opacity-[0.05] text-lg">নং</span>
              <span className="flex-1 flex justify-center">
                {isNoticePage ? (
                  <NoticeTabs
                    activeId={activeTabId}
                    onChange={setActiveTabId}
                  />
                ) : (
                  <span className="opacity-50">নোটিশ</span>
                )}
              </span>
              <span className="hidden sm:block opacity-50">মেয়াদ</span>
              <span className="w-5" />
            </div>

            {isNoticePage && activeTabId !== "notice" ? (
              <motion.div
                key={activeTabId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderContent()}
              </motion.div>
            ) : (
              <div>
                {/* Notice Rows */}
                <AnimatePresence>
                  {visibleNotices.map((item, i) => (
                    <NoticeRow
                      key={item._id}
                      item={item}
                      index={
                        isNoticePage ? (currentPage - 1) * PAGE_LIMIT + i : i
                      }
                      onClick={() => setSelectedNotice(item)}
                    />
                  ))}
                </AnimatePresence>

                {/* Show More */}
                {hasMore && (
                  <div className="mt-6 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate("/notice")}
                      className="px-6 py-2.5 text-sm font-semibold rounded-xl border bg-[var(--color-active-bg)] border-[var(--color-active-border)]"
                    >
                      আরও দেখুন →
                    </motion.button>
                  </div>
                )}

                {/* Pagination */}
                {isNoticePage && totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <NoticeModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </div>
  );
};

export default NoticeBoard;
