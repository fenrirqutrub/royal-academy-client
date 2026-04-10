// src/pages/Photography/Photography.tsx
import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { IoEyeOutline } from "react-icons/io5";
import { axiosPublic } from "../../hooks/axiosPublic";
import Skeleton from "../../components/common/Skeleton";
import { Eye, Loader2, X } from "lucide-react";

interface Photo {
  _id: string;
  imageUrl: string;
  publicId: string;
  title?: string;
  description?: string;
  views: number;
  width?: number;
  height?: number;
  createdAt: string;
}

interface PageData {
  data: Photo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

const fetchPhotos = async ({ pageParam = 1 }): Promise<PageData> => {
  const response = await axiosPublic.get(
    `/api/photography?page=${pageParam}&limit=20`,
  );
  return response.data;
};

const incrementView = async (id: string) => {
  await axiosPublic.post(`/api/photography/${id}/view`);
};

// Helper function to calculate time ago
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
};

export default function PhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["photos"],
    queryFn: fetchPhotos,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const viewMutation = useMutation({
    mutationFn: incrementView,
  });

  const photos = data?.pages.flatMap((page) => page.data) ?? [];

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    viewMutation.mutate(photo._id);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  if (isPending) {
    return <Skeleton variant="picture" height="150px" count={4} />;
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4 bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">❌ ছবি লোড করতে ব্যর্থ</p>
          <p className="text-[var(--color-gray)]">দয়া করে আবার চেষ্টা করুন।</p>
        </div>
      </div>
    );
  }

  refetch();

  return (
    <>
      <div className="min-h-screen py-8 px-4 pt-24 ">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-6xl font-bold mb-4 bangla ">
              গ্যালারি
            </h1>
            <p className="text-[var(--color-gray)] text-md md:text-lg bangla">
              {photos.length || 0} গুলো সুন্দর মুহুর্ত
            </p>
          </motion.div>

          {photos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="text-3xl md:text-8xl mb-6">📸</div>
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-gray)] mb-2 bangla">
                কোন ছবি পাওয়া যায়নি
              </h2>
            </motion.div>
          ) : (
            <>
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {photos.map((photo, index) => {
                  return (
                    <motion.div
                      key={photo._id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="break-inside-avoid group cursor-pointer relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                      onClick={() => handlePhotoClick(photo)}
                    >
                      <div className="relative w-full">
                        <motion.img
                          src={photo.imageUrl}
                          alt={photo.title || `Photo ${index + 1}`}
                          className="w-full h-auto object-cover rounded-xl"
                          whileHover={{ scale: 1.03 }}
                          transition={{ duration: 0.3 }}
                          loading="lazy"
                        />

                        {/* Overlay with info */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300 rounded-xl"
                        >
                          {photo.title && (
                            <p className="text-[var(--color-text)] font-semibold mb-2 truncate">
                              {photo.title}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[var(--color-text)] text-sm">
                            <div className="flex items-center gap-2">
                              <Eye className="w-[18px] h-[18px]" />
                              <span className="font-semibold">
                                {photo.views ? photo.views : 0} views
                              </span>
                            </div>
                            <span className="text-xs opacity-70">
                              {getTimeAgo(photo.createdAt)}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {data && data.pages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center items-center gap-2 mt-12 flex-wrap"
                >
                  {/* Previous Button */}
                  <motion.button
                    onClick={() => {
                      if (data.pages.length > 1) {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={data.pages.length === 1 || isFetchingNextPage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-[var(--color-bg)] text-[var(--color-gray)] font-semibold rounded-lg shadow hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Previous
                  </motion.button>

                  {/* Page Numbers */}
                  {data.pages.map((_, index) => {
                    const pageNum = index + 1;
                    const totalPages =
                      data.pages[data.pages.length - 1].pagination.pages;
                    const currentPage = data.pages.length;

                    // Show first page, last page, current page, and adjacent pages
                    const showPage =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1;

                    const showEllipsisBefore =
                      pageNum === currentPage - 2 && currentPage > 3;
                    const showEllipsisAfter =
                      pageNum === currentPage + 2 &&
                      currentPage < totalPages - 2;

                    return (
                      <div key={pageNum} className="flex items-center gap-2">
                        {showEllipsisBefore && (
                          <span className="px-2 text-[var(--color-gray)]">
                            ...
                          </span>
                        )}

                        {showPage && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                              pageNum === currentPage
                                ? "bg-[var(--color-text)] text-[var(--color-bg)]"
                                : "bg-[var(--color-text)] text-[var(--color-bg)]"
                            }`}
                            disabled={isFetchingNextPage}
                          >
                            {pageNum}
                          </motion.button>
                        )}

                        {showEllipsisAfter && (
                          <span className="px-2 text-[var(--color-gray)]">
                            ...
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Show ellipsis and last page if more pages exist */}
                  {hasNextPage && (
                    <>
                      <span className="px-2 text-[var(--color-gray)]">...</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-lg font-semibold bg-[var(--color-bg)] text-[var(--color-gray)] shadow hover:shadow-lg transition-all"
                        disabled
                      >
                        {data.pages[data.pages.length - 1].pagination.pages}
                      </motion.button>
                    </>
                  )}

                  {/* Next Button */}
                  <motion.button
                    onClick={() => fetchNextPage()}
                    disabled={!hasNextPage || isFetchingNextPage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isFetchingNextPage ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      "Next"
                    )}
                  </motion.button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal with Glassmorphic Backdrop */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Glassmorphic Background Layer */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Close Button */}
            <motion.button
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeModal}
              className="fixed top-6 right-6 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-xl border border-white/20"
            >
              <X className="w-[28px] h-[28px]" />
            </motion.button>

            {/* Image Container with Glass Effect */}
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-7xl max-h-[90vh] mx-auto z-10"
            >
              {/* Glass border container */}
              <div className="relative p-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title || "Photo"}
                  className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                />

                {/* Photo Info Overlay */}
                {(selectedPhoto.title || selectedPhoto.description) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent backdrop-blur-md rounded-b-xl"
                  >
                    {selectedPhoto.title && (
                      <h3 className="text-white text-xl font-bold mb-2">
                        {selectedPhoto.title}
                      </h3>
                    )}
                    {selectedPhoto.description && (
                      <p className="text-white/90 text-sm">
                        {selectedPhoto.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
                      <div className="flex items-center gap-2">
                        <IoEyeOutline size={18} />
                        <span>
                          {selectedPhoto.views ? selectedPhoto.views : 0} views
                        </span>
                      </div>
                      <span>•</span>
                      <span>{getTimeAgo(selectedPhoto.createdAt)}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
