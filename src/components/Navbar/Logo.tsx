// Logo.tsx
import type { FC } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

interface LogoProps {
  onClick?: () => void;
  altText?: string;
  className?: string;
}

const Logo: FC<LogoProps> = ({
  onClick,
  altText = "রয়েল একাডেমি",
  className,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });

    // custom handler first (if provided)
    if (onClick) {
      onClick();
    } else {
      navigate("/");
    }
  };

  if (!onClick)
    return (
      <span
        className={`font-bold text-2xl text-[var(--color-text)] bangla ${
          className ?? ""
        }`}
      >
        {altText}
      </span>
    );

  return (
    <motion.button
      onClick={handleClick}
      aria-label={altText}
      className="flex items-center rounded-md cursor-pointer outline-none overflow-hidden 
                 transition-transform duration-200 bangla"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="bg-[var(--color-text)] text-[var(--color-bg)] px-4 py-2 font-extrabold text-lg md:text-xl">
        রয়েল
      </span>
      <span className="bg-[var(--color-bg)] text-[var(--color-text)] px-4 py-2 font-extrabold text-lg md:text-xl">
        একাডেমি
      </span>
    </motion.button>
  );
};

export default Logo;
