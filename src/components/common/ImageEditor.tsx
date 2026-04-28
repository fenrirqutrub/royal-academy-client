// src/components/common/ImageEditor.tsx
import { useState, useCallback, useEffect, useRef } from "react";
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
  Maximize2,
} from "lucide-react";
import { lockScroll, unlockScroll } from "../../utility/scrollLock";

// ── Types ─────────────────────────────────────────────────
interface ImageEditorProps {
  file: File;
  onConfirm: (editedBlob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

type FreeCrop = { x: number; y: number; w: number; h: number };

type AspectOption = {
  label: string;
  value: number | null | "free";
  labelBn: string;
};

const ASPECT_OPTIONS: AspectOption[] = [
  { label: "Free Resize", value: "free", labelBn: "মুক্ত রিসাইজ" },
  { label: "1:1", value: 1, labelBn: "১:১" },
  { label: "4:3", value: 4 / 3, labelBn: "৪:৩" },
  { label: "16:9", value: 16 / 9, labelBn: "১৬:৯" },
  { label: "3:2", value: 3 / 2, labelBn: "৩:২" },
  { label: "2:3", value: 2 / 3, labelBn: "২:৩" },
];

// ── Crop helpers ──────────────────────────────────────────
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.src = url;
  });

const getRadians = (deg: number) => (deg * Math.PI) / 180;

// Existing: for aspect-ratio locked crop (react-easy-crop)
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
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
      "image/webp",
      0.88,
    );
  });
}

// New: for free-resize crop (percentage-based)
// Crops first, then applies rotation/flip
async function getCroppedImgFree(
  imageSrc: string,
  crop: FreeCrop, // 0–100% of natural image
  rotation: number,
  flipH: boolean,
  flipV: boolean,
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const px = Math.round((crop.x / 100) * image.naturalWidth);
  const py = Math.round((crop.y / 100) * image.naturalHeight);
  const pw = Math.max(1, Math.round((crop.w / 100) * image.naturalWidth));
  const ph = Math.max(1, Math.round((crop.h / 100) * image.naturalHeight));

  // Step 1 — extract crop region from original image
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = pw;
  cropCanvas.height = ph;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("Canvas context failed");
  cropCtx.drawImage(image, px, py, pw, ph, 0, 0, pw, ph);

  if (rotation === 0 && !flipH && !flipV) {
    return new Promise((resolve, reject) => {
      cropCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Blob failed"))),
        "image/webp",
        0.88,
      );
    });
  }

  // Step 2 — apply rotation + flip to the cropped result
  const radians = getRadians(rotation);
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bW = Math.round(pw * cos + ph * sin);
  const bH = Math.round(pw * sin + ph * cos);

  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = bW;
  rotCanvas.height = bH;
  const rotCtx = rotCanvas.getContext("2d");
  if (!rotCtx) throw new Error("Rotation canvas context failed");

  rotCtx.translate(bW / 2, bH / 2);
  rotCtx.rotate(radians);
  rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  rotCtx.drawImage(cropCanvas, -pw / 2, -ph / 2);

  return new Promise((resolve, reject) => {
    rotCanvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Rotate blob failed")),
      "image/webp",
      0.88,
    );
  });
}

// ── FreeResizeCrop component ──────────────────────────────
const clampVal = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

interface FreeResizeCropProps {
  imageSrc: string;
  crop: FreeCrop;
  onChange: (c: FreeCrop) => void;
  onNaturalDims?: (w: number, h: number) => void;
}

const FreeResizeCrop = ({
  imageSrc,
  crop,
  onChange,
  onNaturalDims,
}: FreeResizeCropProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [bounds, setBounds] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // dragRef stores active drag state without triggering re-renders
  const dragRef = useRef<{
    type: string;
    sx: number; // pointer start X
    sy: number; // pointer start Y
    sc: FreeCrop; // crop at drag start
    bw: number; // image display width at drag start
    bh: number; // image display height at drag start
  } | null>(null);

  // Compute the actual image display bounds inside the container
  // (handles object-fit: contain letterboxing)
  const computeBounds = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const cW = img.clientWidth;
    const cH = img.clientHeight;
    if (!cW || !cH) return;
    const nA = img.naturalWidth / img.naturalHeight;
    const cA = cW / cH;
    let w: number, h: number, x: number, y: number;
    if (nA > cA) {
      w = cW;
      h = cW / nA;
      x = 0;
      y = (cH - h) / 2;
    } else {
      h = cH;
      w = cH * nA;
      x = (cW - w) / 2;
      y = 0;
    }
    setBounds({ x, y, w, h });
  }, []);

  useEffect(() => {
    computeBounds();
    const ro = new ResizeObserver(computeBounds);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [computeBounds, loaded]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    onNaturalDims?.(img.naturalWidth, img.naturalHeight);
    setLoaded(true);
  };

  // Pointer down on a handle or crop box
  const startDrag = useCallback(
    (e: React.PointerEvent, type: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!bounds.w) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        type,
        sx: e.clientX,
        sy: e.clientY,
        sc: { ...crop },
        bw: bounds.w,
        bh: bounds.h,
      };
    },
    [crop, bounds],
  );

  // Pointer move — bubbles up from captured handle to container
  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const { type, sx, sy, sc, bw, bh } = dragRef.current;
      const dx = ((e.clientX - sx) / bw) * 100;
      const dy = ((e.clientY - sy) / bh) * 100;
      const MIN = 3;

      let { x, y, w, h } = sc;

      if (type === "move") {
        x = clampVal(sc.x + dx, 0, 100 - sc.w);
        y = clampVal(sc.y + dy, 0, 100 - sc.h);
      } else {
        if (type.includes("e")) {
          w = clampVal(sc.w + dx, MIN, 100 - sc.x);
        }
        if (type.includes("w")) {
          const d = clampVal(dx, -sc.x, sc.w - MIN);
          x = sc.x + d;
          w = sc.w - d;
        }
        if (type.includes("s")) {
          h = clampVal(sc.h + dy, MIN, 100 - sc.y);
        }
        if (type.includes("n")) {
          const d = clampVal(dy, -sc.y, sc.h - MIN);
          y = sc.y + d;
          h = sc.h - d;
        }
      }

      onChange({ x, y, w, h });
    },
    [onChange],
  );

  const stopDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Compute absolute pixel positions for rendering
  const ax = bounds.x + (crop.x / 100) * bounds.w;
  const ay = bounds.y + (crop.y / 100) * bounds.h;
  const aw = (crop.w / 100) * bounds.w;
  const ah = (crop.h / 100) * bounds.h;

  const HS = 12; // handle size in px
  const HH = HS / 2;

  const handles = [
    { id: "nw", cx: 0, cy: 0, cursor: "nw-resize" },
    { id: "n", cx: 0.5, cy: 0, cursor: "n-resize" },
    { id: "ne", cx: 1, cy: 0, cursor: "ne-resize" },
    { id: "e", cx: 1, cy: 0.5, cursor: "e-resize" },
    { id: "se", cx: 1, cy: 1, cursor: "se-resize" },
    { id: "s", cx: 0.5, cy: 1, cursor: "s-resize" },
    { id: "sw", cx: 0, cy: 1, cursor: "sw-resize" },
    { id: "w", cx: 0, cy: 0.5, cursor: "w-resize" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black select-none touch-none"
      onPointerMove={handleMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      style={{ touchAction: "none" }}
    >
      {/* The image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt="crop preview"
        draggable={false}
        onLoad={onImgLoad}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {loaded && bounds.w > 0 && (
        <>
          {/* ── Dark overlays around crop box (4 regions) ── */}
          {/* Top */}
          <div
            className="absolute bg-black/65 pointer-events-none"
            style={{
              left: bounds.x,
              top: bounds.y,
              width: bounds.w,
              height: ay - bounds.y,
            }}
          />
          {/* Bottom */}
          <div
            className="absolute bg-black/65 pointer-events-none"
            style={{
              left: bounds.x,
              top: ay + ah,
              width: bounds.w,
              height: bounds.y + bounds.h - ay - ah,
            }}
          />
          {/* Left */}
          <div
            className="absolute bg-black/65 pointer-events-none"
            style={{
              left: bounds.x,
              top: ay,
              width: ax - bounds.x,
              height: ah,
            }}
          />
          {/* Right */}
          <div
            className="absolute bg-black/65 pointer-events-none"
            style={{
              left: ax + aw,
              top: ay,
              width: bounds.x + bounds.w - ax - aw,
              height: ah,
            }}
          />

          {/* ── Crop box — drag to move ── */}
          <div
            className="absolute"
            style={{
              left: ax,
              top: ay,
              width: aw,
              height: ah,
              cursor: "move",
              border: "1.5px solid rgba(255,255,255,0.75)",
              outline: "1px solid rgba(139,92,246,0.55)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
            }}
            onPointerDown={(e) => startDrag(e, "move")}
          >
            {/* Rule-of-thirds grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 inset-x-0 border-t border-white/15" />
              <div className="absolute top-2/3 inset-x-0 border-t border-white/15" />
              <div className="absolute left-1/3 inset-y-0 border-l border-white/15" />
              <div className="absolute left-2/3 inset-y-0 border-l border-white/15" />
            </div>
          </div>

          {/* ── 8 Resize handles ── */}
          {handles.map((h) => (
            <div
              key={h.id}
              className="absolute z-10 bg-white rounded-sm"
              style={{
                left: ax + h.cx * aw - HH,
                top: ay + h.cy * ah - HH,
                width: HS,
                height: HS,
                cursor: h.cursor,
                border: "1.5px solid rgb(139,92,246)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
                touchAction: "none",
              }}
              onPointerDown={(e) => startDrag(e, h.id)}
            />
          ))}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Main ImageEditor component
// ═══════════════════════════════════════════════════════════
const ImageEditor = ({ file, onConfirm, onCancel }: ImageEditorProps) => {
  const [imageSrc, setImageSrc] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspect, setSelectedAspect] = useState(0); // 0 = free resize
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"crop" | "transform">("crop");
  const [mounted, setMounted] = useState(false);

  // Free resize specific
  const [freeResizeCrop, setFreeResizeCrop] = useState<FreeCrop>({
    x: 10,
    y: 10,
    w: 80,
    h: 80,
  });
  const [naturalDims, setNaturalDims] = useState({ w: 0, h: 0 });

  const isFreeMode = ASPECT_OPTIONS[selectedAspect].value === "free";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Replace the old scroll lock useEffect with:
  useEffect(() => {
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, []);
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      let blob: Blob;
      if (isFreeMode) {
        blob = await getCroppedImgFree(
          imageSrc,
          freeResizeCrop,
          rotation,
          flipH,
          flipV,
        );
      } else {
        if (!croppedAreaPixels) return;
        blob = await getCroppedImg(
          imageSrc,
          croppedAreaPixels,
          rotation,
          flipH,
          flipV,
        );
      }
      const previewUrl = URL.createObjectURL(blob);
      onConfirm(blob, previewUrl);
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
    setFreeResizeCrop({ x: 10, y: 10, w: 80, h: 80 });
    setActiveTab("crop");
  };

  const currentAspect =
    typeof ASPECT_OPTIONS[selectedAspect].value === "number"
      ? (ASPECT_OPTIONS[selectedAspect].value as number)
      : undefined;

  // Live px dimensions display in header
  const cropPxDisplay =
    isFreeMode && naturalDims.w > 0
      ? {
          w: Math.round((freeResizeCrop.w / 100) * naturalDims.w),
          h: Math.round((freeResizeCrop.h / 100) * naturalDims.h),
        }
      : null;

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

        <div className="flex flex-col items-center gap-0.5">
          <h2 className="text-white font-semibold bangla text-sm sm:text-base flex items-center gap-2">
            <Crop className="w-4 h-4 text-violet-400" />
            ছবি সম্পাদনা
          </h2>
          {cropPxDisplay && (
            <span className="text-white/40 text-[10px] font-mono tabular-nums">
              {cropPxDisplay.w} × {cropPxDisplay.h} px
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing || (!isFreeMode && !croppedAreaPixels)}
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
        {imageSrc &&
          (isFreeMode ? (
            <FreeResizeCrop
              imageSrc={imageSrc}
              crop={freeResizeCrop}
              onChange={setFreeResizeCrop}
              onNaturalDims={(w, h) => setNaturalDims({ w, h })}
            />
          ) : (
            <Cropper
              key={currentAspect ?? "fixed-ratio"}
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={currentAspect}
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
          ))}

        {/* File info */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-xs bangla z-10">
          {file.name} • {(file.size / (1024 * 1024)).toFixed(1)} MB
        </div>

        {/* Rotation applied notice in free mode */}
        {isFreeMode && rotation !== 0 && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 text-violet-300 text-xs z-10 bangla">
            ঘোরানো {rotation}° — এক্সপোর্টে প্রযোজ্য হবে
          </div>
        )}
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
              {/* Mode / Aspect selector */}
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-2 bangla">
                  ক্রপ মোড / অনুপাত
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ASPECT_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedAspect(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 bangla flex items-center gap-1 ${
                        selectedAspect === i
                          ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {opt.value === "free" && (
                        <Maximize2 className="w-3 h-3" />
                      )}
                      {opt.labelBn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom — only for fixed aspect modes */}
              {!isFreeMode && (
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
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer"
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
              )}

              {/* Free mode hint */}
              {isFreeMode && (
                <p className="text-white/40 text-[11px] bangla flex items-center gap-1.5">
                  <Maximize2 className="w-3 h-3 text-violet-400 shrink-0" />
                  কোণ ও প্রান্তের হ্যান্ডেল টেনে ইচ্ছামতো সাইজ করুন · ভেতরে
                  ড্র্যাগ করে সরান
                </p>
              )}
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
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer"
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

              {/* Flip + Reset */}
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
