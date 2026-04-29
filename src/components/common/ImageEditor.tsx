// src/components/common/ImageEditor.tsx
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
      "image/webp",
      0.88,
    );
  });
}

async function getCroppedImgFree(
  imageSrc: string,
  crop: FreeCrop,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const px = Math.round((crop.x / 100) * image.naturalWidth);
  const py = Math.round((crop.y / 100) * image.naturalHeight);
  const pw = Math.max(1, Math.round((crop.w / 100) * image.naturalWidth));
  const ph = Math.max(1, Math.round((crop.h / 100) * image.naturalHeight));

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

async function createTransformedImageUrl(
  srcUrl: string,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
): Promise<string> {
  const image = await createImage(srcUrl);
  const radians = getRadians(rotation);
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const w = Math.round(image.naturalWidth * cos + image.naturalHeight * sin);
  const h = Math.round(image.naturalWidth * sin + image.naturalHeight * cos);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");

  ctx.translate(w / 2, h / 2);
  ctx.rotate(radians);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
        else reject(new Error("Transform blob failed"));
      },
      "image/webp",
      0.92,
    );
  });
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// ─── FreeResizeCrop — DOM-direct manipulation for 60fps drag ───
interface FreeResizeCropProps {
  imageSrc: string;
  crop: FreeCrop;
  onChange: (c: FreeCrop) => void;
  onNaturalDims?: (w: number, h: number) => void;
}

const FreeResizeCrop = ({
  imageSrc,
  crop: externalCrop,
  onChange,
  onNaturalDims,
}: FreeResizeCropProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const boundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [bounds, setBounds] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // DOM refs for direct manipulation — zero React re-renders during drag
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const overlayTopRef = useRef<HTMLDivElement>(null);
  const overlayBottomRef = useRef<HTMLDivElement>(null);
  const overlayLeftRef = useRef<HTMLDivElement>(null);
  const overlayRightRef = useRef<HTMLDivElement>(null);
  const handleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const cropRef = useRef<FreeCrop>(externalCrop);
  const isDraggingRef = useRef(false);

  // Sync external crop when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      cropRef.current = externalCrop;
      applyDOMUpdate(externalCrop, boundsRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCrop]);

  // ── Direct DOM update — no setState, no re-render ──
  const applyDOMUpdate = useCallback(
    (c: FreeCrop, b: { x: number; y: number; w: number; h: number }) => {
      if (!b.w) return;

      const ax = b.x + (c.x / 100) * b.w;
      const ay = b.y + (c.y / 100) * b.h;
      const aw = (c.w / 100) * b.w;
      const ah = (c.h / 100) * b.h;

      // Crop box — use transform for GPU acceleration
      const box = cropBoxRef.current;
      if (box) {
        box.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
        box.style.width = `${aw}px`;
        box.style.height = `${ah}px`;
      }

      // Overlays
      const ot = overlayTopRef.current;
      if (ot) {
        ot.style.left = `${b.x}px`;
        ot.style.top = `${b.y}px`;
        ot.style.width = `${b.w}px`;
        ot.style.height = `${ay - b.y}px`;
      }
      const ob = overlayBottomRef.current;
      if (ob) {
        ob.style.left = `${b.x}px`;
        ob.style.top = `${ay + ah}px`;
        ob.style.width = `${b.w}px`;
        ob.style.height = `${b.y + b.h - ay - ah}px`;
      }
      const ol = overlayLeftRef.current;
      if (ol) {
        ol.style.left = `${b.x}px`;
        ol.style.top = `${ay}px`;
        ol.style.width = `${ax - b.x}px`;
        ol.style.height = `${ah}px`;
      }
      const or2 = overlayRightRef.current;
      if (or2) {
        or2.style.left = `${ax + aw}px`;
        or2.style.top = `${ay}px`;
        or2.style.width = `${b.x + b.w - ax - aw}px`;
        or2.style.height = `${ah}px`;
      }

      // Handles
      const HS = 12;
      const HH = HS / 2;
      const handlePositions: Record<string, { cx: number; cy: number }> = {
        nw: { cx: 0, cy: 0 },
        n: { cx: 0.5, cy: 0 },
        ne: { cx: 1, cy: 0 },
        e: { cx: 1, cy: 0.5 },
        se: { cx: 1, cy: 1 },
        s: { cx: 0.5, cy: 1 },
        sw: { cx: 0, cy: 1 },
        w: { cx: 0, cy: 0.5 },
      };

      for (const [id, pos] of Object.entries(handlePositions)) {
        const el = handleRefs.current[id];
        if (el) {
          el.style.transform = `translate3d(${ax + pos.cx * aw - HH}px, ${ay + pos.cy * ah - HH}px, 0)`;
        }
      }
    },
    [],
  );

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
    const newBounds = { x, y, w, h };
    boundsRef.current = newBounds;
    setBounds(newBounds);
    applyDOMUpdate(cropRef.current, newBounds);
  }, [applyDOMUpdate]);

  useEffect(() => {
    computeBounds();
    const ro = new ResizeObserver(computeBounds);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [computeBounds, loaded]);

  useEffect(() => {
    setLoaded(false);
  }, [imageSrc]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    onNaturalDims?.(img.naturalWidth, img.naturalHeight);
    setLoaded(true);
  };

  // ── Pointer handlers — attached to container, uses native events ──
  const dragStateRef = useRef<{
    type: string;
    sx: number;
    sy: number;
    sc: FreeCrop;
    bw: number;
    bh: number;
    pointerId: number;
  } | null>(null);

  const onPointerDown = useCallback((type: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const b = boundsRef.current;
    if (!b.w) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;

    dragStateRef.current = {
      type,
      sx: e.clientX,
      sy: e.clientY,
      sc: { ...cropRef.current },
      bw: b.w,
      bh: b.h,
      pointerId: e.pointerId,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const MIN = 3;

    const onMove = (e: PointerEvent) => {
      const d = dragStateRef.current;
      if (!d) return;

      const dx = ((e.clientX - d.sx) / d.bw) * 100;
      const dy = ((e.clientY - d.sy) / d.bh) * 100;

      let { x, y, w, h } = d.sc;
      const type = d.type;

      if (type === "move") {
        x = clamp(d.sc.x + dx, 0, 100 - d.sc.w);
        y = clamp(d.sc.y + dy, 0, 100 - d.sc.h);
      } else {
        if (type.includes("e")) w = clamp(d.sc.w + dx, MIN, 100 - d.sc.x);
        if (type.includes("w")) {
          const dd = clamp(dx, -d.sc.x, d.sc.w - MIN);
          x = d.sc.x + dd;
          w = d.sc.w - dd;
        }
        if (type.includes("s")) h = clamp(d.sc.h + dy, MIN, 100 - d.sc.y);
        if (type.includes("n")) {
          const dd = clamp(dy, -d.sc.y, d.sc.h - MIN);
          y = d.sc.y + dd;
          h = d.sc.h - dd;
        }
      }

      const newCrop = { x, y, w, h };
      cropRef.current = newCrop;

      // Direct DOM update — zero React overhead
      applyDOMUpdate(newCrop, boundsRef.current);
    };

    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      dragStateRef.current = null;

      // Sync to React state only on drag end
      onChange(cropRef.current);
    };

    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", onUp);

    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onUp);
    };
  }, [applyDOMUpdate, onChange]);

  const HS = 12;

  const handles = [
    { id: "nw", cursor: "nw-resize" },
    { id: "n", cursor: "n-resize" },
    { id: "ne", cursor: "ne-resize" },
    { id: "e", cursor: "e-resize" },
    { id: "se", cursor: "se-resize" },
    { id: "s", cursor: "s-resize" },
    { id: "sw", cursor: "sw-resize" },
    { id: "w", cursor: "w-resize" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black select-none"
      style={{ touchAction: "none" }}
    >
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
          {/* Overlays — positioned via DOM ref, initial position set */}
          <div
            ref={overlayTopRef}
            className="absolute bg-black/65 pointer-events-none"
            style={{ willChange: "top, height" }}
          />
          <div
            ref={overlayBottomRef}
            className="absolute bg-black/65 pointer-events-none"
            style={{ willChange: "top, height" }}
          />
          <div
            ref={overlayLeftRef}
            className="absolute bg-black/65 pointer-events-none"
            style={{ willChange: "left, width" }}
          />
          <div
            ref={overlayRightRef}
            className="absolute bg-black/65 pointer-events-none"
            style={{ willChange: "left, width" }}
          />

          {/* Crop box — positioned via transform3d */}
          <div
            ref={cropBoxRef}
            className="absolute top-0 left-0"
            style={{
              cursor: "move",
              border: "1.5px solid rgba(255,255,255,0.75)",
              outline: "1px solid rgba(139,92,246,0.55)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
              willChange: "transform, width, height",
              touchAction: "none",
            }}
            onPointerDown={(e) => onPointerDown("move", e)}
          >
            {/* Rule-of-thirds grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 inset-x-0 border-t border-white/15" />
              <div className="absolute top-2/3 inset-x-0 border-t border-white/15" />
              <div className="absolute left-1/3 inset-y-0 border-l border-white/15" />
              <div className="absolute left-2/3 inset-y-0 border-l border-white/15" />
            </div>
          </div>

          {/* Handles — positioned via transform3d */}
          {handles.map((h) => (
            <div
              key={h.id}
              ref={(el) => {
                handleRefs.current[h.id] = el;
              }}
              className="absolute top-0 left-0 z-10 bg-white rounded-sm"
              style={{
                width: HS,
                height: HS,
                cursor: h.cursor,
                border: "1.5px solid rgb(139,92,246)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
                touchAction: "none",
                willChange: "transform",
              }}
              onPointerDown={(e) => onPointerDown(h.id, e)}
            />
          ))}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Main ImageEditor
// ═══════════════════════════════════════════════════════════
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

  const [freeResizeCrop, setFreeResizeCrop] = useState<FreeCrop>({
    x: 10,
    y: 10,
    w: 80,
    h: 80,
  });
  const [naturalDims, setNaturalDims] = useState({ w: 0, h: 0 });

  const [transformedSrc, setTransformedSrc] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);
  const transformedSrcRef = useRef("");

  const isFreeMode = ASPECT_OPTIONS[selectedAspect].value === "free";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  // Transform preview generation
  useEffect(() => {
    if (!imageSrc) return;

    const needsFree = isFreeMode && (rotation !== 0 || flipH || flipV);
    const needsFixed = !isFreeMode && (flipH || flipV);

    if (!needsFree && !needsFixed) {
      if (transformedSrcRef.current) {
        URL.revokeObjectURL(transformedSrcRef.current);
        transformedSrcRef.current = "";
      }
      setTransformedSrc("");
      return;
    }

    let cancelled = false;
    setIsTransforming(true);

    const rot = isFreeMode ? rotation : 0;

    createTransformedImageUrl(imageSrc, rot, flipH, flipV)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (transformedSrcRef.current)
          URL.revokeObjectURL(transformedSrcRef.current);
        transformedSrcRef.current = url;
        setTransformedSrc(url);
        setIsTransforming(false);
      })
      .catch(() => {
        if (!cancelled) setIsTransforming(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, rotation, flipH, flipV, isFreeMode]);

  useEffect(() => {
    return () => {
      if (transformedSrcRef.current)
        URL.revokeObjectURL(transformedSrcRef.current);
    };
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const freePreviewSrc = useMemo(() => {
    if (!isFreeMode) return imageSrc;
    return transformedSrc || imageSrc;
  }, [isFreeMode, imageSrc, transformedSrc]);

  const fixedPreviewSrc = useMemo(() => {
    if (isFreeMode) return imageSrc;
    if (flipH || flipV) return transformedSrc || imageSrc;
    return imageSrc;
  }, [isFreeMode, imageSrc, flipH, flipV, transformedSrc]);

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
        const srcForCrop =
          flipH || flipV ? transformedSrc || imageSrc : imageSrc;
        blob = await getCroppedImg(
          srcForCrop,
          croppedAreaPixels,
          rotation,
          false,
          false,
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

  const handleAspectChange = (index: number) => {
    setSelectedAspect(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setFreeResizeCrop({ x: 10, y: 10, w: 80, h: 80 });
  };

  const currentAspect =
    typeof ASPECT_OPTIONS[selectedAspect].value === "number"
      ? (ASPECT_OPTIONS[selectedAspect].value as number)
      : undefined;

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
          disabled={
            isProcessing ||
            isTransforming ||
            (!isFreeMode && !croppedAreaPixels)
          }
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
        {isTransforming && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-8 h-8 text-violet-400" />
            </motion.div>
          </div>
        )}

        {imageSrc &&
          (isFreeMode ? (
            <FreeResizeCrop
              imageSrc={freePreviewSrc}
              crop={freeResizeCrop}
              onChange={setFreeResizeCrop}
              onNaturalDims={(w, h) => setNaturalDims({ w, h })}
            />
          ) : (
            <Cropper
              key={`${currentAspect ?? "ratio"}-${flipH}-${flipV}`}
              image={fixedPreviewSrc}
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

        {/* Transform indicators */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          {flipH && (
            <div className="px-2.5 py-1 rounded-md bg-violet-500/25 backdrop-blur-sm border border-violet-500/40 text-violet-300 text-[11px] bangla flex items-center gap-1.5">
              <FlipHorizontal className="w-3 h-3" />
              অনুভূমিক ফ্লিপ
            </div>
          )}
          {flipV && (
            <div className="px-2.5 py-1 rounded-md bg-violet-500/25 backdrop-blur-sm border border-violet-500/40 text-violet-300 text-[11px] bangla flex items-center gap-1.5">
              <FlipVertical className="w-3 h-3" />
              উল্লম্ব ফ্লিপ
            </div>
          )}
          {isFreeMode && rotation !== 0 && (
            <div className="px-2.5 py-1 rounded-md bg-violet-500/25 backdrop-blur-sm border border-violet-500/40 text-violet-300 text-[11px] bangla flex items-center gap-1.5">
              <RotateCw className="w-3 h-3" />
              ঘোরানো {rotation}°
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-black/90 border-t border-white/10 shrink-0"
      >
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
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-2 bangla">
                  ক্রপ মোড / অনুপাত
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ASPECT_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleAspectChange(i)}
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
