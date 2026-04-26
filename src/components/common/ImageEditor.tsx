import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { motion } from "framer-motion";
import {
  X,
  Check,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Crop,
  Move,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────
interface ImageEditorProps {
  file: File;
  onConfirm: (editedBlob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

type AspectOption = {
  label: string;
  value: number | null;
  labelBn: string;
};

const ASPECT_OPTIONS: AspectOption[] = [
  { label: "Free", value: null, labelBn: "অনুপাত ছাড়া" }, // ← এটুকু বদলান
  { label: "1:1", value: 1, labelBn: "১:১" },
  { label: "4:3", value: 4 / 3, labelBn: "৪:৩" },
  { label: "16:9", value: 16 / 9, labelBn: "১৬:৯" },
  { label: "3:2", value: 3 / 2, labelBn: "৩:২" },
  { label: "2:3", value: 2 / 3, labelBn: "২:৩" },
];

// ── Crop helper ───────────────────────────────────────────
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.src = url;
  });

const getRadians = (deg: number) => (deg * Math.PI) / 180;

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flipH = false,
  flipV = false,
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");

  const radians = getRadians(rotation);
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(radians);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) throw new Error("Cropped canvas context failed");

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/webp",
      0.88,
    );
  });
}

// ── Component ─────────────────────────────────────────────
const ImageEditor = ({ file, onConfirm, onCancel }: ImageEditorProps) => {
  const [imageSrc, setImageSrc] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspect, setSelectedAspect] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"crop" | "transform">("crop");
  const [mounted, setMounted] = useState(false);

  // Portal mount safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        flipH,
        flipV,
      );
      const previewUrl = URL.createObjectURL(croppedBlob);
      onConfirm(croppedBlob, previewUrl);
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setSelectedAspect(0);
    setActiveTab("crop");
  };

  const currentAspect = ASPECT_OPTIONS[selectedAspect].value;

  if (!mounted || typeof document === "undefined") return null;

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] w-screen h-screen bg-black/95 backdrop-blur-sm flex flex-col"
    >
      {/* ── Top Bar ── */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 shrink-0"
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
          <span className="bangla hidden sm:inline">বাতিল</span>
        </button>

        <h2 className="text-white font-semibold bangla text-sm sm:text-base flex items-center gap-2">
          <Crop className="w-4 h-4 text-violet-400" />
          ছবি সম্পাদনা
        </h2>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing || !croppedAreaPixels}
          className="flex items-center gap-2 px-5 py-2 rounded bg-[var(--color-text)] text-[var(--color-bg)] text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-violet-500/30"
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span className="bangla hidden sm:inline">
            {isProcessing ? "প্রসেসিং..." : "নিশ্চিত করুন"}
          </span>
        </button>
      </motion.div>

      {/* ── Cropper Area ── */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {imageSrc && (
          <Cropper
            key={currentAspect ?? "free"}
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={currentAspect ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid
            transform={`translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`}
            style={{
              containerStyle: {
                background: "#000",
                width: "100%",
                height: "100%",
              },
              cropAreaStyle: {
                border: "2px solid rgba(139, 92, 246, 0.8)",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              },
            }}
          />
        )}

        {/* File info */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-xs bangla z-10">
          {file.name} • {(file.size / (1024 * 1024)).toFixed(1)} MB
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-black/90 border-t border-white/10 shrink-0"
      >
        {/* Tab Switcher */}
        <div className="flex justify-center gap-1 px-4 pt-3">
          {(["crop", "transform"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all bangla ${
                activeTab === tab
                  ? "bg-[var(--color-text)] text-[var(--color-bg)] shadow-lg shadow-violet-500/20"
                  : "bg-[var(--color-bg)] text-[var(--color-text)]"
              }`}
            >
              {tab === "crop" ? (
                <span className="flex items-center gap-1.5">
                  <Crop className="w-3.5 h-3.5" />
                  ক্রপ
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  ট্রান্সফর্ম
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {activeTab === "crop" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Aspect Ratio */}
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-2 bangla">
                  অনুপাত
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ASPECT_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedAspect(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 bangla ${
                        selectedAspect === i
                          ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {opt.labelBn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-white/50 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <ZoomIn className="w-3 h-3" />
                    <span className="bangla">জুম</span>
                  </p>
                  <span className="text-violet-400 text-xs font-mono">
                    {zoom.toFixed(1)}x
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all active:scale-90"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-violet-500
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-violet-500
                    [&::-webkit-slider-thumb]:cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all active:scale-90"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "transform" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Rotation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-white/50 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <RotateCw className="w-3 h-3" />
                    <span className="bangla">ঘোরানো</span>
                  </p>
                  <span className="text-violet-400 text-xs font-mono">
                    {rotation}°
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r - 90)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all active:scale-90"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-violet-500
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-violet-500
                    [&::-webkit-slider-thumb]:cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setRotation((r) => r + 90)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all active:scale-90"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Flip buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFlipH((f) => !f)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 bangla ${
                    flipH
                      ? "bg-violet-600 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  অনুভূমিক ফ্লিপ
                </button>

                <button
                  type="button"
                  onClick={() => setFlipV((f) => !f)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 bangla ${
                    flipV
                      ? "bg-violet-600 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  উল্লম্ব ফ্লিপ
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/10 text-white/60 hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-95 bangla ml-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  রিসেট
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
};

export default ImageEditor;
