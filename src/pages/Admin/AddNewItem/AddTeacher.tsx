// src/pages/Admin/AddNewItem/AddTeacher.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import Button from "../../../components/common/Button";
import { cn } from "../../../utility/utils";
import { banglaOnly } from "../Auth/SignupComponents";
import {
  ROLE_CONFIG,
  ROLE_PERMISSIONS,
  STAFF_ROLE_LIST,
  validateBdPhone,
  toAsciiDigits,
  type StaffRole,
  type UserRole,
} from "../../../utility/Constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember {
  _id: string;
  name: string;
  phone: string;
  role: StaffRole;
  slug?: string;
  isHardcoded?: boolean;
  onboardingComplete?: boolean;
}

interface StaffForm {
  name: string;
  phone: string;
  role: StaffRole;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAFF_QUERY_KEY = ["staff-members"] as const;
const STAFF_QUERY_PATH = `/api/users?${STAFF_ROLE_LIST.map((r) => `role=${r}`).join("&")}`;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const surfaceCls =
  "rounded-2xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)]";

const labelCls =
  "block text-xs font-bold uppercase tracking-widest bangla text-[var(--color-gray)]";

const inputBaseCls =
  "w-full rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] border-2 outline-none transition-all duration-200 focus:border-[var(--color-active-text)]";

const staffRoleUi: Record<
  StaffRole,
  {
    label: string;
    pillCls: string;
    countCls: string;
    accentCls: string;
    editBorderCls: string;
    avatarCls: string;
    buttonCls: string;
    buttonActiveCls: string;
  }
> = {
  teacher: {
    label: ROLE_CONFIG.teacher.label,
    pillCls: "bg-blue-500/10 text-blue-500",
    countCls: "bg-blue-500/10 text-blue-500",
    accentCls: "bg-blue-500",
    editBorderCls: "border-blue-500",
    avatarCls: "bg-gradient-to-br from-blue-400 to-blue-600",
    buttonCls: "border-blue-500 text-blue-500 hover:bg-blue-500/10",
    buttonActiveCls:
      "!border-blue-500 !bg-blue-500 !text-white hover:!bg-blue-600 hover:!text-white",
  },
  principal: {
    label: ROLE_CONFIG.principal.label,
    pillCls: "bg-violet-500/10 text-violet-600",
    countCls: "bg-violet-500/10 text-violet-600",
    accentCls: "bg-violet-500",
    editBorderCls: "border-violet-500",
    avatarCls: "bg-gradient-to-br from-violet-400 to-violet-600",
    buttonCls: "border-violet-500 text-violet-600 hover:bg-violet-500/10",
    buttonActiveCls:
      "!border-violet-500 !bg-violet-500 !text-white hover:!bg-violet-600 hover:!text-white",
  },
  admin: {
    label: ROLE_CONFIG.admin.label,
    pillCls: "bg-rose-500/10 text-rose-500",
    countCls: "bg-rose-500/10 text-rose-500",
    accentCls: "bg-rose-500",
    editBorderCls: "border-rose-500",
    avatarCls: "bg-gradient-to-br from-rose-400 to-rose-600",
    buttonCls: "border-rose-500 text-rose-500 hover:bg-rose-500/10",
    buttonActiveCls:
      "!border-rose-500 !bg-rose-500 !text-white hover:!bg-rose-600 hover:!text-white",
  },
};

const getRoleInfo = (role: StaffRole | string) =>
  staffRoleUi[role as StaffRole] ?? staffRoleUi.teacher;

const normalizePhone = (phone: string) =>
  toAsciiDigits(phone).replace(/\D/g, "");

const normalizeStaffForm = (data: StaffForm): StaffForm => ({
  ...data,
  name: data.name.trim(),
  phone: normalizePhone(data.phone),
});

// ─── Animation variants ───────────────────────────────────────────────────────

const cardVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.3, ease: EASE },
  }),
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

const formVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: EASE },
  },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.18 } },
};

// ─── Small UI pieces ──────────────────────────────────────────────────────────

const RolePill = ({ role }: { role: StaffRole }) => {
  const info = getRoleInfo(role);
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide bangla",
        info.pillCls,
      )}
    >
      {info.label}
    </span>
  );
};

const StatusPill = ({ active }: { active?: boolean }) => (
  <span
    className={cn(
      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bangla",
      active
        ? "bg-green-500/10 text-green-500"
        : "bg-amber-500/10 text-amber-500",
    )}
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

const FormField = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className={labelCls}>{label}</label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1 text-xs text-red-500 bangla"
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

  const callerRole: UserRole = user?.isHardcoded
    ? "owner"
    : ((user?.role ?? "teacher") as UserRole);

  const allowedRoles = useMemo(
    () => ROLE_PERMISSIONS[callerRole] ?? [],
    [callerRole],
  );

  const defaultRole = useMemo<StaffRole>(
    () => allowedRoles[0] ?? "teacher",
    [allowedRoles],
  );

  const visibleRoles = useMemo(
    () => STAFF_ROLE_LIST.filter((role) => allowedRoles.includes(role)),
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
  } = useForm<StaffForm>({
    defaultValues: { role: defaultRole },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (!allowedRoles.includes(selectedRole)) {
      setValue("role", defaultRole);
    }
  }, [allowedRoles, selectedRole, defaultRole, setValue]);

  const resetForm = () => reset({ name: "", phone: "", role: defaultRole });

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: members = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: STAFF_QUERY_KEY,
    queryFn: async () => {
      const res = await axiosPublic.get<StaffMember[]>(STAFF_QUERY_PATH);
      // only keep known staff roles
      return res.data.filter((m) =>
        STAFF_ROLE_LIST.includes(m.role as StaffRole),
      );
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const invalidateStaff = () =>
    queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });

  const onApiError = (
    err: { response?: { data?: { message?: string } } },
    fallback: string,
  ) => toast.error(err?.response?.data?.message ?? fallback);

  const addMutation = useMutation({
    mutationFn: (data: StaffForm) =>
      axiosPublic
        .post("/api/users", {
          ...normalizeStaffForm(data),
          callerRole,
        })
        .then((r) => r.data),
    onSuccess: () => {
      invalidateStaff();
      toast.success("সদস্য যোগ হয়েছে!");
      resetForm();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      onApiError(err, "যোগ করতে ব্যর্থ"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffForm }) =>
      axiosPublic
        .patch(`/api/users/${id}`, {
          ...normalizeStaffForm(data),
          callerRole,
        })
        .then((r) => r.data),
    onSuccess: () => {
      invalidateStaff();
      toast.success("আপডেট হয়েছে!");
      setEditingId(null);
      resetForm();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      onApiError(err, "আপডেট ব্যর্থ"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosPublic.delete(`/api/users/${id}`),
    onSuccess: () => {
      invalidateStaff();
      toast.success("মুছে ফেলা হয়েছে!");
      setDeleteId(null);
    },
    onError: () => toast.error("মুছতে ব্যর্থ"),
  });

  const isPending = addMutation.isPending || updateMutation.isPending;

  // ── Handlers ──────────────────────────────────────────────────────────────

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
    resetForm();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black bangla text-[var(--color-text)]">
          {editingId ? "সদস্য সম্পাদনা" : "কর্মী ব্যবস্থাপনা"}
        </h1>
        <p className="mt-1 text-sm bangla text-[var(--color-gray)]">
          শিক্ষক, অধ্যক্ষ ও প্রশাসক যোগ করুন এবং পরিচালনা করুন
        </p>
      </motion.div>

      {/* Form */}
      <AnimatePresence mode="wait">
        {canAdd ? (
          <motion.div
            key="form"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(surfaceCls, "mb-6 p-6")}
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-active-border)]">
                {editingId ? (
                  <Pencil size={14} className="text-[var(--color-text)]" />
                ) : (
                  <Plus size={14} className="text-[var(--color-text)]" />
                )}
              </div>
              <h2 className="text-sm font-black bangla text-[var(--color-text)]">
                {editingId ? "তথ্য সম্পাদনা করুন" : "নতুন সদস্য যোগ করুন"}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <FormField label="পূর্ণ নাম *" error={errors.name?.message}>
                <div className="relative">
                  <User
                    size={15}
                    className={cn(
                      "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2",
                      errors.name ? "text-red-500" : "text-[var(--color-gray)]",
                    )}
                  />
                  <input
                    {...register("name", {
                      validate: banglaOnly("নাম"),
                    })}
                    placeholder="বাংলায় পূর্ণ নাম লিখুন"
                    autoComplete="off"
                    className={cn(
                      inputBaseCls,
                      "pl-10 pr-4 py-3 text-sm bangla",
                      errors.name
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-active-border)]",
                    )}
                  />
                </div>
              </FormField>

              {/* Phone */}
              <FormField label="ফোন নম্বর *" error={errors.phone?.message}>
                <div className="relative">
                  <Phone
                    size={15}
                    className={cn(
                      "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2",
                      errors.phone
                        ? "text-red-500"
                        : "text-[var(--color-gray)]",
                    )}
                  />
                  <input
                    {...register("phone", {
                      required: "ফোন নম্বর আবশ্যক",
                      validate: validateBdPhone,
                    })}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                    className={cn(
                      inputBaseCls,
                      "pl-10 pr-4 py-3 text-sm",
                      errors.phone
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-active-border)]",
                    )}
                  />
                </div>
              </FormField>

              {/* Role selector */}
              <div className="space-y-2">
                <label className={labelCls}>ভূমিকা</label>
                <div className="flex flex-wrap gap-2">
                  {visibleRoles.map((role) => {
                    const info = getRoleInfo(role);
                    const active = selectedRole === role;

                    return (
                      <Button
                        key={role}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setValue("role", role, { shouldValidate: true })
                        }
                        className={cn(
                          "h-auto border-2 px-4 py-2 text-sm font-bold bangla shadow-none",
                          active ? info.buttonActiveCls : info.buttonCls,
                        )}
                      >
                        {info.label}
                      </Button>
                    );
                  })}
                </div>
                <input
                  type="hidden"
                  {...register("role", { required: true })}
                />
              </div>

              {/* Hint */}
              <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/8 px-3 py-2.5">
                <ChevronRight
                  size={13}
                  className="mt-0.5 shrink-0 text-blue-500"
                />
                <p className="text-xs leading-relaxed bangla text-blue-500">
                  এই ফোন নম্বরটি সদস্যকে জানান — তিনি signup পেজে এই নম্বর দিয়ে
                  অ্যাকাউন্ট সক্রিয় করবেন।
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  variant="ghost"
                  disabled={isPending}
                  className={cn(
                    "h-auto px-5 py-2.5 text-sm font-bold bangla text-white shadow-none",
                    editingId
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90",
                  )}
                >
                  {isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    className="h-auto px-4 py-2.5 text-sm font-bold bangla"
                  >
                    <X size={15} /> বাতিল
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="no-perm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(surfaceCls, "mb-6 flex items-center gap-3 p-5")}
          >
            <Lock size={18} className="text-[var(--color-gray)]" />
            <p className="text-sm bangla text-[var(--color-gray)]">
              সদস্য যোগ বা সম্পাদনার অনুমতি নেই।
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      {!isLoading && members.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-5 flex flex-wrap gap-3"
        >
          {STAFF_ROLE_LIST.map((role) => {
            const count = members.filter((m) => m.role === role).length;
            if (!count) return null;

            const info = getRoleInfo(role);

            return (
              <div
                key={role}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold bangla",
                  info.countCls,
                )}
              >
                {info.label}: {count} জন
              </div>
            );
          })}

          <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-1.5 text-xs font-bold bangla text-green-500">
            সক্রিয়: {members.filter((m) => m.onboardingComplete).length} জন
          </div>
        </motion.div>
      )}

      {/* Member list */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              className="h-7 w-7 rounded-full border-2 border-[var(--color-active-text)] border-t-transparent"
            />
          </div>
        ) : members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-3 py-16"
          >
            <UserCheck
              size={36}
              className="text-[var(--color-gray)] opacity-40"
            />
            <p className="text-sm bangla text-[var(--color-gray)]">
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
                  className={cn(
                    surfaceCls,
                    "relative overflow-hidden",
                    isEditing && cn("border-2", info.editBorderCls),
                  )}
                >
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl",
                      info.accentCls,
                    )}
                  />

                  <div className="flex items-center gap-3 p-4 pl-5">
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white bangla",
                        info.avatarCls,
                      )}
                    >
                      {m.role === "admin" ? (
                        <ShieldCheck size={18} className="text-white" />
                      ) : (
                        (m.name?.charAt(0) ?? "?")
                      )}
                    </motion.div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-black bangla text-[var(--color-text)]">
                          {m.name}
                        </p>
                        {m.isHardcoded && (
                          <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-700">
                            preset
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <RolePill role={m.role} />
                        <StatusPill active={m.onboardingComplete} />
                        {m.phone && (
                          <span className="text-[11px] text-[var(--color-gray)]">
                            {m.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {canAdd && !m.isHardcoded && (
                      <div className="flex shrink-0 items-center gap-1">
                        {isDeleting ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-bold bangla text-red-500"
                          >
                            <span>নিশ্চিত?</span>

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(m._id)}
                              className="size-7 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600"
                            >
                              <Check size={12} />
                            </Button>

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(null)}
                              className="size-7 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600"
                            >
                              <X size={12} />
                            </Button>
                          </motion.div>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => startEdit(m)}
                              className="size-9 text-[var(--color-active-text)] hover:bg-[var(--color-active-border)] hover:text-[var(--color-active-text)]"
                            >
                              <Pencil size={15} />
                            </Button>

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(m._id)}
                              className="size-9 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </Button>
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
