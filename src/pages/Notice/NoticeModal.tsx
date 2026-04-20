// NoticeModal.tsx
import { useEffect, useRef } from "react";
import * as React from "react";
import Swal from "sweetalert2";
import { createRoot, type Root } from "react-dom/client";
import { Printer, Download, Loader2, X } from "lucide-react";
import axiosPublic from "../../hooks/axiosPublic";

import Button from "../../components/common/Button";
import { BN_DAYS_FULL, BN_MONTHS } from "../../utility/Formatters";

const API_URL = import.meta.env.VITE_API_URL;

export interface NoticeItem {
  _id: string;
  noticeSlug: string;
  notice: string;
  expiresAt: string;
  createdAt: string;
}

const isExpired = (iso: string) => new Date(iso) < new Date();

const fmtBn = (iso: string) => {
  const d = new Date(iso);
  return {
    full: `${d.getDate()} ${BN_MONTHS[d.getMonth()]} ${d.getFullYear()} ইং`,
    dayName: BN_DAYS_FULL[d.getDay()],
  };
};

// ── Action Bar ─────────────────────────────────────────────────────────────

interface ActionBarProps {
  expired: boolean;
  onPrint: () => void;
  onClose: () => void;
  onDownload: () => Promise<void>;
}

const ActionBar = ({ expired, onPrint, onDownload }: ActionBarProps) => {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200/40 shrink-0">
      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full shrink-0 ${
            expired ? "bg-gray-400" : "bg-green-500 shadow-[0_0_6px_#22c55e88]"
          }`}
        />
        <span className="text-[11px] opacity-50">
          {expired ? "মেয়াদ শেষ" : "সক্রিয়"}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="bangla gap-1.5 !text-[13px]"
        >
          <Printer size={14} />
          প্রিন্ট করুন
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="bangla gap-1.5 !text-[13px] min-w-[120px]"
        >
          {downloading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              ডাউনলোড হচ্ছে…
            </>
          ) : (
            <>
              <Download size={14} />
              ডাউনলোড
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// ── Close Button ───────────────────────────────────────────────────────────

const CloseButton = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    title="বন্ধ করুন"
    className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-full border-none text-white cursor-pointer shrink-0 transition-transform duration-150 ease-in-out hover:scale-110"
    style={{
      background: "linear-gradient(135deg, #ff4d4d, #c0392b)",
      boxShadow: "0 2px 8px rgba(192,57,43,0.45)",
    }}
  >
    <X size={16} strokeWidth={2.5} />
  </button>
);

// ── Main Modal ─────────────────────────────────────────────────────────────

interface NoticeModalProps {
  notice: NoticeItem | null;
  onClose: () => void;
}

const NoticeModal = ({ notice, onClose }: NoticeModalProps) => {
  const closeBtnRootRef = useRef<Root | null>(null);
  const actionBarRootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!notice) return;

    const expired = isExpired(notice.expiresAt);
    const created = fmtBn(notice.createdAt);

    const onPrint = () => {
      window.open(`${API_URL}/api/notices/${notice.noticeSlug}/pdf`, "_blank");
    };

    const onDownload = async () => {
      const res = await axiosPublic.get(
        `/api/notices/${notice.noticeSlug}/pdf`,
        { responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${notice.noticeSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const html = `
      <div class="bangla flex flex-col h-full max-h-[85vh] w-full overflow-hidden ">

        <!-- Close button mount point (top-right) -->
        <div id="swal-close-btn" class="absolute top-3 right-3 z-10"></div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto [scrollbar-width:none] px-4 pt-12 pb-6">

          <!-- Header -->
          <div class="relative flex items-center justify-center mb-4">
            <div class="absolute left-0">
              <img
                src="https://res.cloudinary.com/ddsfmccyi/image/upload/v1774367407/vite_yni0lp.png"
                alt="Logo"
                class="w-14 h-14 object-contain"
              />
            </div>
            <div class="text-center ">
              <p class="m-0 text-[clamp(15px,3vw,28px)] font-semibold leading-snug">রয়েল একাডেমি, বেলকুচি</p>
              <p class="m-0 mt-1 text-[clamp(11px,2vw,16px)] opacity-75">মুকুন্দগাতী বাজার, বেলকুচি, সিরাজগঞ্জ</p>
            </div>
          </div>

          <div class="flex justify-between text-[clamp(12px,2vw,18px)] mt-10">
            <span>তাংঃ ${created.full}</span>
            <span>রোজঃ ${created.dayName}</span>
          </div>

          <div class="border-t-[3px] border-double border-current mt-6"></div>

          <p class="text-center text-[clamp(22px,5vw,52px)] py-8 m-0">জরুরী বিজ্ঞপ্তি</p>

          <p class="m-0 text-[clamp(13px,2vw,20px)] leading-[2.1] text-justify min-h-[100px]">
            এতদ্বারা সকলের অবগতির জন্য জানানো যাইতেছে যে, ${notice.notice}
          </p>

          <div class="flex justify-end mt-20">
            <div class="text-right text-[clamp(12px,2vw,18px)] leading-7">
              <p class="m-0 font-bold">যোগাযোগঃ</p>
              <p class="m-0 font-black">রয়েল একাডেমি, বেলকুচি</p>
              <p class="m-0">মুকুন্দগাতী বাজার, বেলকুচি, সিরাজগঞ্জ</p>
              <p class="m-0">মোবাইলঃ</p>
              <p class="m-0 font-bold">০১৬৫০-০৩৩১৮১</p>
              <p class="m-0 font-bold">০১৮০৪-৫৫৮২২৬</p>
            </div>
          </div>

          <div class="border-t-[3px] border-double border-current mt-6"></div>

          <div class="flex justify-between text-[12px] opacity-60 mt-3 flex-wrap gap-1">
            <span>Issued: ${new Date(notice.createdAt).toLocaleDateString("en-GB")}</span>
            <span>Valid Until: ${new Date(notice.expiresAt).toLocaleDateString("en-GB")}</span>
          </div>
        </div>

        <!-- Action bar mount point -->
        <div id="swal-action-bar"></div>

      </div>
    `;

    Swal.fire({
      html,
      showConfirmButton: false,
      showCloseButton: false,
      padding: "0",
      width: "min(680px, 95vw)",
      background: "var(--color-bg, #fff)",
      color: "var(--color-text, #111)",
      position: "center",
      backdrop: "rgba(0,0,0,0.55)",
      customClass: {
        popup: "!rounded-2xl !overflow-hidden bangla",
        htmlContainer: "!p-0 !m-0 !overflow-hidden",
      },
      didOpen: () => {
        // ── Mount close button at top-right ──
        const closeMount = document.getElementById("swal-close-btn");
        if (closeMount) {
          closeBtnRootRef.current = createRoot(closeMount);
          closeBtnRootRef.current.render(
            <CloseButton onClose={() => Swal.close()} />,
          );
        }

        // ── Mount action bar ──
        const mount = document.getElementById("swal-action-bar");
        if (mount) {
          actionBarRootRef.current = createRoot(mount);
          actionBarRootRef.current.render(
            <ActionBar
              expired={expired}
              onPrint={onPrint}
              onDownload={onDownload}
              onClose={() => Swal.close()}
            />,
          );
        }
      },
      didClose: () => {
        closeBtnRootRef.current?.unmount();
        closeBtnRootRef.current = null;
        actionBarRootRef.current?.unmount();
        actionBarRootRef.current = null;
        onClose();
      },
    });

    return () => {
      Swal.close();
    };
  }, [notice, onClose]);

  return null;
};

export default NoticeModal;
