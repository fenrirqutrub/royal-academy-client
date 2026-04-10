// src/components/common/EmptyState.tsx
//
// Usage:
//   <EmptyState message="কোনো শিক্ষক পাওয়া যায়নি" />
//   <EmptyState query={search} />   ← auto message: "রহিম" দিয়ে কিছু পাওয়া যায়নি
//   <EmptyState title="খালি" message="কিছু নেই" icon={<Bell className="w-10 h-10" />} />

import { motion } from "framer-motion";
import { IoSearch } from "react-icons/io5";

interface EmptyStateProps {
  query?: string;
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

const EmptyState = ({
  query,
  icon,
  title = "কোনো ফলাফল পাওয়া যায়নি",
  message,
  action,
}: EmptyStateProps) => {
  const autoMessage = query
    ? `"${query}" দিয়ে কোনো ফলাফল পাওয়া যায়নি।`
    : "এখানে দেখানোর মতো কিছু নেই।";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="col-span-full text-center py-12 sm:py-20"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="inline-block"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center bg-[var(--color-active-bg)] border border-[var(--color-active-border)]">
          {icon ?? (
            <IoSearch className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-gray)]" />
          )}
        </div>
      </motion.div>

      <h3 className="text-xl sm:text-2xl font-bold bangla text-[var(--color-text)] mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base bangla text-[var(--color-gray)] px-4">
        {message ?? autoMessage}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
