import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, User2 } from "lucide-react";

export interface AvatarProps {
  name?: string;
  url?: string | null;
  color?: string;
  size?: number;
  gender?: "male" | "female";
  onClick?: () => void;
  fallbackIcon?: React.ReactNode;
  className?: string;
}

export const Avatar = memo<AvatarProps>(
  ({
    name = "User",
    url,
    color = "#6366f1",
    size = 40,
    gender = "male",
    onClick,
    fallbackIcon,
    className = "",
  }) => {
    const [imgErr, setImgErr] = useState(false);
    useEffect(() => setImgErr(false), [url]);

    const Fallback =
      fallbackIcon ??
      (gender === "female" ? (
        <User2 className="w-[55%] h-[55%]" strokeWidth={1.8} />
      ) : (
        <User className="w-[55%] h-[55%]" strokeWidth={1.8} />
      ));

    return (
      <motion.div
        title={name}
        onClick={onClick}
        className={`relative inline-flex select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
        style={{ width: size, height: size }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className="relative z-10 h-full w-full overflow-hidden rounded-full flex items-center justify-center text-white font-semibold"
          style={{
            backgroundImage: `linear-gradient(135deg, ${color}CC, ${color})`,
          }}
        >
          {url && !imgErr ? (
            <img
              src={url}
              alt={name}
              draggable={false}
              onError={() => setImgErr(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-white/90">
              {Fallback}
            </span>
          )}
          {/* gloss */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,.28), transparent 55%)",
            }}
          />
        </div>
      </motion.div>
    );
  },
);
Avatar.displayName = "Avatar";
