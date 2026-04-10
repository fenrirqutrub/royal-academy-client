// src/pages/Admin/Management/ManageHero.tsx
//
// Loading  → <Skeleton variant="picture" count={8} />
// Error    → <ErrorState message="..." />
// Empty    → <EmptyState ... />
// Controls → <GalleryControlsBar accentColor="indigo" />

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoTrashOutline,
  IoCalendarOutline,
  IoCheckmarkCircle,
  IoImageOutline,
} from "react-icons/io5";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Pagination } from "../../../components/common/Pagination";
import axiosPublic from "../../../hooks/axiosPublic";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import EmptyState from "../../../components/common/Emptystate";
import GalleryControlsBar from "../../../components/common/GalleryControlsBar";
import type { SortSelectOption } from "../../../components/common/GalleryControlsBar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Hero {
  _id: string;
  title: string;
  uniqueID: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt: string;
  updatedAt: string;
}
interface HeroesResponse {
  success: boolean;
  count: number;
  data: Hero[];
}
interface ApiError {
  response?: { data?: { message?: string } };
}
type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS: SortSelectOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
];

const SWAL_BASE = {
  background: "#0C0D12",
  color: "#FFFFFF",
  iconColor: "#F59E0B",
  showCancelButton: true,
  confirmButtonColor: "#EF4444",
  cancelButtonColor: "#52525B",
  cancelButtonText: "Cancel",
};

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchHeroes = async (): Promise<Hero[]> =>
  (await axiosPublic.get<HeroesResponse>("/api/heroes")).data.data;

const deleteHero = async (id: string) =>
  axiosPublic.delete(`/api/heroes/${id}`);
const deleteBatchHeroes = async (ids: string[]) =>
  Promise.all(ids.map((id) => axiosPublic.delete(`/api/heroes/${id}`)));

const formatDate = (date: string) => {
  const diff = Math.ceil(
    Math.abs(Date.now() - new Date(date).getTime()) / 86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManageHero() {
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedHeroes, setSelectedHeroes] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: heroes = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["heroes-admin"],
    queryFn: fetchHeroes,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const toastStyle = (border: string) => ({
    style: {
      background: "#0C0D12",
      color: "#FFFFFF",
      border: `1px solid ${border}`,
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteHero,
    onSuccess: () => {
      toast.success("Hero deleted successfully", {
        icon: "✨",
        ...toastStyle("#2D2E37"),
      });
      qc.invalidateQueries({ queryKey: ["heroes-admin"] });
      qc.invalidateQueries({ queryKey: ["heroes"] });
    },
    onError: (e: ApiError) =>
      toast.error(
        e?.response?.data?.message || "Failed to delete hero",
        toastStyle("#EF4444"),
      ),
  });

  const batchDeleteMut = useMutation({
    mutationFn: deleteBatchHeroes,
    onSuccess: () => {
      toast.success(`${selectedHeroes.size} heroes deleted`, {
        icon: "🎉",
        ...toastStyle("#2D2E37"),
      });
      setSelectedHeroes(new Set());
      setIsSelectionMode(false);
      qc.invalidateQueries({ queryKey: ["heroes-admin"] });
      qc.invalidateQueries({ queryKey: ["heroes"] });
    },
    onError: (e: ApiError) =>
      toast.error(
        e?.response?.data?.message || "Failed to delete heroes",
        toastStyle("#EF4444"),
      ),
  });

  const processedHeroes = useMemo(() => {
    const filtered = searchQuery
      ? heroes.filter(
          (h) =>
            h.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.uniqueID.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h._id.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [...heroes];

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }, [heroes, searchQuery, sortBy]);

  const totalPages = Math.ceil(processedHeroes.length / ITEMS_PER_PAGE);
  const paginatedHeroes = useMemo(
    () =>
      processedHeroes.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [processedHeroes, currentPage],
  );

  const toggleHero = (id: string) => {
    const n = new Set(selectedHeroes);
    if (n.has(id)) {
      n.delete(id);
    } else {
      n.add(id);
    }
    setSelectedHeroes(n);
  };
  const selectAll = () =>
    setSelectedHeroes(new Set(paginatedHeroes.map((h) => h._id)));
  const clearSelection = () => setSelectedHeroes(new Set());

  const confirmDelete = (id: string) =>
    Swal.fire({
      ...SWAL_BASE,
      title: "Delete Hero?",
      text: "This action cannot be undone",
      icon: "warning",
      confirmButtonText: "Delete",
    }).then((r) => r.isConfirmed && deleteMut.mutate(id));

  const confirmBatchDelete = () =>
    Swal.fire({
      ...SWAL_BASE,
      title: `Delete ${selectedHeroes.size} Heroes?`,
      text: "This action cannot be undone",
      icon: "warning",
      confirmButtonText: `Delete ${selectedHeroes.size} Heroes`,
    }).then(
      (r) => r.isConfirmed && batchDeleteMut.mutate(Array.from(selectedHeroes)),
    );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isPending)
    return (
      <div className="min-h-screen bg-[#E9EBED] dark:bg-[#0C0D12] px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton variant="picture" count={8} height="180px" />
      </div>
    );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError)
    return (
      <div className="min-h-screen bg-[#E9EBED] dark:bg-[#0C0D12] flex items-center justify-center">
        <div className="text-center">
          <ErrorState message="Hero images লোড করতে ব্যর্থ হয়েছে।" />
          <button
            onClick={() => refetch()}
            className="mt-2 px-6 py-3 bg-[#0C0D12] dark:bg-white text-white dark:text-[#0C0D12] font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#E9EBED] dark:bg-[#0C0D12] transition-colors duration-300">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0C0D12] dark:text-[#FFFFFF] mb-3 tracking-tight"
            >
              Hero Images
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg"
            >
              Manage your hero slider images • Total: {heroes.length}
            </motion.p>
          </div>

          {/* Controls Bar */}
          <GalleryControlsBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search heroes by title, ID or uniqueID..."
            searchLabel="Search Heroes"
            sortValue={sortBy}
            onSortChange={(v) => setSortBy(v as SortOption)}
            sortOptions={SORT_OPTIONS}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onSelectionModeToggle={() => {
              setIsSelectionMode((v) => !v);
              if (isSelectionMode) clearSelection();
            }}
            selectionCount={selectedHeroes.size}
            pageItemCount={paginatedHeroes.length}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onBatchDelete={confirmBatchDelete}
            isBatchDeleting={batchDeleteMut.isPending}
            accentColor="indigo"
          />
        </motion.div>

        {/* Empty state */}
        {processedHeroes.length === 0 ? (
          <EmptyState
            query={searchQuery}
            icon={
              <IoImageOutline className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400" />
            }
            title={searchQuery ? "No Heroes Found" : "No Heroes Yet"}
            message={
              searchQuery
                ? undefined
                : "Start by uploading hero images for your slider"
            }
          />
        ) : /* Grid view */
        viewMode === "grid" ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              <AnimatePresence>
                {paginatedHeroes.map((hero, index) => (
                  <motion.div
                    key={hero._id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    whileHover={{ y: -8 }}
                    className={`group relative bg-white dark:bg-[#1A1B23] border rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 ${
                      selectedHeroes.has(hero._id)
                        ? "border-indigo-500 ring-4 ring-indigo-500/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600"
                    }`}
                  >
                    {isSelectionMode && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 left-3 z-10 cursor-pointer"
                        onClick={() => toggleHero(hero._id)}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all backdrop-blur-sm ${
                            selectedHeroes.has(hero._id)
                              ? "bg-indigo-600 border-indigo-600 scale-110"
                              : "bg-white/90 dark:bg-zinc-900/90 border-zinc-400 dark:border-zinc-600 group-hover:border-indigo-500"
                          }`}
                        >
                          {selectedHeroes.has(hero._id) && (
                            <IoCheckmarkCircle
                              className="text-white"
                              size={20}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}

                    <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg backdrop-blur-sm">
                      {hero.uniqueID}
                    </div>

                    <div
                      className="relative aspect-video overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-900"
                      onClick={() => isSelectionMode && toggleHero(hero._id)}
                    >
                      <motion.img
                        src={hero.imageUrl}
                        alt={hero.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-5">
                      <h3 className="text-[#0C0D12] dark:text-[#FFFFFF] font-bold mb-3 text-base line-clamp-2">
                        {hero.title}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-4">
                        <IoCalendarOutline size={16} />
                        <span className="text-xs font-medium">
                          {formatDate(hero.createdAt)}
                        </span>
                      </div>
                      <motion.button
                        onClick={() => confirmDelete(hero._id)}
                        disabled={deleteMut.isPending}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <IoTrashOutline size={18} /> Delete
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          /* List view */
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#1A1B23] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md"
            >
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-100 dark:bg-[#0C0D12] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      {isSelectionMode && (
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={
                              selectedHeroes.size === paginatedHeroes.length &&
                              paginatedHeroes.length > 0
                            }
                            onChange={(e) =>
                              e.target.checked ? selectAll() : clearSelection()
                            }
                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                      )}
                      {[
                        "Image",
                        "Title",
                        "Unique ID",
                        "Uploaded",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-sm font-bold text-[#0C0D12] dark:text-[#FFFFFF]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <AnimatePresence>
                      {paginatedHeroes.map((hero, index) => (
                        <motion.tr
                          key={hero._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.02 }}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${selectedHeroes.has(hero._id) ? "bg-indigo-50 dark:bg-indigo-500/5" : ""}`}
                        >
                          {isSelectionMode && (
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedHeroes.has(hero._id)}
                                onChange={() => toggleHero(hero._id)}
                                className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <motion.img
                              whileHover={{ scale: 1.1 }}
                              src={hero.imageUrl}
                              alt={hero.title}
                              className="w-24 h-16 object-cover rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700"
                              loading="lazy"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[#0C0D12] dark:text-[#FFFFFF] font-semibold text-sm line-clamp-2 max-w-xs">
                              {hero.title}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">
                              {hero.uniqueID}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                              {formatDate(hero.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <motion.button
                              onClick={() => confirmDelete(hero._id)}
                              disabled={deleteMut.isPending}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              <IoTrashOutline size={16} /> Delete
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="lg:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                <AnimatePresence>
                  {paginatedHeroes.map((hero, index) => (
                    <motion.div
                      key={hero._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${selectedHeroes.has(hero._id) ? "bg-indigo-50 dark:bg-indigo-500/5" : ""}`}
                    >
                      <div className="flex gap-4">
                        {isSelectionMode && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedHeroes.has(hero._id)}
                              onChange={() => toggleHero(hero._id)}
                              className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                        <img
                          src={hero.imageUrl}
                          alt={hero.title}
                          className="w-24 h-16 object-cover rounded-xl flex-shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-md"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#0C0D12] dark:text-[#FFFFFF] font-bold text-sm mb-1 line-clamp-2">
                            {hero.title}
                          </h3>
                          <span className="inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold mb-2">
                            {hero.uniqueID}
                          </span>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 font-medium">
                            {formatDate(hero.createdAt)}
                          </div>
                          <motion.button
                            onClick={() => confirmDelete(hero._id)}
                            disabled={deleteMut.isPending}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                          >
                            <IoTrashOutline size={14} /> Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
