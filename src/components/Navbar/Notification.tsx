// Notification.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import Swal from "sweetalert2";
import { createRoot, type Root } from "react-dom/client";
import axiosPublic from "../../hooks/axiosPublic";
import NoticeModal, { type NoticeItem } from "../../pages/Notice/NoticeModal";
import toast from "react-hot-toast";

const SEEN_KEY = "navbar_seen_notice_ids";

const getSeenIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
};

const saveSeenIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to save seen notices",
    );
  }
};

// ── Variants ───────────────────────────────────────────────────────────────

const popupVariants = {
  hidden: { opacity: 0, scale: 0.88, y: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 420,
      damping: 28,
      mass: 0.7,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: -12,
    transition: { duration: 0.18, ease: "easeIn" as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      type: "spring" as const,
      stiffness: 380,
      damping: 26,
    },
  }),
};

// ── Red Close Button (for Swal) ────────────────────────────────────────────

const SwalCloseButton = ({ onClose }: { onClose: () => void }) => (
  <motion.button
    onClick={onClose}
    title="বন্ধ করুন"
    initial={{ scale: 0, rotate: -90 }}
    animate={{ scale: 1, rotate: 0 }}
    exit={{ scale: 0, rotate: 90 }}
    whileHover={{ scale: 1.15, rotate: 10 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: "spring", stiffness: 500, damping: 22 }}
    className="inline-flex items-center justify-center w-8 h-8 rounded-full border-none text-white cursor-pointer"
    style={{
      background: "linear-gradient(135deg, #ff4d4d, #c0392b)",
      boxShadow: "0 2px 10px rgba(192,57,43,0.5)",
    }}
  >
    <X size={15} strokeWidth={2.5} />
  </motion.button>
);

// ── Notification ───────────────────────────────────────────────────────────

const Notification = () => {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(getSeenIds);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  const popupRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const seenIdsRef = useRef(seenIds);
  const activeNoticesRef = useRef<NoticeItem[]>([]);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);
  const setSelectedRef = useRef(setSelectedNotice);
  const swalCloseBtnRootRef = useRef<Root | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  seenIdsRef.current = seenIds;
  navigateRef.current = navigate;
  setSelectedRef.current = setSelectedNotice;

  const { data: notices = [] } = useQuery<NoticeItem[]>({
    queryKey: ["notices"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/notices");
      return res.data.data as NoticeItem[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const activeNotices = useMemo(() => {
    const result = notices.slice().reverse().slice(0, 5);
    activeNoticesRef.current = result;
    return result;
  }, [notices]);

  const unseenCount = useMemo(
    () => activeNotices.filter((n) => !seenIds.has(n._id)).length,
    [activeNotices, seenIds],
  );

  // Mark all as seen when on /notice page
  useEffect(() => {
    if (location.pathname !== "/notice" || !notices.length) return;
    const updated = new Set(seenIdsRef.current);
    notices.forEach((n) => updated.add(n._id));
    saveSeenIds(updated);
    setSeenIds(updated);
  }, [location.pathname, notices]);

  // Mark visible notices as seen when popup opens
  useEffect(() => {
    if (!open || !activeNoticesRef.current.length) return;
    const updated = new Set(seenIdsRef.current);
    activeNoticesRef.current.forEach((n) => updated.add(n._id));
    saveSeenIds(updated);
    setSeenIds(updated);
  }, [open]);

  // Close popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── SweetAlert2 (mobile) ─────────────────────────────────────── */
  const buildSwalHTML = (notices: NoticeItem[], seenSet: Set<string>) => {
    if (!notices.length) {
      return `<p class="bangla text-center py-8 text-sm text-[var(--color-gray)]">কোনো নোটিশ নেই</p>`;
    }

    const rows = notices
      .map((n) => {
        const isSeen = seenSet.has(n._id);
        const isActive = new Date(n.expiresAt) > new Date();

        const dot = isSeen
          ? `<span class="block w-2 h-2 rounded-full bg-[var(--color-gray)] opacity-40 mt-1.5 shrink-0"></span>`
          : `<span class="block w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse"></span>`;

        const badge = isActive
          ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[rgba(16,185,129,0.3)]  ">সক্রিয়</span>`
          : `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[rgba(239,68,68,0.10)] text-[#f87171] border-[rgba(239,68,68,0.25)]">মেয়াদ শেষ</span>`;

        const dateStr = new Date(n.expiresAt).toLocaleDateString("bn-BD", {
          day: "numeric",
          month: "short",
        });

        return `
          <button
            data-notice-id="${n._id}"
            class="bangla w-full flex items-start gap-3 px-4 py-3.5 text-left bg-transparent border-none border-b border-[var(--color-active-border)] cursor-pointer transition-all duration-200 hover:bg-[var(--color-active-bg)] hover:pl-5 rounded-2xl"
          >
            ${dot}
            <div class="flex-1 min-w-0">
              <p class="text-[13px] leading-relaxed text-[var(--color-text)] line-clamp-2 m-0 mb-1.5">${n.notice}</p>
              <div class="flex items-center gap-1.5 flex-wrap">${badge}<span class="text-[11px] text-[var(--color-gray)]">${dateStr}</span></div>
            </div>
            <span class="text-xs text-[var(--color-gray)] mt-0.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>`;
      })
      .join("");

    return `
      <div id="swal-close-btn" class="absolute top-3 right-3 z-10"></div>
      <div class="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-active-border)]">
        <span class="bangla font-semibold text-sm text-[var(--color-text)]">নোটিশ</span>
        <span class="bangla text-xs text-[var(--color-gray)] mr-8">সর্বশেষ ৫টি</span>
      </div>
      <div id="swal-notice-list" class="divide-y divide-[var(--color-active-border)] p-2 flex flex-col gap-1">${rows}</div>
      <div class="px-3 py-3">
        <button id="swal-show-more" class="bangla w-full py-2.5 text-sm font-medium rounded-2xl bg-[var(--color-active-bg)] text-[var(--color-active-text)] border border-[var(--color-active-border)] hover:opacity-80 transition-opacity cursor-pointer">
          সব নোটিশ দেখুন →
        </button>
      </div>`;
  };

  const showSwal = () => {
    const html = buildSwalHTML(activeNoticesRef.current, seenIdsRef.current);

    Swal.fire({
      html,
      showConfirmButton: false,
      showCloseButton: false,
      padding: "0",
      width: "100%",
      grow: "row",
      position: "top",
      backdrop: "rgba(0,0,0,0.4)",
      background: "var(--color-bg)",
      color: "var(--color-text)",
      customClass: {
        popup:
          "!rounded-none sm:!rounded-3xl !w-full !max-w-full !mt-14 !shadow-2xl",
        htmlContainer: "!p-0 !m-0 !text-left",
      },
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        // Mount red close button
        const closeMount = document.getElementById("swal-close-btn");
        if (closeMount) {
          swalCloseBtnRootRef.current = createRoot(closeMount);
          swalCloseBtnRootRef.current.render(
            <SwalCloseButton onClose={() => Swal.close()} />,
          );
        }

        document
          .querySelectorAll<HTMLButtonElement>("[data-notice-id]")
          .forEach((btn) => {
            btn.addEventListener("click", () => {
              const id = btn.dataset.noticeId;
              const found = activeNoticesRef.current.find((n) => n._id === id);
              if (!found) return;
              Swal.close();
              setTimeout(() => setSelectedRef.current(found), 200);
            });
          });

        document
          .getElementById("swal-show-more")
          ?.addEventListener("click", () => {
            Swal.close();
            navigateRef.current?.("/notice");
          });
      },
      didClose: () => {
        swalCloseBtnRootRef.current?.unmount();
        swalCloseBtnRootRef.current = null;
      },
    });
  };

  const handleBellClick = () => {
    if (window.innerWidth < 768) {
      showSwal();
    } else {
      setOpen((v) => !v);
    }
  };

  const handleNoticeClick = (notice: NoticeItem) => {
    setOpen(false);
    setTimeout(() => setSelectedNotice(notice), 180);
  };

  const handleShowMore = () => {
    setOpen(false);
    navigate("/notice");
  };

  return (
    <>
      <div className="relative">
        {/* ── Bell button ── */}
        <motion.button
          ref={btnRef}
          onClick={handleBellClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative flex items-center justify-center w-9 h-9 rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] cursor-pointer"
          aria-label="নোটিশ"
        >
          <motion.div
            animate={
              unseenCount > 0
                ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] }
                : { rotate: 0 }
            }
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              repeat: unseenCount > 0 ? Infinity : 0,
              repeatDelay: 3.5,
            }}
          >
            <Bell size={18} className="text-[var(--color-active-text)] " />
          </motion.div>

          <AnimatePresence>
            {unseenCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0, y: 4 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 4 }}
                transition={{ type: "spring", stiffness: 520, damping: 22 }}
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-medium px-1 pointer-events-none select-none shadow-md"
              >
                {unseenCount > 9 ? "9+" : unseenCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* ── Desktop popup ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popupRef}
              key="popup"
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ originX: 1, originY: 0 }}
              className="absolute top-12 right-0 w-80 rounded-3xl border border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-2xl overflow-hidden z-[999]"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.2 }}
                className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-active-border)]"
              >
                <span className="bangla font-semibold text-sm text-[var(--color-text)]">
                  নোটিশ
                </span>
                <div className="flex items-center gap-2">
                  <span className="bangla text-xs text-[var(--color-gray)]">
                    সর্বশেষ ৫টি
                  </span>
                  {/* Red close button */}
                  <motion.button
                    onClick={() => setOpen(false)}
                    title="বন্ধ করুন"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 22,
                      delay: 0.1,
                    }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full border-none text-white cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #ff4d4d, #c0392b)",
                      boxShadow: "0 2px 8px rgba(192,57,43,0.45)",
                    }}
                  >
                    <X size={13} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </motion.div>

              {/* List */}
              <div className="p-2 flex flex-col gap-1">
                {activeNotices.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bangla text-center py-8 text-sm text-[var(--color-gray)]"
                  >
                    কোনো নোটিশ নেই
                  </motion.p>
                ) : (
                  activeNotices.map((notice, i) => {
                    const isSeen = seenIds.has(notice._id);
                    const isActive = new Date(notice.expiresAt) > new Date();
                    return (
                      <motion.button
                        key={notice._id}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{
                          backgroundColor: "var(--color-active-bg)",
                          x: 3,
                          transition: { duration: 0.15 },
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleNoticeClick(notice)}
                        className="w-full flex items-start gap-3 px-3.5 py-3 text-left cursor-pointer rounded-2xl bg-transparent border-none transition-colors"
                      >
                        <span className="mt-[7px] shrink-0">
                          <motion.span
                            className={`block w-2 h-2 rounded-full ${
                              isSeen
                                ? "bg-[var(--color-gray)] opacity-40"
                                : "bg-red-500"
                            }`}
                            initial={!isSeen ? { scale: 0 } : {}}
                            animate={
                              !isSeen
                                ? {
                                    scale: [0, 1.4, 1],
                                    boxShadow: [
                                      "0 0 0px rgba(239,68,68,0)",
                                      "0 0 8px rgba(239,68,68,0.7)",
                                      "0 0 4px rgba(239,68,68,0.4)",
                                    ],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.45, delay: i * 0.06 }}
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="bangla text-[13px] leading-relaxed text-[var(--color-text)] line-clamp-2 m-0 mb-1.5">
                            {notice.notice}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isActive
                                  ? "bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[rgba(16,185,129,0.3)]"
                                  : "bg-[rgba(239,68,68,0.10)] text-[#f87171] border-[rgba(239,68,68,0.25)]"
                              }`}
                            >
                              {isActive ? "সক্রিয়" : "মেয়াদ শেষ"}
                            </span>
                            <span className="bangla text-[11px] text-[var(--color-gray)]">
                              {new Date(notice.expiresAt).toLocaleDateString(
                                "bn-BD",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          </div>
                        </div>
                        <motion.span
                          className="text-xs text-[var(--color-gray)] mt-1 shrink-0"
                          animate={{ x: [0, 3, 0] }}
                          transition={{
                            delay: i * 0.06 + 0.3,
                            duration: 0.5,
                            ease: "easeInOut",
                          }}
                        >
                          →
                        </motion.span>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
                className="px-3 pb-3 border-t border-[var(--color-active-border)] pt-2"
              >
                <motion.button
                  onClick={handleShowMore}
                  whileHover={{ scale: 1.02, opacity: 0.85 }}
                  whileTap={{ scale: 0.97 }}
                  className="bangla w-full py-2.5 text-sm font-medium rounded-2xl bg-[var(--color-active-bg)] text-[var(--color-active-text)] border border-[var(--color-active-border)] cursor-pointer transition-opacity"
                >
                  সব নোটিশ দেখুন →
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NoticeModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </>
  );
};

export { Notification };
