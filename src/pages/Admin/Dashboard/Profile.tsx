// src/pages/dashboard/shared/Profile.tsx
import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Check,
  Pencil,
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Heart,
  BookOpen,
  CalendarDays,
  PhoneCall,
  Building2,
  Hash,
  School,
  Copy,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import axiosPublic from "../../../hooks/axiosPublic";
import { useAuth } from "../../../context/AuthContext";
import DatePicker from "../../../components/common/Datepicker";
import SelectInput from "../../../components/common/SelectInput";
import Skeleton from "../../../components/common/Skeleton";
import { getDivisions, getDistricts, getThanas } from "../../../data/bd-geo";
import { AnimatedAvatar } from "../../../components/common/AnimatedAvatar";
import { uploadToCloudinaryDirect } from "../../../hooks/useCloudinaryUpload";

import {
  ROLE_CONFIG,
  CLASS_OPTIONS,
  toLocalIso,
  validateBdPhone,
  type UserRole,
  SUBJECT_REQUIRED_CLASSES,
  SUBJECT_GROUPS,
  DEGREE_LABEL,
  DEGREE_SELECT_OPTIONS,
  YEARS,
  RELIGION_SELECT_OPTIONS,
} from "../../../utility/Constants";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface ProfileData {
  name?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  gender?: string;
  religion?: string;
  gramNam?: string;
  para?: string;
  thana?: string;
  district?: string;
  division?: string;
  landmark?: string;
  permanentSameAsPresent?: boolean;
  permanentGramNam?: string;
  permanentPara?: string;
  permanentThana?: string;
  permanentDistrict?: string;
  permanentDivision?: string;
  studentClass?: string;
  studentSubject?: string;
  roll?: string;
  schoolName?: string;
  collegeName?: string;
  qualification?: string;
  educationComplete?: boolean;
  degree?: string;
  currentYear?: string;
  avatar?: { url?: string; publicId?: string };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const formatDOB = (dob: string | null | undefined): string | null => {
  if (!dob) return null;
  try {
    return new Date(dob).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dob;
  }
};

/* ─── Animation Variants ──────────────────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 25 },
  },
};

/* ─── GlassCard ───────────────────────────────────────────────────────────── */

const GlassCard = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    transition={{ delay }}
    className={`relative rounded-3xl overflow-hidden bg-[var(--color-bg)]
      border border-[var(--color-active-border)] shadow-lg ${className}`}
  >
    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-active-bg)] to-transparent" />
    </div>
    <div className="relative">{children}</div>
  </motion.div>
);

/* ─── SectionHeader ───────────────────────────────────────────────────────── */

const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-[var(--color-active-border)]">
    <motion.div
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.5 }}
      className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--color-active-bg)]"
    >
      <span className="text-[var(--color-text-hover)]">{icon}</span>
    </motion.div>
    <h3 className="text-lg font-bold bangla text-[var(--color-text)]">
      {title}
    </h3>
  </div>
);

/* ─── FieldDisplay ────────────────────────────────────────────────────────── */

const FieldDisplay = ({
  icon,
  label,
  value,
  optional,
  roleColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  optional?: boolean;
  roleColor?: string;
}) => {
  const missing = !value;
  return (
    <motion.div
      layout
      className="group relative px-6 py-4 border-b border-[var(--color-active-border)] last:border-0"
    >
      <div className="flex items-start gap-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--color-active-bg)]"
        >
          <span className="text-[var(--color-gray)]">{icon}</span>
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider bangla text-[var(--color-gray)] mb-1">
            {label}
            {optional && (
              <span className="ml-1.5 normal-case tracking-normal opacity-50">
                (ঐচ্ছিক)
              </span>
            )}
          </p>
          <motion.p
            layout
            className={`text-base font-medium bangla truncate ${
              missing
                ? "italic text-[var(--color-gray)] opacity-60"
                : "text-[var(--color-text)]"
            }`}
          >
            {missing ? (
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                তথ্য যোগ করুন
              </span>
            ) : (
              value
            )}
          </motion.p>
        </div>
        {!missing && (
          <motion.div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4" style={{ color: roleColor }} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/* ─── TextInput ───────────────────────────────────────────────────────────── */

const TextInput = ({
  icon,
  label,
  name,
  value,
  type = "text",
  placeholder,
  optional,
  onChange,
  roleColor,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  roleColor?: string;
}) => (
  <motion.div layout className="space-y-2 mb-4">
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bangla text-[var(--color-gray)]">
      <span>{icon}</span>
      {label}
      {optional && (
        <span className="normal-case tracking-normal opacity-50">(ঐচ্ছিক)</span>
      )}
    </label>
    <div className="relative group">
      <input
        name={name}
        type={type}
        defaultValue={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-sm rounded-2xl px-4 py-3 pl-11 outline-none bangla transition-all duration-300
          bg-[var(--color-active-bg)] border-2 border-[var(--color-active-border)]
          text-[var(--color-text)] placeholder:text-[var(--color-gray)] placeholder:opacity-50
          focus:border-[var(--color-text-hover)] focus:bg-[var(--color-bg)]
          hover:border-[var(--color-text-hover)]/50"
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${roleColor}20`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-gray)] group-focus-within:text-[var(--color-text-hover)] transition-colors">
        {icon}
      </span>
    </div>
  </motion.div>
);

/* ─── PasswordInput ───────────────────────────────────────────────────────── */

const PasswordInput = ({
  onChange,
  roleColor,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  roleColor?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <motion.div layout className="space-y-2 mb-4">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bangla text-[var(--color-gray)]">
        <Lock className="w-3.5 h-3.5" />
        নতুন পাসওয়ার্ড
        <span className="normal-case tracking-normal opacity-50">(ঐচ্ছিক)</span>
      </label>
      <div className="relative group">
        <input
          name="password"
          type={show ? "text" : "password"}
          onChange={onChange}
          placeholder="পরিবর্তন না করলে ফাঁকা রাখুন"
          className="w-full text-sm rounded-2xl px-4 py-3 pl-11 pr-12 outline-none bangla transition-all duration-300
            bg-[var(--color-active-bg)] border-2 border-[var(--color-active-border)]
            text-[var(--color-text)] placeholder:text-[var(--color-gray)] placeholder:opacity-50
            focus:border-[var(--color-text-hover)] focus:bg-[var(--color-bg)]
            hover:border-[var(--color-text-hover)]/50"
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 3px ${roleColor}20`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-gray)]">
          <Lock className="w-4 h-4" />
        </span>
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl
            text-[var(--color-gray)] hover:text-[var(--color-text-hover)]
            hover:bg-[var(--color-active-bg)] transition-all"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
};

/* ─── ProfileCompletion ───────────────────────────────────────────────────── */

const ProfileCompletion = ({
  missing,
  total,
  roleColor,
}: {
  missing: number;
  total: number;
  roleColor: string;
}) => {
  const completed = total - missing;
  const percentage = Math.round((completed / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 rounded-2xl bg-[var(--color-active-bg)] border border-[var(--color-active-border)]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold bangla text-[var(--color-gray)]">
          প্রোফাইল সম্পূর্ণতা
        </span>
        <span className="text-xs font-bold" style={{ color: roleColor }}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-bg)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${roleColor}80, ${roleColor})`,
          }}
        />
      </div>
      {missing > 0 && (
        <p className="mt-2 text-xs bangla text-[var(--color-gray)] flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3" />
          আরও {missing}টি তথ্য যোগ করুন
        </p>
      )}
    </motion.div>
  );
};

/* ─── FieldLabel ──────────────────────────────────────────────────────────── */

const FieldLabel = ({
  icon,
  label,
  optional,
}: {
  icon: React.ReactNode;
  label: string;
  optional?: boolean;
}) => (
  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bangla text-[var(--color-gray)]">
    {icon}
    {label}
    {optional && (
      <span className="normal-case tracking-normal opacity-50">(ঐচ্ছিক)</span>
    )}
  </label>
);

/* ════════════════════════════════════════════════════════════════════════════
   PROFILE PAGE
════════════════════════════════════════════════════════════════════════════ */

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const slug = user?.slug ?? "";

  // Role config from Constants — no local duplicate
  const role = (user?.role ?? "teacher") as UserRole;
  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.teacher;
  const roleColor = roleConfig.color;

  const isStudent = role === "student";
  const isHardcoded = user?.isHardcoded ?? false;

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Geo state — present address
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");

  // Geo state — permanent address
  const [pDivision, setPDivision] = useState("");
  const [pDistrict, setPDistrict] = useState("");
  const [pThana, setPThana] = useState("");

  // DOB
  const [dobDisplay, setDobDisplay] = useState("");
  const [dobIso, setDobIso] = useState("");

  /* ── Fetch profile ── */
  const { data: profileRes, isLoading } = useQuery({
    queryKey: ["profile", slug],
    queryFn: async () =>
      (await axiosPublic.get(`/api/users/${slug}/profile`)).data,
    enabled: !!slug,
  });
  const profile = profileRes?.data as ProfileData | undefined;

  /* ── Update mutation ── */
  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) =>
      (await axiosPublic.patch(`/api/users/${slug}/profile`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", slug] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে! ✨");
      setEditing(false);
      setFormData({});
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? "আপডেট ব্যর্থ"),
  });

  /* ── Avatar mutation ── */
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadToCloudinaryDirect(file, "avatars");
      return (
        await axiosPublic.patch(`/api/users/${slug}/profile`, {
          avatar: { url: result.secure_url, publicId: result.public_id },
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", slug] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("ছবি আপডেট হয়েছে! 📸");
    },
    onError: () => toast.error("ছবি আপলোড ব্যর্থ"),
  });

  /* ── Handlers ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelectChange = (name: string, val: string) =>
    setFormData((prev) => ({ ...prev, [name]: val }));

  const cancelEditing = () => {
    setEditing(false);
    setFormData({});
  };

  const startEditing = () => {
    setDivision(profile?.division ?? "");
    setDistrict(profile?.district ?? "");
    setThana(profile?.thana ?? "");
    setPDivision(profile?.permanentDivision ?? "");
    setPDistrict(profile?.permanentDistrict ?? "");
    setPThana(profile?.permanentThana ?? "");
    setDobDisplay("");
    setDobIso(
      profile?.dateOfBirth ? toLocalIso(new Date(profile.dateOfBirth)) : "",
    );
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = () => {
    const payload: Record<string, string> = { ...formData };

    // Phone validation
    if (payload.phone) {
      const result = validateBdPhone(payload.phone);
      if (result !== true) {
        toast.error(result);
        return;
      }
    }

    // Geo fields
    if (division) payload.division = division;
    if (district) payload.district = district;
    if (thana) payload.thana = thana;
    if (pDivision) payload.permanentDivision = pDivision;
    if (pDistrict) payload.permanentDistrict = pDistrict;
    if (pThana) payload.permanentThana = pThana;
    if (dobIso) payload.dateOfBirth = dobIso;

    // Empty password → don't send
    if (!payload.password) delete payload.password;

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }
    updateMutation.mutate(payload);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    toast.success("ID কপি হয়েছে! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Derived values (memoized) ── */

  // Student class for subject-show logic
  const selectedStudentClass =
    formData.studentClass ?? profile?.studentClass ?? "";
  const shouldShowSubject =
    SUBJECT_REQUIRED_CLASSES.includes(selectedStudentClass);

  // Education incomplete check
  const educationIncomplete =
    formData.educationComplete === "false" ||
    (formData.educationComplete === undefined &&
      profile?.educationComplete === false);

  // Geo options
  const divisionOptions = useMemo(
    () => getDivisions().map((v) => ({ value: v, label: v })),
    [],
  );
  const districtOptions = useMemo(
    () =>
      division
        ? getDistricts(division).map((v) => ({ value: v, label: v }))
        : [],
    [division],
  );
  const thanaOptions = useMemo(
    () =>
      division && district
        ? getThanas(division, district).map((v) => ({ value: v, label: v }))
        : [],
    [division, district],
  );
  const pDistrictOptions = useMemo(
    () =>
      pDivision
        ? getDistricts(pDivision).map((v) => ({ value: v, label: v }))
        : [],
    [pDivision],
  );
  const pThanaOptions = useMemo(
    () =>
      pDivision && pDistrict
        ? getThanas(pDivision, pDistrict).map((v) => ({ value: v, label: v }))
        : [],
    [pDivision, pDistrict],
  );

  // Profile completion
  const missingFields = useMemo(
    () =>
      [
        profile?.phone,
        profile?.gramNam,
        profile?.thana,
        profile?.district,
        profile?.fatherName,
        profile?.motherName,
        profile?.dateOfBirth,
        profile?.religion,
      ].filter((v) => !v).length,
    [profile],
  );

  if (isLoading)
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Skeleton variant="profile" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: roleColor }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: roleColor }}
        />
      </div>

      <main className="relative w-full max-w-4xl mx-auto px-4 py-8 lg:py-12">
        <LayoutGroup>
          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-black bangla text-[var(--color-text)]">
              আমার প্রোফাইল
            </h1>
            <p className="text-base md:text-lg mt-1 bangla text-[var(--color-gray)]">
              আপনার ব্যক্তিগত তথ্য পরিচালনা ও আপডেট করুন
            </p>
          </motion.div>

          {/* ── Hero Card ── */}
          <GlassCard delay={0.05} className="mb-6">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <motion.div
                  layout
                  className="relative flex-shrink-0"
                  whileHover={{ scale: 1.02 }}
                >
                  <AnimatedAvatar
                    name={profile?.name ?? user?.name ?? "User"}
                    url={profile?.avatar?.url ?? null}
                    color={roleColor}
                    size={120}
                    showRings
                    showStatus
                  />
                  <motion.button
                    whileHover={{ scale: 1.15, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarMutation.isPending}
                    className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full
                      flex items-center justify-center cursor-pointer
                      bg-[var(--color-bg)] border-2 border-[var(--color-active-border)]
                      shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {avatarMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--color-gray)]" />
                    ) : (
                      <Camera className="w-5 h-5 text-[var(--color-text)]" />
                    )}
                  </motion.button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) avatarMutation.mutate(f);
                    }}
                  />
                </motion.div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left min-w-0">
                  <motion.h2
                    layout
                    className="text-xl md:text-2xl font-bold bangla text-[var(--color-text)] truncate"
                  >
                    {profile?.name ?? user?.name ?? "—"}
                  </motion.h2>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                    {/* Role Badge */}
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bangla"
                      style={{
                        background: `${roleColor}15`,
                        color: roleColor,
                        border: `1px solid ${roleColor}30`,
                      }}
                    >
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: roleColor }}
                      />
                      {roleConfig.label}
                    </motion.span>

                    {/* Slug Copy */}
                    {slug && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          text-xs font-mono font-bold cursor-pointer
                          bg-[var(--color-active-bg)] border border-[var(--color-active-border)]
                          text-[var(--color-gray)] hover:text-[var(--color-text)]
                          hover:border-[var(--color-text-hover)] transition-all"
                      >
                        <Hash className="w-3 h-3" />
                        {slug}
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.span
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check className="w-3 h-3 text-emerald-500" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Copy className="w-3 h-3" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )}

                    {/* Admin/Owner shield */}
                    {(role === "admin" || role === "owner") && (
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="p-1.5 rounded-full"
                        style={{
                          background: `${roleColor}15`,
                          border: `1px solid ${roleColor}30`,
                        }}
                      >
                        <ShieldCheck
                          className="w-4 h-4"
                          style={{ color: roleColor }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Profile Completion */}
                  {!isHardcoded && !editing && (
                    <ProfileCompletion
                      missing={missingFields}
                      total={8}
                      roleColor={roleColor}
                    />
                  )}
                </div>

                {/* Edit / Save Button */}
                {!isHardcoded && (
                  <motion.div layout className="flex-shrink-0">
                    <AnimatePresence mode="wait">
                      {editing ? (
                        <motion.div
                          key="save-controls"
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="flex gap-2"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl
                              text-sm font-bold bangla text-white
                              bg-emerald-500 hover:bg-emerald-600
                              shadow-lg shadow-emerald-500/20
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            সংরক্ষণ
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={cancelEditing}
                            className="p-2.5 rounded-2xl
                              bg-[var(--color-active-bg)] border border-[var(--color-active-border)]
                              text-[var(--color-gray)] hover:text-[var(--color-text)]
                              hover:border-[var(--color-text-hover)] transition-all"
                          >
                            <X className="w-5 h-5" />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="edit-btn"
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={startEditing}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl
                            text-sm font-bold bangla
                            bg-[var(--color-active-bg)] border border-[var(--color-active-border)]
                            text-[var(--color-text)] hover:bg-[var(--color-bg)]
                            hover:border-[var(--color-text-hover)] transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                          সম্পাদনা
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* ── Content Cards ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* ══ Personal Info ══ */}
            <GlassCard delay={0.1}>
              <SectionHeader
                icon={<User className="w-5 h-5" />}
                title="ব্যক্তিগত তথ্য"
              />
              <div className="py-2">
                {!editing ? (
                  <>
                    <FieldDisplay
                      icon={<User className="w-4 h-4" />}
                      label="পূর্ণ নাম"
                      value={profile?.name ?? user?.name}
                      roleColor={roleColor}
                    />
                    {!isHardcoded && (
                      <>
                        <FieldDisplay
                          icon={<User className="w-4 h-4" />}
                          label="বাবার নাম"
                          value={profile?.fatherName}
                          roleColor={roleColor}
                        />
                        <FieldDisplay
                          icon={<User className="w-4 h-4" />}
                          label="মায়ের নাম"
                          value={profile?.motherName}
                          roleColor={roleColor}
                        />
                        <FieldDisplay
                          icon={<CalendarDays className="w-4 h-4" />}
                          label="জন্ম তারিখ"
                          value={formatDOB(profile?.dateOfBirth)}
                          roleColor={roleColor}
                        />
                        <FieldDisplay
                          icon={<Heart className="w-4 h-4" />}
                          label="ধর্ম"
                          value={profile?.religion}
                          roleColor={roleColor}
                        />
                      </>
                    )}
                    <FieldDisplay
                      icon={<User className="w-4 h-4" />}
                      label="লিঙ্গ"
                      value={profile?.gender}
                      roleColor={roleColor}
                    />
                  </>
                ) : (
                  <div className="px-6 py-4">
                    <TextInput
                      icon={<User className="w-4 h-4" />}
                      label="পূর্ণ নাম"
                      name="name"
                      value={profile?.name}
                      placeholder="পূর্ণ নাম বাংলায়"
                      onChange={handleChange}
                      roleColor={roleColor}
                    />
                    {!isHardcoded && (
                      <>
                        <TextInput
                          icon={<User className="w-4 h-4" />}
                          label="বাবার নাম"
                          name="fatherName"
                          value={profile?.fatherName}
                          placeholder="বাবার পূর্ণ নাম"
                          onChange={handleChange}
                          roleColor={roleColor}
                        />
                        <TextInput
                          icon={<User className="w-4 h-4" />}
                          label="মায়ের নাম"
                          name="motherName"
                          value={profile?.motherName}
                          placeholder="মায়ের পূর্ণ নাম"
                          onChange={handleChange}
                          roleColor={roleColor}
                        />
                        {/* DOB */}
                        <div className="space-y-2 mb-4">
                          <FieldLabel
                            icon={<CalendarDays className="w-3.5 h-3.5" />}
                            label="জন্ম তারিখ"
                          />
                          <DatePicker
                            value={
                              dobDisplay ||
                              (profile?.dateOfBirth
                                ? (formatDOB(profile.dateOfBirth) ?? "")
                                : "")
                            }
                            onChange={setDobDisplay}
                            onDateChange={(date) => {
                              if (!isNaN(date.getTime()))
                                setDobIso(toLocalIso(date));
                            }}
                            placeholder="জন্ম তারিখ বেছে নিন"
                            maxDate={new Date()}
                          />
                        </div>
                        {/* Religion */}
                        <div className="space-y-2 mb-4">
                          <FieldLabel
                            icon={<Heart className="w-3.5 h-3.5" />}
                            label="ধর্ম"
                          />
                          <SelectInput
                            options={RELIGION_SELECT_OPTIONS}
                            value={formData.religion ?? profile?.religion ?? ""}
                            onChange={(v) => handleSelectChange("religion", v)}
                            placeholder="ধর্ম বেছে নিন"
                          />
                        </div>
                      </>
                    )}
                    {/* Gender — read-only */}
                    <div className="space-y-2">
                      <FieldLabel
                        icon={<User className="w-3.5 h-3.5" />}
                        label="লিঙ্গ"
                        optional
                      />
                      <div
                        className="w-full text-sm rounded-2xl px-4 py-3 bangla
                        opacity-60 cursor-not-allowed
                        bg-[var(--color-active-bg)] border border-[var(--color-active-border)]
                        text-[var(--color-text)]"
                      >
                        {profile?.gender ?? "—"}
                        <span className="ml-2 text-xs opacity-60">
                          (পরিবর্তনযোগ্য নয়)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* ══ Contact ══ */}
            <GlassCard delay={0.15}>
              <SectionHeader
                icon={<Phone className="w-5 h-5" />}
                title="যোগাযোগ"
              />
              <div className="py-2">
                {!editing ? (
                  <>
                    <FieldDisplay
                      icon={<Phone className="w-4 h-4" />}
                      label="ফোন নম্বর"
                      value={profile?.phone}
                      roleColor={roleColor}
                    />
                    <FieldDisplay
                      icon={<Mail className="w-4 h-4" />}
                      label="ইমেইল"
                      value={
                        isHardcoded
                          ? (user?.email ?? null)
                          : (profile?.email ?? user?.email)
                      }
                      optional={!isHardcoded}
                      roleColor={roleColor}
                    />
                    {!isHardcoded && (
                      <FieldDisplay
                        icon={<PhoneCall className="w-4 h-4" />}
                        label="জরুরি যোগাযোগ"
                        value={profile?.emergencyContact}
                        optional
                        roleColor={roleColor}
                      />
                    )}
                  </>
                ) : (
                  <div className="px-6 py-4">
                    <TextInput
                      icon={<Phone className="w-4 h-4" />}
                      label="ফোন নম্বর"
                      name="phone"
                      type="tel"
                      value={profile?.phone}
                      placeholder="01XXXXXXXXX"
                      onChange={handleChange}
                      roleColor={roleColor}
                    />
                    {!isStudent && (
                      <TextInput
                        icon={<Mail className="w-4 h-4" />}
                        label="ইমেইল"
                        name="email"
                        type="email"
                        value={profile?.email}
                        placeholder="example@email.com"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                    )}
                    <TextInput
                      icon={<PhoneCall className="w-4 h-4" />}
                      label="জরুরি যোগাযোগ"
                      name="emergencyContact"
                      type="tel"
                      value={profile?.emergencyContact}
                      placeholder="অভিভাবকের নম্বর"
                      optional
                      onChange={handleChange}
                      roleColor={roleColor}
                    />
                  </div>
                )}
              </div>
            </GlassCard>

            {/* ══ Present Address ══ */}
            {!isHardcoded && (
              <GlassCard delay={0.2}>
                <SectionHeader
                  icon={<MapPin className="w-5 h-5" />}
                  title="বর্তমান ঠিকানা"
                />
                <div className="py-2">
                  {!editing ? (
                    <>
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="গ্রাম/মহল্লা"
                        value={profile?.gramNam}
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="পাড়া"
                        value={profile?.para}
                        optional
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<Building2 className="w-4 h-4" />}
                        label="থানা/উপজেলা"
                        value={profile?.thana}
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="জেলা"
                        value={profile?.district}
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="বিভাগ"
                        value={profile?.division}
                        optional
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="পরিচিত স্থান"
                        value={profile?.landmark}
                        optional
                        roleColor={roleColor}
                      />
                    </>
                  ) : (
                    <div className="px-6 py-4">
                      <TextInput
                        icon={<MapPin className="w-4 h-4" />}
                        label="গ্রাম/মহল্লা"
                        name="gramNam"
                        value={profile?.gramNam}
                        placeholder="গ্রাম বা মহল্লার নাম"
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                      <TextInput
                        icon={<MapPin className="w-4 h-4" />}
                        label="পাড়া"
                        name="para"
                        value={profile?.para}
                        placeholder="পাড়ার নাম"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                      {/* Division */}
                      <div className="space-y-2 mb-4">
                        <FieldLabel
                          icon={<MapPin className="w-3.5 h-3.5" />}
                          label="বিভাগ"
                        />
                        <SelectInput
                          options={divisionOptions}
                          value={division}
                          onChange={(v) => {
                            setDivision(v);
                            setDistrict("");
                            setThana("");
                          }}
                          placeholder="বিভাগ নির্বাচন করুন"
                        />
                      </div>
                      {/* District + Thana */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <FieldLabel
                            icon={<MapPin className="w-3.5 h-3.5" />}
                            label="জেলা"
                          />
                          <SelectInput
                            options={districtOptions}
                            value={district}
                            onChange={(v) => {
                              setDistrict(v);
                              setThana("");
                            }}
                            placeholder={division ? "জেলা বাছুন" : "বিভাগ আগে"}
                            disabled={!division}
                          />
                        </div>
                        <div className="space-y-2">
                          <FieldLabel
                            icon={<Building2 className="w-3.5 h-3.5" />}
                            label="থানা"
                          />
                          <SelectInput
                            options={thanaOptions}
                            value={thana}
                            onChange={setThana}
                            placeholder={district ? "থানা বাছুন" : "জেলা আগে"}
                            disabled={!district}
                          />
                        </div>
                      </div>
                      <TextInput
                        icon={<MapPin className="w-4 h-4" />}
                        label="পরিচিত স্থান"
                        name="landmark"
                        value={profile?.landmark}
                        placeholder="মসজিদ / বাজার / স্কুলের কাছে"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* ══ Permanent Address ══ */}
            {!isHardcoded && !profile?.permanentSameAsPresent && (
              <GlassCard delay={0.25}>
                <SectionHeader
                  icon={<MapPin className="w-5 h-5" />}
                  title="স্থায়ী ঠিকানা"
                />
                <div className="py-2">
                  {!editing ? (
                    <>
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="গ্রাম/মহল্লা"
                        value={profile?.permanentGramNam}
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="পাড়া"
                        value={profile?.permanentPara}
                        optional
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<Building2 className="w-4 h-4" />}
                        label="থানা/উপজেলা"
                        value={profile?.permanentThana}
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="জেলা"
                        value={profile?.permanentDistrict}
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<MapPin className="w-4 h-4" />}
                        label="বিভাগ"
                        value={profile?.permanentDivision}
                        optional
                        roleColor={roleColor}
                      />
                    </>
                  ) : (
                    <div className="px-6 py-4">
                      <TextInput
                        icon={<MapPin className="w-4 h-4" />}
                        label="গ্রাম/মহল্লা"
                        name="permanentGramNam"
                        value={profile?.permanentGramNam}
                        placeholder="গ্রাম বা মহল্লার নাম"
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                      <TextInput
                        icon={<MapPin className="w-4 h-4" />}
                        label="পাড়া"
                        name="permanentPara"
                        value={profile?.permanentPara}
                        placeholder="পাড়ার নাম"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                      <div className="space-y-2 mb-4">
                        <FieldLabel
                          icon={<MapPin className="w-3.5 h-3.5" />}
                          label="বিভাগ"
                        />
                        <SelectInput
                          options={divisionOptions}
                          value={pDivision}
                          onChange={(v) => {
                            setPDivision(v);
                            setPDistrict("");
                            setPThana("");
                          }}
                          placeholder="বিভাগ নির্বাচন করুন"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <FieldLabel
                            icon={<MapPin className="w-3.5 h-3.5" />}
                            label="জেলা"
                          />
                          <SelectInput
                            options={pDistrictOptions}
                            value={pDistrict}
                            onChange={(v) => {
                              setPDistrict(v);
                              setPThana("");
                            }}
                            placeholder={pDivision ? "জেলা বাছুন" : "বিভাগ আগে"}
                            disabled={!pDivision}
                          />
                        </div>
                        <div className="space-y-2">
                          <FieldLabel
                            icon={<Building2 className="w-3.5 h-3.5" />}
                            label="থানা"
                          />
                          <SelectInput
                            options={pThanaOptions}
                            value={pThana}
                            onChange={setPThana}
                            placeholder={pDistrict ? "থানা বাছুন" : "জেলা আগে"}
                            disabled={!pDistrict}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* ══ Student Education ══ */}
            {isStudent && !isHardcoded && (
              <GlassCard delay={0.3}>
                <SectionHeader
                  icon={<GraduationCap className="w-5 h-5" />}
                  title="শিক্ষা তথ্য"
                />
                <div className="py-2">
                  {!editing ? (
                    <>
                      <FieldDisplay
                        icon={<GraduationCap className="w-4 h-4" />}
                        label="শ্রেণি"
                        value={profile?.studentClass}
                        roleColor={roleColor}
                      />
                      {SUBJECT_REQUIRED_CLASSES.includes(
                        profile?.studentClass ?? "",
                      ) && (
                        <FieldDisplay
                          icon={<BookOpen className="w-4 h-4" />}
                          label="বিভাগ"
                          value={profile?.studentSubject}
                          optional
                          roleColor={roleColor}
                        />
                      )}
                      <FieldDisplay
                        icon={<Hash className="w-4 h-4" />}
                        label="রোল নম্বর"
                        value={profile?.roll}
                        optional
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<School className="w-4 h-4" />}
                        label="বিদ্যালয়"
                        value={profile?.schoolName}
                        optional
                        roleColor={roleColor}
                      />
                    </>
                  ) : (
                    <div className="px-6 py-4">
                      <div className="space-y-2 mb-4">
                        <FieldLabel
                          icon={<GraduationCap className="w-3.5 h-3.5" />}
                          label="শ্রেণি"
                        />
                        <SelectInput
                          options={CLASS_OPTIONS}
                          value={selectedStudentClass}
                          onChange={(v) =>
                            handleSelectChange("studentClass", v)
                          }
                          placeholder="শ্রেণি বেছে নিন"
                        />
                      </div>
                      {shouldShowSubject && (
                        <div className="space-y-2 mb-4">
                          <FieldLabel
                            icon={<BookOpen className="w-3.5 h-3.5" />}
                            label="বিভাগ"
                          />
                          <SelectInput
                            options={SUBJECT_GROUPS}
                            value={
                              formData.studentSubject ??
                              profile?.studentSubject ??
                              ""
                            }
                            onChange={(v) =>
                              handleSelectChange("studentSubject", v)
                            }
                            placeholder="বিভাগ বেছে নিন"
                          />
                        </div>
                      )}
                      <TextInput
                        icon={<Hash className="w-4 h-4" />}
                        label="রোল নম্বর"
                        name="roll"
                        value={profile?.roll}
                        placeholder="রোল নম্বর"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                      <TextInput
                        icon={<School className="w-4 h-4" />}
                        label="বিদ্যালয়ের নাম"
                        name="schoolName"
                        value={profile?.schoolName}
                        placeholder="বিদ্যালয়ের পূর্ণ নাম"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* ══ Staff Education ══ */}
            {!isStudent && !isHardcoded && (
              <GlassCard delay={0.3}>
                <SectionHeader
                  icon={<GraduationCap className="w-5 h-5" />}
                  title="শিক্ষাগত যোগ্যতা"
                />
                <div className="py-2">
                  {!editing ? (
                    <>
                      <FieldDisplay
                        icon={<School className="w-4 h-4" />}
                        label="কলেজ/বিশ্ববিদ্যালয়"
                        value={profile?.collegeName}
                        optional
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<GraduationCap className="w-4 h-4" />}
                        label="শিক্ষা সম্পন্ন?"
                        value={
                          profile?.educationComplete === true
                            ? "হ্যাঁ"
                            : profile?.educationComplete === false
                              ? "না (চলমান)"
                              : null
                        }
                        roleColor={roleColor}
                      />
                      <FieldDisplay
                        icon={<BookOpen className="w-4 h-4" />}
                        label="ডিগ্রি"
                        value={
                          profile?.degree ? DEGREE_LABEL[profile.degree] : null
                        }
                        roleColor={roleColor}
                      />
                      {profile?.educationComplete === false &&
                        profile?.currentYear && (
                          <FieldDisplay
                            icon={<CalendarDays className="w-4 h-4" />}
                            label="বর্তমান বর্ষ"
                            value={profile.currentYear}
                            roleColor={roleColor}
                          />
                        )}
                      <FieldDisplay
                        icon={<BookOpen className="w-4 h-4" />}
                        label="যোগ্যতা"
                        value={profile?.qualification}
                        optional
                        roleColor={roleColor}
                      />
                    </>
                  ) : (
                    <div className="px-6 py-4">
                      <TextInput
                        icon={<School className="w-4 h-4" />}
                        label="কলেজ/বিশ্ববিদ্যালয়ের নাম"
                        name="collegeName"
                        value={profile?.collegeName}
                        placeholder="প্রতিষ্ঠানের পূর্ণ নাম"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                      <div className="space-y-2 mb-4">
                        <FieldLabel
                          icon={<GraduationCap className="w-3.5 h-3.5" />}
                          label="শিক্ষা সম্পন্ন?"
                        />
                        <SelectInput
                          options={[
                            { value: "true", label: "হ্যাঁ — শিক্ষা সম্পন্ন" },
                            { value: "false", label: "না — এখনো পড়ছি" },
                          ]}
                          value={
                            formData.educationComplete ??
                            (profile?.educationComplete !== undefined &&
                            profile?.educationComplete !== null
                              ? String(profile.educationComplete)
                              : "")
                          }
                          onChange={(v) =>
                            handleSelectChange("educationComplete", v)
                          }
                          placeholder="বেছে নিন"
                        />
                      </div>
                      <div className="space-y-2 mb-4">
                        <FieldLabel
                          icon={<BookOpen className="w-3.5 h-3.5" />}
                          label="ডিগ্রি"
                        />
                        <SelectInput
                          options={DEGREE_SELECT_OPTIONS}
                          value={formData.degree ?? profile?.degree ?? ""}
                          onChange={(v) => handleSelectChange("degree", v)}
                          placeholder="ডিগ্রি বেছে নিন"
                        />
                      </div>
                      {educationIncomplete && (
                        <div className="space-y-2 mb-4">
                          <FieldLabel
                            icon={<CalendarDays className="w-3.5 h-3.5" />}
                            label="বর্তমান বর্ষ"
                          />
                          <SelectInput
                            options={YEARS}
                            value={
                              formData.currentYear ?? profile?.currentYear ?? ""
                            }
                            onChange={(v) =>
                              handleSelectChange("currentYear", v)
                            }
                            placeholder="বর্ষ বেছে নিন"
                          />
                        </div>
                      )}
                      <TextInput
                        icon={<BookOpen className="w-4 h-4" />}
                        label="যোগ্যতা (বিষয়/বিভাগ)"
                        name="qualification"
                        value={profile?.qualification}
                        placeholder="যেমন: বাংলা, ইতিহাস"
                        optional
                        onChange={handleChange}
                        roleColor={roleColor}
                      />
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* ══ Security ══ */}
            <GlassCard delay={0.35}>
              <SectionHeader
                icon={<Lock className="w-5 h-5" />}
                title="নিরাপত্তা"
              />
              <div className="py-2">
                {!editing ? (
                  <div className="px-6 py-4">
                    <p className="text-sm bangla text-[var(--color-gray)]">
                      {isHardcoded ? (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[var(--color-text-hover)]" />
                          Owner অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করা যাবে না
                        </span>
                      ) : (
                        "পাসওয়ার্ড পরিবর্তনের জন্য সম্পাদনা মোডে যান"
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="px-6 py-4">
                    <PasswordInput
                      onChange={handleChange}
                      roleColor={roleColor}
                    />
                  </div>
                )}
              </div>
            </GlassCard>

            {/* ══ Bottom Sticky Action Bar ══ */}
            <AnimatePresence>
              {editing && !isHardcoded && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="sticky bottom-6 mt-6"
                >
                  <div className="flex gap-3 p-4 rounded-3xl bg-[var(--color-bg)] border border-[var(--color-active-border)] shadow-2xl">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                        text-sm font-bold bangla text-white
                        bg-emerald-500 hover:bg-emerald-600
                        shadow-lg shadow-emerald-500/20
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      পরিবর্তন সংরক্ষণ করুন
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={cancelEditing}
                      className="px-6 py-3.5 rounded-2xl text-sm font-bold bangla
                        bg-red-500 hover:bg-red-600 text-white transition-all"
                    >
                      বাতিল
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </main>
    </div>
  );
};

export default Profile;
