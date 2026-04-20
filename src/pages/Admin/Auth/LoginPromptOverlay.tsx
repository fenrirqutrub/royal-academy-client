import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Key, UserPlus, X } from "lucide-react";
import type { LoginPromptOverlayProps } from "../../../types/types";

const LoginPromptOverlay = ({ isOpen, onClose }: LoginPromptOverlayProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-bg)] shadow-2xl overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-[var(--color-text-hover)] to-blue-500" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-gray)] hover:text-[var(--color-text)] transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center px-8 py-10 text-center bangla">
              {/* Icon */}
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-active-bg)] border border-[var(--color-active-border)]">
                <Key className="h-7 w-7 text-[var(--color-text-hover)]" />
              </div>

              <h3 className="mb-2 text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">
                লগইন প্রেয়াজন
              </h3>

              <p className="mb-8 text-sm leading-relaxed text-[var(--color-gray)] max-w-[240px]">
                বিস্তারিত দেখতে এবং সকল ফিচার ব্যবহার করতে লগইন করুন
              </p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[var(--color-text)] px-5 py-3 text-sm font-bold text-[var(--color-bg)] transition-opacity hover:opacity-90"
                >
                  <Key className="h-4 w-4 shrink-0" />
                  লগইন করুন
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-5 py-3 text-sm font-bold text-[var(--color-text)] transition-colors hover:opacity-80"
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  নতুন আকাউন্ট খুলুন
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginPromptOverlay;
