// src/pages/Admin/AddTeacher.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Lock,
  UserCheck,
  Clock,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosPublic from "../../../hooks/axiosPublic";
import { useAuth } from "../../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "teacher" | "principal" | "admin";

interface StaffMember {
  _id: string;
  name: string;
  phone: string;
  role: Role;
  slug?: string;
  isHardcoded?: boolean;
  onboardingComplete?: boolean;
}

interface StaffForm {
  name: string;
  phone: string;
  role: Role;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_ROLES: { value: Role; label: string; color: string; bg: string }[] = [
  {
    value: "teacher",
    label: "শিক্ষক",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
  },
  {
    value: "principal",
    label: "অধ্যক্ষ",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
  },
  {
    value: "admin",
    label: "প্রশাসক",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
  },
];

const ROLE_PERMISSIONS: Record<string, Role[]> = {
  owner: ["admin", "principal", "teacher"],
  admin: ["admin", "principal", "teacher"],
  principal: ["principal", "teacher"],
  teacher: [],
};

const getRoleInfo = (role: Role) =>
  ALL_ROLES.find((r) => r.value === role) ?? ALL_ROLES[0];

// ─── Bangla-only validator ────────────────────────────────────────────────────
const banglaOnly = (v: string) => {
  if (!v?.trim()) return "নাম লিখুন";
  if (!/^[\u0980-\u09FF\s।,.\-()'".]+$/.test(v.trim()))
    return "নাম অবশ্যই বাংলায় লিখতে হবে";
  if (v.trim().length < 3) return "কমপক্ষে ৩টি অক্ষর";
  return true;
};

// ─── Animation variants ───────────────────────────────────────────────────────
const cardVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  exit: { opacity: 0, x: -20, scale: 0.97, transition: { duration: 0.2 } },
};

const formVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.18 } },
};

// ─── Role pill ────────────────────────────────────────────────────────────────
const RolePill = ({ role }: { role: Role }) => {
  const info = getRoleInfo(role);
  return (
    <span
      className="text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide bangla"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {info.label}
    </span>
  );
};

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ active }: { active?: boolean }) => (
  <span
    className="text-[10px] font-bold px-2 py-0.5 rounded-full bangla flex items-center gap-1"
    style={
      active
        ? { backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e" }
        : { backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b" }
    }
  >
    {active ? (
      <>
        <Check size={9} /> সক্রিয়
      </>
    ) : (
      <>
        <Clock size={9} /> অপেক্ষমাণ
      </>
    )}
  </span>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────
const FormField = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label
      className="block text-xs font-bold uppercase tracking-widest bangla"
      style={{ color: "var(--color-gray)" }}
    >
      {label}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-red-500 text-xs bangla flex items-center gap-1"
        >
          ⚠ {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const AddTeacher = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const callerRole = user?.isHardcoded ? "owner" : (user?.role ?? "teacher");

  const allowedRoles = useMemo(
    () => ROLE_PERMISSIONS[callerRole] ?? [],
    [callerRole],
  );

  const defaultRole = useMemo(
    () => (allowedRoles[0] ?? "teacher") as Role,
    [allowedRoles],
  );

  const visibleRoles = useMemo(
    () => ALL_ROLES.filter((r) => allowedRoles.includes(r.value)),
    [allowedRoles],
  );

  const canAdd = allowedRoles.length > 0;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffForm>({ defaultValues: { role: defaultRole } });

  const selectedRole = watch("role");

  useEffect(() => {
    if (!allowedRoles.includes(selectedRole)) setValue("role", defaultRole);
  }, [allowedRoles, selectedRole, defaultRole, setValue]);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: members = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const res = await axiosPublic.get<StaffMember[]>(
        "/api/users?role=teacher&role=principal&role=admin",
      );
      return res.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: StaffForm) =>
      axiosPublic
        .post("/api/users", { ...data, callerRole })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("সদস্য যোগ হয়েছে!");
      reset({ role: defaultRole });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? "যোগ করতে ব্যর্থ"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffForm }) =>
      axiosPublic
        .patch(`/api/users/${id}`, { ...data, callerRole })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("আপডেট হয়েছে!");
      setEditingId(null);
      reset({ role: defaultRole });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? "আপডেট ব্যর্থ"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosPublic.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("মুছে ফেলা হয়েছে!");
      setDeleteId(null);
    },
    onError: () => toast.error("মুছতে ব্যর্থ"),
  });

  const onSubmit = (data: StaffForm) => {
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else addMutation.mutate(data);
  };

  const startEdit = (m: StaffMember) => {
    setEditingId(m._id);
    setValue("name", m.name);
    setValue("phone", m.phone);
    setValue("role", allowedRoles.includes(m.role) ? m.role : defaultRole);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset({ role: defaultRole });
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen  py-8"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1
          className="text-2xl font-black bangla"
          style={{ color: "var(--color-text)" }}
        >
          {editingId ? "সদস্য সম্পাদনা" : "কর্মী ব্যবস্থাপনা"}
        </h1>
        <p
          className="text-sm mt-1 bangla"
          style={{ color: "var(--color-gray)" }}
        >
          শিক্ষক, অধ্যক্ষ ও প্রশাসক যোগ করুন এবং পরিচালনা করুন
        </p>
      </motion.div>

      {/* ── Form card ── */}
      <AnimatePresence mode="wait">
        {canAdd ? (
          <motion.div
            key="form"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: "var(--color-active-bg)",
              border: "1px solid var(--color-active-border)",
            }}
          >
            {/* Form header */}
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-active-border)" }}
              >
                {editingId ? (
                  <Pencil size={14} style={{ color: "var(--color-text)" }} />
                ) : (
                  <Plus size={14} style={{ color: "var(--color-text)" }} />
                )}
              </div>
              <h2
                className="text-sm font-black bangla"
                style={{ color: "var(--color-text)" }}
              >
                {editingId ? "তথ্য সম্পাদনা করুন" : "নতুন সদস্য যোগ করুন"}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name — Bangla only */}
              <FormField label="পূর্ণ নাম *" error={errors.name?.message}>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      color: errors.name ? "#ef4444" : "var(--color-gray)",
                    }}
                  />
                  <input
                    {...register("name", { validate: banglaOnly })}
                    placeholder="বাংলায় পূর্ণ নাম লিখুন"
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bangla outline-none transition-all duration-200"
                    style={{
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text)",
                      border: `2px solid ${errors.name ? "#ef4444" : "var(--color-active-border)"}`,
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = errors.name
                        ? "#ef4444"
                        : "var(--color-active-text)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = errors.name
                        ? "#ef4444"
                        : "var(--color-active-border)")
                    }
                  />
                </div>
              </FormField>

              {/* Phone */}
              <FormField label="ফোন নম্বর *" error={errors.phone?.message}>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      color: errors.phone ? "#ef4444" : "var(--color-gray)",
                    }}
                  />
                  <input
                    {...register("phone", {
                      required: "ফোন নম্বর আবশ্যক",
                      pattern: {
                        value: /^01[3-9]\d{8}$/,
                        message: "সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)",
                      },
                    })}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text)",
                      border: `2px solid ${errors.phone ? "#ef4444" : "var(--color-active-border)"}`,
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = errors.phone
                        ? "#ef4444"
                        : "var(--color-active-text)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = errors.phone
                        ? "#ef4444"
                        : "var(--color-active-border)")
                    }
                  />
                </div>
              </FormField>

              {/* Role selector */}
              <div className="space-y-2">
                <label
                  className="block text-xs font-bold uppercase tracking-widest bangla"
                  style={{ color: "var(--color-gray)" }}
                >
                  ভূমিকা
                </label>
                <div className="flex flex-wrap gap-2">
                  {visibleRoles.map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setValue("role", opt.value, { shouldValidate: true })
                      }
                      className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all bangla cursor-pointer"
                      style={{
                        borderColor: opt.color,
                        backgroundColor:
                          selectedRole === opt.value
                            ? opt.color
                            : "transparent",
                        color: selectedRole === opt.value ? "#fff" : opt.color,
                      }}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
                <input
                  type="hidden"
                  {...register("role", { required: true })}
                />
              </div>

              {/* Hint */}
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  backgroundColor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <ChevronRight
                  size={13}
                  className="mt-0.5 shrink-0 text-blue-500"
                />
                <p className="text-xs bangla text-blue-500 leading-relaxed">
                  এই ফোন নম্বরটি সদস্যকে জানান — তিনি signup পেজে এই নম্বর দিয়ে
                  অ্যাকাউন্ট সক্রিয় করবেন।
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileTap={!isPending ? { scale: 0.97 } : undefined}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 bangla"
                  style={{
                    background: editingId
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#3b82f6,#6366f1)",
                    color: "#fff",
                  }}
                >
                  {isPending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingId ? (
                    <Check size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                  {isPending
                    ? "সংরক্ষণ হচ্ছে..."
                    : editingId
                      ? "আপডেট করুন"
                      : "যোগ করুন"}
                </motion.button>

                {editingId && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bangla"
                    style={{
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-gray)",
                      border: "2px solid var(--color-active-border)",
                    }}
                  >
                    <X size={15} /> বাতিল
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="no-perm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-5 rounded-2xl mb-6"
            style={{
              backgroundColor: "var(--color-active-bg)",
              border: "1px solid var(--color-active-border)",
            }}
          >
            <Lock size={18} style={{ color: "var(--color-gray)" }} />
            <p
              className="text-sm bangla"
              style={{ color: "var(--color-gray)" }}
            >
              সদস্য যোগ বা সম্পাদনার অনুমতি নেই।
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats row ── */}
      {!isLoading && members.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-3 mb-5"
        >
          {ALL_ROLES.map((role) => {
            const count = members.filter((m) => m.role === role.value).length;
            if (!count) return null;
            return (
              <div
                key={role.value}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bangla"
                style={{ backgroundColor: role.bg, color: role.color }}
              >
                {role.label}: {count} জন
              </div>
            );
          })}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bangla"
            style={{
              backgroundColor: "rgba(34,197,94,0.12)",
              color: "#22c55e",
            }}
          >
            সক্রিয়: {members.filter((m) => m.onboardingComplete).length} জন
          </div>
        </motion.div>
      )}

      {/* ── Member list ── */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              className="w-7 h-7 rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--color-active-text)" }}
            />
          </div>
        ) : members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <UserCheck
              size={36}
              style={{ color: "var(--color-gray)", opacity: 0.4 }}
            />
            <p
              className="text-sm bangla"
              style={{ color: "var(--color-gray)" }}
            >
              এখনো কোনো সদস্য যোগ করা হয়নি
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {members.map((m, i) => {
              const info = getRoleInfo(m.role);
              const isEditing = editingId === m._id;
              const isDeleting = deleteId === m._id;

              return (
                <motion.div
                  key={m._id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--color-active-bg)",
                    border: isEditing
                      ? `2px solid ${info.color}`
                      : "1px solid var(--color-active-border)",
                  }}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: info.color }}
                  />

                  <div className="flex items-center gap-3 p-4 pl-5">
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-base bangla"
                      style={{
                        background: `linear-gradient(135deg, ${info.color}99, ${info.color})`,
                      }}
                    >
                      {m.role === "admin" ? (
                        <ShieldCheck size={18} className="text-white" />
                      ) : (
                        (m.name?.charAt(0) ?? "?")
                      )}
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <p
                          className="text-sm font-black bangla truncate"
                          style={{ color: "var(--color-text)" }}
                        >
                          {m.name}
                        </p>
                        {m.isHardcoded && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 uppercase tracking-wide">
                            preset
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <RolePill role={m.role} />
                        <StatusPill active={m.onboardingComplete} />
                        {m.phone && (
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--color-gray)" }}
                          >
                            {m.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {canAdd && !m.isHardcoded && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isDeleting ? (
                          // Confirm delete
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bangla text-xs font-bold"
                            style={{
                              backgroundColor: "rgba(239,68,68,0.1)",
                              color: "#ef4444",
                            }}
                          >
                            <span>নিশ্চিত?</span>
                            <button
                              onClick={() => deleteMutation.mutate(m._id)}
                              disabled={deleteMutation.isPending}
                              className="p-1 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="p-1 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </motion.div>
                        ) : (
                          <>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => startEdit(m)}
                              className="p-2 rounded-xl transition-colors cursor-pointer"
                              style={{ color: "var(--color-active-text)" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "var(--color-active-border)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            >
                              <Pencil size={15} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setDeleteId(m._id)}
                              className="p-2 rounded-xl transition-colors cursor-pointer"
                              style={{ color: "#ef4444" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "rgba(239,68,68,0.1)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            >
                              <Trash2 size={15} />
                            </motion.button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AddTeacher;
