import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import axiosPublic from "../../hooks/axiosPublic";
import { Download, Loader2, Printer } from "lucide-react";

interface ExamMarksPage {
  pageNumber: number;
  url: string;
  publicId: string;
}

interface ExamMarksData {
  _id: string;
  pages: ExamMarksPage[];
  totalPages: number;
  isActive: boolean;
  createdAt: string;
}

const ExamMarks = () => {
  const [downloadingPages, setDownloadingPages] = useState<Set<number>>(
    new Set(),
  );
  const [printingPages, setPrintingPages] = useState<Set<number>>(new Set());

  const {
    data: examMarks,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["active-exam-marks"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/exam-marks/active");
      return res.data.data as ExamMarksData;
    },
  });

  // ── Per-page download ─────────────────────────────────────────────────────
  const handleDownloadPage = async (page: ExamMarksPage) => {
    if (downloadingPages.has(page.pageNumber)) return;

    setDownloadingPages((prev) => new Set(prev).add(page.pageNumber));

    try {
      const response = await fetch(page.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam-marks-page-${page.pageNumber}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to download page ${page.pageNumber}:`, err);
    } finally {
      setDownloadingPages((prev) => {
        const next = new Set(prev);
        next.delete(page.pageNumber);
        return next;
      });
    }
  };

  // ── Per-page print (CSS @media print approach — no _blank) ────────────────
  const handlePrintPage = (page: ExamMarksPage) => {
    if (printingPages.has(page.pageNumber)) return;

    setPrintingPages((prev) => new Set(prev).add(page.pageNumber));

    // inject a temporary <style> to show only this image during print
    const styleId = `print-style-exammarks-${page.pageNumber}`;
    const imgId = `print-img-exammarks-${page.pageNumber}`;

    // mark the target img
    const allImgs = document.querySelectorAll<HTMLImageElement>(
      "[data-exammarks-page]",
    );
    allImgs.forEach((el) => el.removeAttribute("id"));
    const targetImg = document.querySelector<HTMLImageElement>(
      `[data-exammarks-page="${page.pageNumber}"]`,
    );
    if (targetImg) targetImg.id = imgId;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @media print {
        @page { margin: 0; }
        body > * { display: none !important; }
        #${imgId} { display: block !important; width: 100% !important; height: auto !important; position: fixed !important; top: 0; left: 0; }
      }
    `;
    document.head.appendChild(style);

    window.print();

    // cleanup after print dialog closes
    setTimeout(() => {
      document.getElementById(styleId)?.remove();
      if (targetImg) targetImg.removeAttribute("id");
      setPrintingPages((prev) => {
        const next = new Set(prev);
        next.delete(page.pageNumber);
        return next;
      });
    }, 1000);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full mt-4 space-y-3">
        <div className="h-8 w-48 rounded-lg bg-[var(--color-active-bg)] animate-pulse" />
        <div className="h-[520px] rounded-2xl bg-[var(--color-active-bg)] animate-pulse" />
      </div>
    );
  }

  if (isError || !examMarks) {
    return (
      <div className="w-full mt-6 flex flex-col items-center gap-2 text-[var(--color-gray)] bangla">
        <span className="text-4xl">📭</span>
        <p className="text-lg">কোনো পরীক্ষার ফলাফল পাওয়া যায়নি</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full mt-4 space-y-4">
      {/* Title */}
      <p className="bangla text-lg font-semibold text-[var(--color-text)] opacity-70">
        {new Date(examMarks.createdAt).toLocaleDateString("bn-BD", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>

      {examMarks.pages.map((page, i) => {
        const isDownloading = downloadingPages.has(page.pageNumber);
        const isPrinting = printingPages.has(page.pageNumber);

        return (
          <motion.div
            key={page.pageNumber}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.06,
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-full rounded-2xl overflow-hidden border border-[var(--color-active-border)] group"
          >
            <img
              src={page.url}
              alt={`পরীক্ষার ফলাফল পৃষ্ঠা ${page.pageNumber}`}
              data-exammarks-page={page.pageNumber}
              className="w-full h-auto object-contain"
              loading="lazy"
            />

            {/* Action buttons — top-right overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              {/* Download btn */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleDownloadPage(page)}
                disabled={isDownloading}
                title={`পৃষ্ঠা ${page.pageNumber} ডাউনলোড করুন`}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                  bg-black text-white shadow-md
                  hover:opacity-80 transition-opacity bangla
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isDownloading ? (
                  <Loader2 className="w-[14px] h-[14px] animate-spin" />
                ) : (
                  <Download className="w-[14px] h-[14px]" />
                )}
                {isDownloading ? "..." : `পৃষ্ঠা ${page.pageNumber}`}
              </motion.button>

              {/* Print btn */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handlePrintPage(page)}
                disabled={isPrinting}
                title={`পৃষ্ঠা ${page.pageNumber} প্রিন্ট করুন`}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                  bg-black text-white shadow-md
                  hover:opacity-80 transition-opacity bangla
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isPrinting ? (
                  <Loader2 className="w-[14px] h-[14px] animate-spin" />
                ) : (
                  <Printer className="w-[14px] h-[14px]" />
                )}
                {isPrinting ? "..." : "প্রিন্ট"}
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ExamMarks;
