import React from "react";
import { IoMdMail } from "react-icons/io";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";

interface SocialItem {
  key: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  link: string;
}

const socials: SocialItem[] = [
  {
    key: "facebook",
    Icon: FaFacebook,
    color: "#1877f2",
    link: "https://www.facebook.com/royalacademybelkuchi",
  },
  {
    key: "whatsapp",
    Icon: FaWhatsapp,
    color: "#25d366",
    link: "https://wa.me/8801804558226",
  },
  {
    key: "gmail",
    Icon: IoMdMail,
    color: "#ea4335",
    link: "mailto:royalacademybelkuchi@gmail.com",
  },
];

export const PHONE_NUMBERS = [
  { display: "০১৬৫০-০৩৩১৮১", tel: "01650033181" },
  { display: "০১৮০৪-৫৫৮২২৬", tel: "01804558226" },
];

const SocialButton: React.FC<{ item: SocialItem; index: number }> = ({
  item,
  index,
}) => (
  <motion.a
    href={item.link}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ scale: 1.15 }}
    whileTap={{ scale: 0.92 }}
    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border border-gray-500 text-gray-400 transition-colors duration-300"
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLElement;
      el.style.color = "#fff";
      el.style.borderColor = item.color;
      el.style.backgroundColor = item.color;
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLElement;
      el.style.color = "";
      el.style.borderColor = "";
      el.style.backgroundColor = "";
    }}
  >
    <item.Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  </motion.a>
);

const Social: React.FC = () => (
  <div className="flex items-center justify-end gap-2 sm:gap-3 pt-3">
    {socials.map((item, index) => (
      <SocialButton key={item.key} item={item} index={index} />
    ))}
  </div>
);

export default React.memo(Social);
