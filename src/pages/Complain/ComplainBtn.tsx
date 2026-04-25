import { Headset } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import AddComplain from "../Admin/AddNewItem/AddComplain";

const ComplainBtn = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-3 md:right-5 bottom-20 md:bottom-5 z-50"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <motion.button
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={handleClick}
            className="flex items-center rounded-full px-[17px] py-[13px] bg-[var(--color-text)] text-[var(--color-bg)] cursor-pointer outline-none select-none shadow-md"
          >
            <motion.span
              animate={
                hovered
                  ? { rotate: [-10, 8, -5, 0], scale: [1.12, 1.08, 1.1, 1] }
                  : { rotate: 0, scale: 1 }
              }
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className="flex items-center"
            >
              <Headset size={19} strokeWidth={2.2} />
            </motion.span>

            <AnimatePresence>
              {hovered && (
                <motion.span
                  key="label"
                  initial={{ opacity: 0, width: 0, marginLeft: 0, x: 8 }}
                  animate={{ opacity: 1, width: "auto", marginLeft: 9, x: 0 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0, x: 8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  অভিযোগ জানান
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm px-4 py-2 rounded-lg bg-[var(--color-text)] text-[var(--color-bg)]"
            >
              ✨ অভিযোগ পাঠানো হয়েছে
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AddComplain isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ComplainBtn;
