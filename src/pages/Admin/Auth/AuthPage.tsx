// src/pages/Admin/Auth/AuthPage.tsx
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useNavigate, Link } from "react-router";
import ThemeToggle from "../../../components/Navbar/ThemeToggle";
import axiosPublic from "../../../hooks/axiosPublic";
import type { TeacherData } from "../../../components/Teachers/Teacher";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { toBn } from "../../../utility/shared";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 2.5 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ────────────── Reusable Components ──────────────
interface ChoiceCardProps {
  title: string;
  subtitle: string;
  icon: string;
  gradientBg: string;
  hoverBorderColor: string;
  navigateTo: string;
}

const ChoiceCard = ({
  title,
  subtitle,
  icon,
  gradientBg,
  hoverBorderColor,
  navigateTo,
}: ChoiceCardProps) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ x: 6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate(navigateTo)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderColor: hovered ? hoverBorderColor : undefined,
      }}
      className="group w-full relative flex items-center gap-5 px-6 py-5 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden text-left bg-[var(--color-active-bg)] border border-[var(--color-active-border)]"
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-[var(--color-text-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-200 group-hover:scale-110 ${gradientBg}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-[var(--color-text)] leading-snug">
          {title}
        </p>
        <p className="text-xs text-[var(--color-gray)] mt-1">{subtitle}</p>
      </div>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 bg-[var(--color-bg)]">
        <span className="text-sm font-bold text-[var(--color-gray)] group-hover:text-[var(--color-text-hover)] transition-colors">
          →
        </span>
      </div>
    </motion.button>
  );
};

// ────────────── Main Page ──────────────
const AuthPage = () => {
  const { data, isLoading, isError } = useQuery<TeacherData[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      return (res.data?.data ?? res.data ?? []) as TeacherData[];
    },
    staleTime: 5 * 60_000,
  });

  const teachers = (data ?? []).filter(
    (t) => t.role === "teacher" || t.role === "admin" || t.role === "principal",
  );

  const students = (data ?? []).filter((s) => s.role === "student");

  const getStatNum = (count: number): string => {
    if (isLoading) return "...";
    if (isError) return "?";
    return toBn(count);
  };

  return (
    <div className="bangla w-full min-h-screen bg-[var(--color-bg)] flex relative overflow-hidden">
      {/* Grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]
        bg-[linear-gradient(var(--color-text)_1px,transparent_1px),linear-gradient(90deg,var(--color-text)_1px,transparent_1px)]
        bg-[length:72px_72px]"
      />

      {/* Decorative rings */}
      <div className="pointer-events-none fixed top-[-140px] right-[-140px] w-[420px] h-[420px] rounded-full opacity-[0.05] border-[52px] border-[var(--color-text)]" />
      <div className="pointer-events-none fixed top-[-60px] right-[-60px] w-[250px] h-[250px] rounded-full opacity-[0.06] border-[30px] border-[var(--color-text-hover)]" />
      <div className="pointer-events-none fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full opacity-[0.04] border-[40px] border-[var(--color-text)]" />

      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-1/2 relative flex-col justify-between p-14 border-r border-[var(--color-active-border)]"
      >
        {/* Brand + Theme */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[linear-gradient(135deg,#3b82f6,#6366f1)]">
              <span className="text-white text-base">🎓</span>
            </div>
            <span className="font-bold text-sm tracking-wide text-[var(--color-text)]">
              রয়েল একাডেমি
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Center content */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--color-text-hover)] mb-5">
              শিক্ষার আলো ছড়িয়ে দিন
            </p>
            <h2 className="text-5xl font-black leading-[1.15] text-[var(--color-text)] mb-6">
              জ্ঞানের পথে আপনাকে স্বাগতম।
            </h2>
            <p className="text-sm text-[var(--color-gray)] leading-relaxed">
              রয়েল একাডেমির ডিজিটাল পোর্টালে প্রবেশ করুন — শিক্ষার্থী, শিক্ষক ও
              কর্মীদের জন্য একটি সমন্বিত প্ল্যাটফর্ম।
            </p>

            {/* Not a member */}
            <div className="flex items-start gap-3 mt-5 px-4 py-3.5 rounded-xl bg-[var(--color-active-bg)] border border-[var(--color-active-border)]">
              <span className="text-base mt-0.5 shrink-0">👤</span>
              <p className="text-xs text-[var(--color-gray)] leading-relaxed">
                আপনি যদি শিক্ষার্থী, শিক্ষক বা কর্মী না হন, তাহলে{" "}
                <Link
                  to="/"
                  className="font-semibold underline underline-offset-2 text-[var(--color-text-hover)] hover:opacity-80 transition-opacity"
                >
                  হোমপেজে ফিরে যান
                </Link>
                ।
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex gap-8 mt-10"
          >
            {[
              {
                num: getStatNum(students.length) + "+",
                label: "শিক্ষার্থী",
              },
              { num: getStatNum(teachers.length) + "+", label: "শিক্ষক" },
              { num: "৩+", label: "বছরের অভিজ্ঞতা" },
            ].map((s, index) => (
              <div key={index}>
                <p className="text-2xl text-center font-black text-[var(--color-text)]">
                  {s.num}
                </p>
                <p className="text-sm text-[var(--color-gray)] mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-sm text-[var(--color-gray)]">
          &copy; ২০২৪ রয়েল একাডেমি। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14"
      >
        {/* Mobile top */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex lg:hidden items-center justify-between w-full mb-8"
        >
          <span className="font-bold text-sm text-[var(--color-text)]">
            রয়েল একাডেমির <br /> এডমিন প্যানেলে আপনাকে স্বাগতম।
          </span>
          <ThemeToggle />
        </motion.div>

        {/* Step label */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-[linear-gradient(135deg,#3b82f6,#6366f1)]">
            ?
          </div>
          <span className="text-sm font-semibold tracking-[0.18em] uppercase text-[var(--color-gray)]">
            একটু জানতে চাই
          </span>
        </motion.div>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <div className="h-[72px] flex items-start">
            <TypeAnimation
              sequence={[
                "আপনি কি ",
                300,
                "আপনি কি আমাদের ওয়েবসাইটে",
                400,
                "আপনি কি আমাদের ওয়েবসাইটে প্রথমবার আসছেন?",
                99999,
              ]}
              wrapper="h1"
              speed={72}
              repeat={0}
              cursor
              className="text-[1.75rem] font-black leading-tight text-[var(--color-text)]"
            />
          </div>

          <div className="flex items-center gap-x-2 mt-16">
            <span className="text-base mt-0.5 shrink-0">👤</span>
            <p className="text-sm text-[var(--color-gray)] leading-relaxed">
              আপনি যদি শিক্ষার্থী বা শিক্ষক না হন, তাহলে{" "}
              <Link
                to="/"
                className="font-semibold text-base underline underline-offset-2 text-[var(--color-text-hover)] hover:opacity-80 transition-opacity"
              >
                হোমপেজে ফিরে যান
              </Link>
              ।
            </p>
          </div>
        </motion.div>

        {/* Choice Cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="w-full flex flex-col gap-4"
        >
          <ChoiceCard
            title="হ্যাঁ, প্রথমবার এসেছি"
            subtitle="নতুন অ্যাকাউন্ট তৈরি করে শুরু করুন"
            icon="👋"
            gradientBg="bg-[rgba(59,130,246,0.12)]"
            hoverBorderColor="#3b82f6"
            navigateTo="/signup"
          />
          <ChoiceCard
            title="না, আগেও এসেছি"
            subtitle="পুরনো অ্যাকাউন্টে লগইন করুন"
            icon="🔑"
            gradientBg="bg-[rgba(99,102,241,0.12)]"
            hoverBorderColor="#6366f1"
            navigateTo="/login"
          />
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="flex items-center justify-center gap-x-2 mt-8"
        >
          <TriangleAlert className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-500">
            শুধুমাত্র নিবন্ধিত সদস্যদের জন্য — অননুমোদিত প্রবেশ নিষিদ্ধ!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
