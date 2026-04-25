import { Headset } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import AddComplain from "../Admin/AddNewItem/AddComplain";

const ComplainBtn = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-x-1 bg-[var(--color-text)] text-[var(--color-bg)] text-sm rounded-xl px-3 md:px-5 py-2 md:py-3 fixed right-3 md:right-5 bottom-20 md:bottom-5 z-50 font-bold"
      >
        <Headset className="w-4 h-4" />
        অভিযোগ জানান
      </motion.button>

      <AddComplain isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ComplainBtn;
