// src/components/common/GalleryControlsBar.tsx
//
// ManagePhotos + ManageHero দুই জায়গায় এই block duplicate ছিল।
// accentColor="emerald" → ManagePhotos
// accentColor="indigo"  → ManageHero

import { motion, AnimatePresence } from "framer-motion";
import { IoGridOutline, IoListOutline, IoTrashOutline } from "react-icons/io5";
import SearchBar from "./Searchbar";

export type ViewMode = "grid" | "list";
export type AccentColor = "emerald" | "indigo" | "violet";

export interface SortSelectOption {
  value: string;
  label: string;
}

interface Props {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  sortValue: string;
  onSortChange: (v: string) => void;
  sortOptions: SortSelectOption[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isSelectionMode: boolean;
  onSelectionModeToggle: () => void;
  selectionCount: number;
  pageItemCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  isBatchDeleting?: boolean;
  accentColor?: AccentColor;
}

const ACCENT: Record<AccentColor, { selectAll: string; ring: string }> = {
  emerald: {
    selectAll: "bg-emerald-600 hover:bg-emerald-500",
    ring: "focus:ring-emerald-500",
  },
  indigo: {
    selectAll: "bg-indigo-600  hover:bg-indigo-500",
    ring: "focus:ring-indigo-500",
  },
  violet: {
    selectAll: "bg-violet-600  hover:bg-violet-500",
    ring: "focus:ring-violet-500",
  },
};

const GalleryControlsBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchLabel = "Search",
  sortValue,
  onSortChange,
  sortOptions,
  viewMode,
  onViewModeChange,
  isSelectionMode,
  onSelectionModeToggle,
  selectionCount,
  pageItemCount,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  isBatchDeleting = false,
  accentColor = "emerald",
}: Props) => {
  const ac = ACCENT[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-[#1A1B23] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          label={searchLabel}
        />

        <div className="flex flex-row justify-between items-center gap-3">
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className={`px-4 py-3 bg-zinc-100 dark:bg-[#0C0D12] border border-zinc-200 dark:border-zinc-800 rounded-xl text-[#0C0D12] dark:text-white focus:outline-none focus:ring-2 ${ac.ring} transition-all cursor-pointer font-medium`}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#0C0D12] p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`p-2.5 rounded-lg transition-all ${viewMode === mode ? "bg-[#0C0D12] dark:bg-white text-white dark:text-[#0C0D12] shadow-md" : "text-zinc-500 hover:text-[#0C0D12] dark:hover:text-white"}`}
              >
                {mode === "grid" ? (
                  <IoGridOutline size={20} />
                ) : (
                  <IoListOutline size={20} />
                )}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectionModeToggle}
          className={`px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap shadow-sm ${
            isSelectionMode
              ? "bg-purple-600 text-white hover:bg-purple-500"
              : "bg-zinc-100 dark:bg-[#0C0D12] text-[#0C0D12] dark:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-900"
          }`}
        >
          {isSelectionMode ? "Exit Select" : "Select Mode"}
        </motion.button>
      </div>

      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSelectAll}
              className={`px-5 py-2.5 ${ac.selectAll} text-white rounded-xl text-sm font-semibold transition-colors shadow-sm`}
            >
              Select All ({pageItemCount})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClearSelection}
              disabled={selectionCount === 0}
              className="px-5 py-2.5 bg-zinc-600 hover:bg-zinc-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Clear Selection
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBatchDelete}
              disabled={selectionCount === 0 || isBatchDeleting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <IoTrashOutline size={16} /> Delete Selected ({selectionCount})
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GalleryControlsBar;
