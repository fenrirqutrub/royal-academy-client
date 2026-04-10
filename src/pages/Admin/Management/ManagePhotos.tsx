// src/pages/Admin/Management/ManagePhotos.tsx
//
// Loading  → <Skeleton variant="picture" count={8} />
// Error    → <ErrorState message="..." />
// Empty    → <EmptyState ... />
// Controls → <GalleryControlsBar accentColor="emerald" />

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoTrashOutline,
  IoEyeOutline,
  IoCalendarOutline,
  IoCheckmarkCircle,
  IoCamera,
} from "react-icons/io5";
import { useState, useMemo, useEffect } from "react";
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
interface Photo {
  _id: string;
  imageUrl: string;
  publicId: string;
  views: number;
  createdAt: string;
  title?: string;
  width?: number;
  height?: number;
  size?: number;
}
interface ApiError {
  response?: { data?: { message?: string } };
}
type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "most-viewed" | "least-viewed";

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS: SortSelectOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "most-viewed", label: "Most Viewed" },
  { value: "least-viewed", label: "Least Viewed" },
];

const SWAL_BASE = {
  background: "#0C0D12",
  color: "#fff",
  iconColor: "#F59E0B",
  showCancelButton: true,
  confirmButtonColor: "#EF4444",
  cancelButtonColor: "#52525B",
  cancelButtonText: "Cancel",
};

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchPhotos = async (): Promise<Photo[]> =>
  (await axiosPublic.get("/api/photography?limit=1000")).data.data;

const deletePhoto = (id: string) =>
  axiosPublic.delete(`/api/photography/${id}`);

const deleteBatchPhotos = (ids: string[]) =>
  axiosPublic.post("/api/photography/batch/delete", { ids });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "N/A";
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)}KB` : `${mb.toFixed(1)}MB`;
};

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
export default function ManagePhotos() {
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Query ──────────────────────────────────────────────────────────────────
  const {
    data: photos = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["photos-admin"],
    queryFn: fetchPhotos,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const toastStyle = (border: string) => ({
    style: {
      background: "#0C0D12",
      color: "#fff",
      border: `1px solid ${border}`,
    },
  });

  const deleteMut = useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => {
      toast.success("Photo deleted successfully", {
        icon: "✨",
        ...toastStyle("#2D2E37"),
      });
      qc.invalidateQueries({ queryKey: ["photos-admin"] });
      qc.invalidateQueries({ queryKey: ["photos"] });
    },
    onError: (e: ApiError) =>
      toast.error(
        e?.response?.data?.message || "Failed to delete photo",
        toastStyle("#EF4444"),
      ),
  });

  const batchDeleteMut = useMutation({
    mutationFn: deleteBatchPhotos,
    onSuccess: () => {
      toast.success(`${selectedPhotos.size} photos deleted`, {
        icon: "🎉",
        ...toastStyle("#2D2E37"),
      });
      setSelectedPhotos(new Set());
      setIsSelectionMode(false);
      qc.invalidateQueries({ queryKey: ["photos-admin"] });
      qc.invalidateQueries({ queryKey: ["photos"] });
    },
    onError: (e: ApiError) =>
      toast.error(
        e?.response?.data?.message || "Failed to delete photos",
        toastStyle("#EF4444"),
      ),
  });

  // ── Reset page on filter change ────────────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // ── Processed list ─────────────────────────────────────────────────────────
  const processedPhotos = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = q
      ? photos.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p._id.toLowerCase().includes(q),
        )
      : [...photos];

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
        case "most-viewed":
          return b.views - a.views;
        case "least-viewed":
          return a.views - b.views;
        default:
          return 0;
      }
    });
  }, [photos, searchQuery, sortBy]);

  const totalPages = Math.ceil(processedPhotos.length / ITEMS_PER_PAGE);
  const paginatedPhotos = useMemo(
    () =>
      processedPhotos.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [processedPhotos, currentPage],
  );

  // ── Selection helpers ──────────────────────────────────────────────────────
  const togglePhoto = (id: string) => {
    const next = new Set(selectedPhotos);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPhotos(next);
  };
  const selectAll = () =>
    setSelectedPhotos(new Set(paginatedPhotos.map((p) => p._id)));
  const clearSelection = () => setSelectedPhotos(new Set());

  // ── Confirm dialogs ────────────────────────────────────────────────────────
  const confirmDelete = (id: string) =>
    Swal.fire({
      ...SWAL_BASE,
      title: "Delete Photo?",
      text: "This action cannot be undone",
      icon: "warning",
      confirmButtonText: "Delete",
    }).then((r) => {
      if (r.isConfirmed) deleteMut.mutate(id);
    });

  const confirmBatchDelete = () =>
    Swal.fire({
      ...SWAL_BASE,
      title: `Delete ${selectedPhotos.size} Photos?`,
      text: "This action cannot be undone",
      icon: "warning",
      confirmButtonText: `Delete ${selectedPhotos.size} Photos`,
    }).then((r) => {
      if (r.isConfirmed) batchDeleteMut.mutate(Array.from(selectedPhotos));
    });

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
          <ErrorState message="Photos লোড করতে ব্যর্থ হয়েছে।" />
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
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0C0D12] dark:text-white mb-3 tracking-tight"
            >
              Photo Gallery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg"
            >
              Manage and organize your photography collection
            </motion.p>
          </div>

          {/* Controls Bar */}
          <GalleryControlsBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search photos by title or ID..."
            searchLabel="Search Photos"
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
            selectionCount={selectedPhotos.size}
            pageItemCount={paginatedPhotos.length}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onBatchDelete={confirmBatchDelete}
            isBatchDeleting={batchDeleteMut.isPending}
            accentColor="emerald"
          />
        </motion.div>

        {/* Empty state */}
        {processedPhotos.length === 0 ? (
          <EmptyState
            query={searchQuery}
            icon={
              <IoCamera className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600 dark:text-emerald-400" />
            }
            title={searchQuery ? "No Photos Found" : "No Photos Yet"}
            message={
              searchQuery
                ? undefined
                : "Start building your gallery by uploading photos"
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
                {paginatedPhotos.map((photo, index) => (
                  <motion.div
                    key={photo._id}
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
                      selectedPhotos.has(photo._id)
                        ? "border-emerald-500 ring-4 ring-emerald-500/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600"
                    }`}
                  >
                    {isSelectionMode && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 left-3 z-10 cursor-pointer"
                        onClick={() => togglePhoto(photo._id)}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all backdrop-blur-sm ${
                            selectedPhotos.has(photo._id)
                              ? "bg-emerald-600 border-emerald-600 scale-110"
                              : "bg-white/90 dark:bg-zinc-900/90 border-zinc-400 dark:border-zinc-600 group-hover:border-emerald-500"
                          }`}
                        >
                          {selectedPhotos.has(photo._id) && (
                            <IoCheckmarkCircle
                              className="text-white"
                              size={20}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}

                    <div
                      className="relative aspect-square overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-900"
                      onClick={() => {
                        if (isSelectionMode) togglePhoto(photo._id);
                      }}
                    >
                      <motion.img
                        src={photo.imageUrl}
                        alt={photo.title || `Photo ${photo._id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-5">
                      {photo.title && (
                        <h3 className="text-[#0C0D12] dark:text-white font-bold mb-3 truncate text-base">
                          {photo.title}
                        </h3>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <IoEyeOutline size={18} />
                          <span className="text-sm font-bold">
                            {photo.views}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          <IoCalendarOutline size={16} />
                          <span className="text-xs font-medium">
                            {formatDate(photo.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                        {photo.width && photo.height && (
                          <span className="font-medium">
                            {photo.width} × {photo.height}
                          </span>
                        )}
                        <span className="font-medium">
                          {formatFileSize(photo.size)}
                        </span>
                      </div>
                      <motion.button
                        onClick={() => confirmDelete(photo._id)}
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
                              selectedPhotos.size === paginatedPhotos.length &&
                              paginatedPhotos.length > 0
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                selectAll();
                              } else {
                                clearSelection();
                              }
                            }}
                            className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
                          />
                        </th>
                      )}
                      {[
                        "Photo",
                        "Title",
                        "Views",
                        "Size",
                        "Uploaded",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-sm font-bold text-[#0C0D12] dark:text-white"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <AnimatePresence>
                      {paginatedPhotos.map((photo, index) => (
                        <motion.tr
                          key={photo._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.02 }}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${selectedPhotos.has(photo._id) ? "bg-emerald-50 dark:bg-emerald-500/5" : ""}`}
                        >
                          {isSelectionMode && (
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedPhotos.has(photo._id)}
                                onChange={() => togglePhoto(photo._id)}
                                className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <motion.img
                              whileHover={{ scale: 1.1 }}
                              src={photo.imageUrl}
                              alt={photo.title || `Photo ${photo._id}`}
                              className="w-16 h-16 object-cover rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700"
                              loading="lazy"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[#0C0D12] dark:text-white font-semibold text-sm truncate max-w-xs">
                              {photo.title || "Untitled"}
                            </p>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate mt-1">
                              ID: {photo._id.slice(-8)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <IoEyeOutline
                                size={18}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                              <span className="text-[#0C0D12] dark:text-white font-bold">
                                {photo.views}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[#0C0D12] dark:text-white text-sm font-medium">
                              {formatFileSize(photo.size)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                              {formatDate(photo.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <motion.button
                              onClick={() => confirmDelete(photo._id)}
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
                  {paginatedPhotos.map((photo, index) => (
                    <motion.div
                      key={photo._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${selectedPhotos.has(photo._id) ? "bg-emerald-50 dark:bg-emerald-500/5" : ""}`}
                    >
                      <div className="flex gap-4">
                        {isSelectionMode && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedPhotos.has(photo._id)}
                              onChange={() => togglePhoto(photo._id)}
                              className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
                            />
                          </div>
                        )}
                        <img
                          src={photo.imageUrl}
                          alt={photo.title || `Photo ${photo._id}`}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-md"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#0C0D12] dark:text-white font-bold text-sm mb-2 truncate">
                            {photo.title || "Untitled"}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                            <div className="flex items-center gap-1.5">
                              <IoEyeOutline
                                size={14}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                              <span className="font-semibold">
                                {photo.views}
                              </span>
                            </div>
                            <span>•</span>
                            <span className="font-medium">
                              {formatDate(photo.createdAt)}
                            </span>
                          </div>
                          <motion.button
                            onClick={() => confirmDelete(photo._id)}
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
