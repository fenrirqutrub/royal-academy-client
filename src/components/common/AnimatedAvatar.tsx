// src/components/common/AnimatedAvatar.tsx
import { memo, useEffect, useState, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { User, User2 } from "lucide-react";

export interface AnimatedAvatarProps {
  name?: string;
  url?: string | null;
  color?: string;
  size?: number;
  gender?: "male" | "female";
  onClick?: () => void;
  fallbackIcon?: React.ReactNode;
  className?: string;
  showStatus?: boolean;
  showRings?: boolean;
}

type ImageState = "idle" | "loading" | "loaded" | "error";

export const AnimatedAvatar = memo<AnimatedAvatarProps>(
  ({
    name = "User",
    url,
    color = "#6366f1",
    size = 40,
    gender = "male",
    onClick,
    fallbackIcon,
    className = "",
    showStatus = false,
    showRings = true,
  }) => {
    const [imageState, setImageState] = useState<ImageState>("idle");
    const imgRef = useRef<HTMLImageElement>(null);
    const mountedRef = useRef(true);

    // Validate URL
    const validUrl = url && typeof url === "string" && url.trim() !== "";

    // ═══════════════════════════════════════════════════════════════════════
    // FIX: Preload image এবং cached image handle করা
    // ═══════════════════════════════════════════════════════════════════════
    useLayoutEffect(() => {
      mountedRef.current = true;

      if (!validUrl) {
        setImageState("idle");
        return;
      }

      setImageState("loading");

      // Create a test image to check cache status
      const testImg = new Image();
      testImg.src = url as string;

      const handleLoad = () => {
        if (mountedRef.current) {
          setImageState("loaded");
        }
      };

      const handleError = () => {
        if (mountedRef.current) {
          setImageState("error");
        }
      };

      // Check if already cached/complete
      if (testImg.complete) {
        if (testImg.naturalWidth > 0 && testImg.naturalHeight > 0) {
          // Image is cached and valid
          setImageState("loaded");
        } else {
          // Image failed to load (broken)
          setImageState("error");
        }
      } else {
        // Not cached, wait for load/error
        testImg.onload = handleLoad;
        testImg.onerror = handleError;
      }

      return () => {
        mountedRef.current = false;
        testImg.onload = null;
        testImg.onerror = null;
      };
    }, [url, validUrl]);

    // ═══════════════════════════════════════════════════════════════════════
    // Handle actual img element events (backup)
    // ═══════════════════════════════════════════════════════════════════════
    const handleImgLoad = () => {
      if (mountedRef.current && imageState !== "loaded") {
        setImageState("loaded");
      }
    };

    const handleImgError = () => {
      if (mountedRef.current) {
        setImageState("error");
      }
    };

    // Check ref on mount for already-loaded images
    useEffect(() => {
      const img = imgRef.current;
      if (
        img &&
        img.complete &&
        img.naturalWidth > 0 &&
        imageState === "loading"
      ) {
        setImageState("loaded");
      }
    }, [imageState]);

    // ═══════════════════════════════════════════════════════════════════════
    // Derived state
    // ═══════════════════════════════════════════════════════════════════════
    const showImage =
      validUrl && imageState !== "error" && imageState !== "idle";
    const isLoaded = imageState === "loaded";
    const isLoading = imageState === "loading";

    // Generate initials from name
    const initials = name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Fallback icon
    const FallbackIcon =
      fallbackIcon ??
      (gender === "female" ? (
        <User2 style={{ width: "50%", height: "50%" }} strokeWidth={1.5} />
      ) : (
        <User style={{ width: "50%", height: "50%" }} strokeWidth={1.5} />
      ));

    return (
      <motion.div
        title={name}
        onClick={onClick}
        className={`relative inline-flex select-none isolate ${
          onClick ? "cursor-pointer" : ""
        } ${className}`}
        style={{ width: size, height: size }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {/* Animated ring pulses */}
        {showRings &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `2px solid ${color}`,
              }}
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: [1, 1.25, 1.5],
                opacity: [0, 0.35, 0],
              }}
              transition={{
                duration: 2.5,
                ease: "easeOut",
                repeat: Infinity,
                delay: i * 0.8,
              }}
            />
          ))}

        {/* Main avatar container */}
        <div
          className="relative z-10 h-full w-full overflow-hidden rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${color}ee, ${color})`,
            boxShadow: `0 4px 16px -4px ${color}60`,
          }}
        >
          {/* Image - Always render if valid URL to allow natural loading */}
          {showImage && (
            <img
              ref={imgRef}
              src={url as string}
              alt={name}
              draggable={false}
              loading="eager"
              decoding="sync"
              onLoad={handleImgLoad}
              onError={handleImgError}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.2s ease-out",
                willChange: "opacity",
              }}
            />
          )}

          {/* Fallback - Show when no valid image or still loading */}
          <motion.span
            className="flex h-full w-full items-center justify-center"
            style={{ color: "white" }}
            initial={false}
            animate={{
              opacity: isLoaded ? 0 : 1,
              scale: isLoaded ? 0.8 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {size >= 48 ? (
              <span
                style={{
                  fontSize: size * 0.35,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {initials || "U"}
              </span>
            ) : (
              FallbackIcon
            )}
          </motion.span>

          {/* Loading shimmer - only during actual loading */}
          {isLoading && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}

          {/* Gloss overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)",
            }}
          />
        </div>

        {/* Online status indicator */}
        {showStatus && (
          <motion.div
            className="absolute bottom-0 right-0 z-20 rounded-full border-2 border-[var(--color-bg)]"
            style={{
              width: Math.max(size * 0.24, 10),
              height: Math.max(size * 0.24, 10),
              backgroundColor: "#10b981",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 500,
              damping: 20,
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "#34d399" }}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </motion.div>
    );
  },
);

AnimatedAvatar.displayName = "AnimatedAvatar";
