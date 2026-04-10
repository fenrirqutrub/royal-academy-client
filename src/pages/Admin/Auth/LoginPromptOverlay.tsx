import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Key, LockKeyhole, UserPlus } from "lucide-react";

const LoginPromptOverlay = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mt-2 mb-10"
    >
      {/* উপর থেকে fade blur effect */}
      <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[var(--color-bg)] z-10 pointer-events-none" />

      {/* Prompt box */}
      <div className="relative z-20 mx-2 sm:mx-0 rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)] px-6 py-8 flex flex-col justify-center items-center bangla shadow-xl">
        <LockKeyhole className="w-10 h-10 my-5" />

        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--color-text)] mb-2">
          সব তথ্য দেখতে লগইন করুন
        </h3>
        <p className="text-sm text-[var(--color-gray)] mb-6">
          সম্পূর্ণ পাঠ্যক্রম ও পরীক্ষার তথ্য দেখতে আপনার অ্যাকাউন্টে প্রবেশ
          করুন।
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Key className="w-4 h-4" />
            লগইন করুন
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-[var(--color-active-border)] text-[var(--color-text)] font-bold text-sm hover:bg-[var(--color-active-bg)] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            নতুন অ্যাকাউন্ট খুলুন
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPromptOverlay;
