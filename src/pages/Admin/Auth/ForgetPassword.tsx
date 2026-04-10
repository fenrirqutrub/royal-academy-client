// src/pages/Admin/Auth/ForgetPassword.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  Lock,
  Phone,
  Eye,
  EyeOff,
  KeyRound,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosPublic, { getApiMessage } from "../../../hooks/axiosPublic";
import DatePicker from "../../../components/common/Datepicker";

interface Step1Form {
  phone: string;
}
interface Step3Form {
  newPassword: string;
  confirmPassword: string;
}
type ForgotStep = 1 | 2 | 3 | 4;

// ─── Timezone-safe ISO date ───────────────────────────────────────────────────
// date.toISOString() uses UTC — in UTC+6 (Bangladesh), local midnight becomes
// the previous day in UTC, shifting the date by -1. Use local parts instead.
const toLocalIso = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};
const slideTrans = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const };

const inputCls = (hasError: boolean) =>
  `w-full border-2 rounded-xl pl-10 pr-4 py-3 outline-none text-sm transition-all duration-200
   bg-[var(--color-active-bg)] text-[var(--color-text)] placeholder:text-[var(--color-gray)]
   ${
     hasError
       ? "border-red-400 focus:border-red-400"
       : "border-[var(--color-active-border)] focus:border-[var(--color-active-text)]"
   }`;

const ForgetPassword = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<ForgotStep>(1);
  const [dir, setDir] = useState(1);
  const [phone, setPhone] = useState("");
  const [dobDisplay, setDobDisplay] = useState("");
  const [dobIso, setDobIso] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const step1 = useForm<Step1Form>();
  const step3 = useForm<Step3Form>({ mode: "onChange" });

  const goNext = () => {
    setDir(1);
    setStep((s) => (s + 1) as ForgotStep);
  };
  const goBack = () => {
    setDir(-1);
    setStep((s) => (s - 1) as ForgotStep);
  };

  const onStep1 = (data: Step1Form) => {
    setPhone(data.phone.trim());
    goNext();
  };

  const onStep2 = async () => {
    if (!dobIso) {
      toast.error("জন্ম তারিখ বেছে নিন");
      return;
    }
    setVerifying(true);
    try {
      const res = await axiosPublic.post("/api/auth/forgot-password", {
        phone,
        dateOfBirth: dobIso,
      });
      setResetToken(res.data.resetToken);
      goNext();
    } catch (err: unknown) {
      toast.error(getApiMessage(err, "ফোন নম্বর বা জন্ম তারিখ সঠিক নয়"));
    } finally {
      setVerifying(false);
    }
  };

  const onStep3 = async (data: Step3Form) => {
    if (data.newPassword !== data.confirmPassword) {
      step3.setError("confirmPassword", {
        message: "পাসওয়ার্ড দুটো মিলছে না",
      });
      return;
    }
    setSaving(true);
    try {
      await axiosPublic.post("/api/auth/reset-password", {
        resetToken,
        newPassword: data.newPassword,
      });
      goNext();
    } catch (err: unknown) {
      toast.error(getApiMessage(err, "পাসওয়ার্ড পরিবর্তন ব্যর্থ"));
    } finally {
      setSaving(false);
    }
  };

  const progress = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm rounded-2xl relative"
        style={{
          backgroundColor: "var(--color-bg)",
          border: "1px solid var(--color-active-border)",
          boxShadow: "0 28px 72px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl z-10 transition-colors"
          style={{ color: "var(--color-gray)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-active-bg)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <X size={16} />
        </button>

        {/* Progress bar */}
        <div
          className="h-1 rounded-t-2xl overflow-hidden"
          style={{ backgroundColor: "var(--color-active-bg)" }}
        >
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg,#3b82f6,#6366f1)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-1 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
          >
            <KeyRound size={16} className="text-white" />
          </div>
          <div>
            <h3
              className="text-sm font-black bangla"
              style={{ color: "var(--color-text)" }}
            >
              পাসওয়ার্ড পুনরুদ্ধার
            </h3>
            <p
              className="text-[11px] bangla"
              style={{ color: "var(--color-gray)" }}
            >
              {step === 1 && "ধাপ ১ / ৩ — ফোন নম্বর"}
              {step === 2 && "ধাপ ২ / ৩ — জন্ম তারিখ যাচাই"}
              {step === 3 && "ধাপ ৩ / ৩ — নতুন পাসওয়ার্ড"}
              {step === 4 && "সম্পন্ন হয়েছে ✅"}
            </p>
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 pt-2">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTrans}
            >
              {/* ════ STEP 1 ════ */}
              {step === 1 && (
                <form
                  onSubmit={step1.handleSubmit(onStep1)}
                  className="space-y-4 pt-2"
                >
                  <div>
                    <label
                      className="block text-[11px] font-bold uppercase tracking-widest mb-1.5 bangla"
                      style={{ color: "var(--color-gray)" }}
                    >
                      ফোন নম্বর *
                    </label>
                    <div className="relative">
                      <Phone
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                          color: step1.formState.errors.phone
                            ? "#ef4444"
                            : "var(--color-gray)",
                        }}
                      />
                      <input
                        type="tel"
                        autoFocus
                        placeholder="01XXXXXXXXX"
                        className={inputCls(!!step1.formState.errors.phone)}
                        {...step1.register("phone", {
                          required: "ফোন নম্বর দিন",
                          pattern: {
                            value: /^01[3-9]\d{8}$/,
                            message: "সঠিক বাংলাদেশি নম্বর দিন",
                          },
                        })}
                      />
                    </div>
                    {step1.formState.errors.phone && (
                      <p className="text-red-400 text-xs mt-1 bangla">
                        ⚠ {step1.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end pt-1">
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bangla"
                      style={{
                        background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                        color: "#fff",
                      }}
                    >
                      পরবর্তী <ChevronRight size={15} />
                    </motion.button>
                  </div>
                </form>
              )}

              {/* ════ STEP 2 ════ */}
              {step === 2 && (
                <div className="space-y-4 pt-2">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bangla"
                    style={{
                      backgroundColor: "var(--color-active-bg)",
                      color: "var(--color-gray)",
                    }}
                  >
                    <Phone size={12} />
                    <span>{phone}</span>
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-bold uppercase tracking-widest mb-1.5 bangla"
                      style={{ color: "var(--color-gray)" }}
                    >
                      জন্ম তারিখ *
                    </label>
                    <DatePicker
                      value={dobDisplay}
                      onChange={setDobDisplay}
                      onDateChange={(date) => {
                        if (!isNaN(date.getTime())) setDobIso(toLocalIso(date));
                      }}
                      placeholder="জন্ম তারিখ বেছে নিন"
                      maxDate={new Date()}
                    />
                    {!dobIso && (
                      <p
                        className="text-[11px] mt-1.5 bangla"
                        style={{ color: "var(--color-gray)" }}
                      >
                        বছর → মাস → তারিখ ক্রমে বেছে নিন
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={goBack}
                      className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold bangla"
                      style={{
                        backgroundColor: "var(--color-active-bg)",
                        color: "var(--color-gray)",
                        border: "1px solid var(--color-active-border)",
                      }}
                    >
                      <ChevronLeft size={15} /> পেছনে
                    </motion.button>
                    <motion.button
                      type="button"
                      disabled={!dobIso || verifying}
                      whileTap={!verifying ? { scale: 0.97 } : undefined}
                      onClick={onStep2}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bangla disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                        color: "#fff",
                      }}
                    >
                      {verifying ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                          যাচাই হচ্ছে...
                        </>
                      ) : (
                        <>
                          যাচাই করুন <ChevronRight size={15} />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ════ STEP 3 ════ */}
              {step === 3 && (
                <form
                  onSubmit={step3.handleSubmit(onStep3)}
                  className="space-y-4 pt-2"
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs bangla"
                    style={{
                      backgroundColor: "rgba(34,197,94,0.1)",
                      color: "#22c55e",
                    }}
                  >
                    <CheckCircle2 size={13} />
                    পরিচয় যাচাই হয়েছে — নতুন পাসওয়ার্ড সেট করুন
                  </div>

                  {/* New password */}
                  <div>
                    <label
                      className="block text-[11px] font-bold uppercase tracking-widest mb-1.5 bangla"
                      style={{ color: "var(--color-gray)" }}
                    >
                      নতুন পাসওয়ার্ড *
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--color-gray)" }}
                      />
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="কমপক্ষে ৬টি অক্ষর"
                        className={
                          inputCls(!!step3.formState.errors.newPassword) +
                          " pr-10"
                        }
                        {...step3.register("newPassword", {
                          required: "পাসওয়ার্ড দিন",
                          minLength: { value: 6, message: "কমপক্ষে ৬টি অক্ষর" },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "var(--color-gray)" }}
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {step3.formState.errors.newPassword && (
                      <p className="text-red-400 text-xs mt-1 bangla">
                        ⚠ {step3.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      className="block text-[11px] font-bold uppercase tracking-widest mb-1.5 bangla"
                      style={{ color: "var(--color-gray)" }}
                    >
                      পাসওয়ার্ড নিশ্চিত করুন *
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--color-gray)" }}
                      />
                      <input
                        type={showCf ? "text" : "password"}
                        placeholder="আবার লিখুন"
                        className={
                          inputCls(!!step3.formState.errors.confirmPassword) +
                          " pr-10"
                        }
                        {...step3.register("confirmPassword", {
                          required: "পাসওয়ার্ড নিশ্চিত করুন",
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCf((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "var(--color-gray)" }}
                      >
                        {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {step3.formState.errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1 bangla">
                        ⚠ {step3.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={goBack}
                      className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold bangla"
                      style={{
                        backgroundColor: "var(--color-active-bg)",
                        color: "var(--color-gray)",
                        border: "1px solid var(--color-active-border)",
                      }}
                    >
                      <ChevronLeft size={15} /> পেছনে
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={saving}
                      whileTap={!saving ? { scale: 0.97 } : undefined}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bangla disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg,#22c55e,#16a34a)",
                        color: "#fff",
                      }}
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                          সংরক্ষণ হচ্ছে...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} /> পাসওয়ার্ড পরিবর্তন করুন
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}

              {/* ════ STEP 4 — Success ════ */}
              {step === 4 && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 16 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    }}
                  >
                    <CheckCircle2 size={32} className="text-white" />
                  </motion.div>
                  <div className="text-center space-y-1">
                    <p
                      className="text-base font-black bangla"
                      style={{ color: "var(--color-text)" }}
                    >
                      পাসওয়ার্ড পরিবর্তন হয়েছে!
                    </p>
                    <p
                      className="text-xs bangla"
                      style={{ color: "var(--color-gray)" }}
                    >
                      নতুন পাসওয়ার্ড দিয়ে এখন লগইন করুন
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bangla"
                    style={{
                      background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                      color: "#fff",
                    }}
                  >
                    লগইন করুন
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgetPassword;
