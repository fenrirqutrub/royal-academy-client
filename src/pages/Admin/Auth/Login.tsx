import { useState } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Phone, Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { getApiMessage } from "../../../hooks/axiosPublic";
import ForgetPassword from "./ForgetPassword";

interface LoginForm {
  phone: string;
  password: string;
}

const Login = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.phone, data.password);
      toast.success("স্বাগতম!");
    } catch (err: unknown) {
      toast.error(getApiMessage(err, "ফোন নম্বর বা পাসওয়ার্ড ভুল"));
    }
  };

  const inputBase =
    "w-full py-3 text-sm rounded-xl outline-none transition-all duration-200 " +
    "bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-gray)] " +
    "border border-[var(--color-active-border)] focus:border-[var(--color-active-text)]";

  return (
    <>
      <AnimatePresence>
        {showForgot && <ForgetPassword onClose={() => setShowForgot(false)} />}
      </AnimatePresence>

      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Brand */}
          <div className="text-center mb-8">
            <Link to="/">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-active-bg)] border border-[var(--color-active-border)] mb-4 hover:opacity-80 transition-opacity">
                <GraduationCap className="w-[22px] h-[22px] text-[var(--color-text)]" />
              </div>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)] bangla">
              রয়েল একাডেমি
            </h1>
            <p className="text-sm text-[var(--color-gray)] mt-1 bangla">
              আপনার অ্যাকাউন্টে প্রবেশ করুন
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6 bg-[var(--color-active-bg)] border border-[var(--color-active-border)]">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-gray)] bangla">
                  ফোন নম্বর
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray)] pointer-events-none"
                  />
                  <input
                    type="tel"
                    autoFocus
                    placeholder="01XXXXXXXXX"
                    className={`${inputBase} pl-10 pr-4 ${
                      errors.phone
                        ? "border-rose-400 focus:border-rose-400"
                        : ""
                    }`}
                    {...register("phone", {
                      required: "ফোন নম্বর আবশ্যক",
                      pattern: {
                        value: /^01[3-9]\d{8}$/,
                        message: "সঠিক বাংলাদেশী নম্বর দিন",
                      },
                    })}
                  />
                </div>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 text-xs bangla"
                  >
                    {errors.phone.message}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-gray)] bangla">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray)] pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputBase} pl-10 pr-11 ${
                      errors.password
                        ? "border-rose-400 focus:border-rose-400"
                        : ""
                    }`}
                    {...register("password", {
                      required: "পাসওয়ার্ড আবশ্যক",
                      minLength: { value: 4, message: "কমপক্ষে ৪ অক্ষর" },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 text-xs bangla"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              {/* Forgot */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-[var(--color-gray)] hover:text-[var(--color-text)] transition-colors bangla"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-sm font-semibold bangla transition-all duration-200 bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    প্রবেশ হচ্ছে...
                  </span>
                ) : (
                  "প্রবেশ করুন"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[var(--color-gray)] mt-5 bangla">
            অ্যাকাউন্ট নেই?{" "}
            <Link
              to="/signup"
              className="text-[var(--color-text)] font-semibold hover:underline"
            >
              নতুন অ্যাকাউন্ট খুলুন
            </Link>
            {" · "}
            <Link to="/" className="hover:underline">
              হোমে ফিরুন
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
