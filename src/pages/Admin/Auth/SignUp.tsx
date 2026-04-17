// src/pages/Admin/Auth/Signup.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  BookOpen,
  Hash,
  School,
  PhoneCall,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";

import axiosPublic, {
  getApiMessage,
  TOKEN_KEY,
} from "../../../hooks/axiosPublic";
import { useAuth } from "../../../context/AuthContext";
import type { AuthUser } from "../../../context/AuthContext";
import { getDivisions, getDistricts, getThanas } from "../../../data/bd-geo";
import {
  bangladeshiNameValidator,
  banglaOnly,
  getFieldState,
  slideVariants,
  slideTrans,
  toBanglaDigits,
  ValidatedInput,
  PasswordInput,
  CardBtn,
  GridBtn,
  GenderBtn,
  ReligionBtn,
  PrimaryBtn,
  SubmitBtn,
  SecondaryBtn,
  NavRow,
  StepShell,
  TogglePermanent,
  ValidationMsg,
  SummaryBox,
  AvatarPicker,
  PageShell,
} from "./SignupComponents";
import SelectInput from "../../../components/common/SelectInput";
import DatePicker from "../../../components/common/Datepicker";
import {
  CLASSES,
  SUBJECT_GROUPS,
  DEGREES,
  RELIGIONS,
  YEARS,
  ADVANCED_CLASSES,
  STUDENT_GENDER_OPTIONS,
  STAFF_GENDER_OPTIONS,
  STAFF_ROLE_LABELS,
  BD_PHONE_REGEX,
  getSubjects,
  toAsciiDigits,
  toLocalIso,
  validateBdPhone,
  type FieldState,
  type Gender,
  type Religion,
  type SignupForm,
  type StaffRole,
} from "../../../utility/Constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhoneCheckResult {
  name: string;
  role: StaffRole;
}

// ─── Staff Phone Check Step ───────────────────────────────────────────────────

const StaffPhoneCheck = ({
  onVerified,
  onBack,
}: {
  onVerified: (phone: string, result: PhoneCheckResult) => void;
  onBack: () => void;
}) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawDigits = toAsciiDigits(phone).replace(/[^0-9]/g, "");
  const valid = BD_PHONE_REGEX.test(rawDigits);

  const handleCheck = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosPublic.post("/api/auth/check-staff-phone", {
        phone: rawDigits,
      });
      onVerified(rawDigits, data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "যাচাই করা সম্ভব হয়নি");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      title="আপনার ফোন নম্বর দিন"
      subtitle="প্রশাসক আপনার জন্য যে নম্বর নিবন্ধন করেছেন"
    >
      <div className="space-y-3">
        <ValidatedInput
          autoFocus
          type="tel"
          numericOnly
          state={phone ? (valid ? "valid" : "error") : "idle"}
          iconLeft={Phone}
          placeholder="০১XXXXXXXXX"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError(null);
          }}
          error={!valid && phone ? "সঠিক বাংলাদেশি নম্বর দিন" : undefined}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs bangla flex items-center gap-1"
          >
            ⚠️ {error}
          </motion.p>
        )}
      </div>
      <div className="flex justify-between mt-6">
        <SecondaryBtn onClick={onBack}>
          <ChevronLeft size={15} /> পেছনে
        </SecondaryBtn>
        <PrimaryBtn disabled={!valid || loading} onClick={handleCheck}>
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> যাচাই হচ্ছে...
            </>
          ) : (
            <>
              যাচাই করুন <ChevronRight size={15} />
            </>
          )}
        </PrimaryBtn>
      </div>
    </StepShell>
  );
};

// ─── Geo Address Fields ───────────────────────────────────────────────────────

const GeoAddressFields = ({
  prefix = "",
  register,
  errors,
  fs,
  division,
  setDivision,
  district,
  setDistrict,
  thana,
  setThana,
  showLandmark = false,
  permanentSame,
  setPermanentSame,
}: {
  prefix?: string;
  register: ReturnType<typeof useForm<SignupForm>>["register"];
  errors: ReturnType<typeof useForm<SignupForm>>["formState"]["errors"];
  fs: (name: keyof SignupForm) => FieldState;
  division: string;
  setDivision: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  thana: string;
  setThana: (v: string) => void;
  showLandmark?: boolean;
  permanentSame?: boolean | null;
  setPermanentSame?: (v: boolean) => void;
}) => {
  const villageKey = (
    prefix ? `${prefix}GramNam` : "gramNam"
  ) as keyof SignupForm;
  const paraKey = (prefix ? `${prefix}Para` : "para") as keyof SignupForm;

  const divisionOptions = getDivisions().map((d) => ({
    value: d,
    label: d,
  }));
  const districtOptions = division
    ? getDistricts(division).map((d) => ({ value: d, label: d }))
    : [];
  const thanaOptions =
    division && district
      ? getThanas(division, district).map((t) => ({ value: t, label: t }))
      : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <ValidatedInput
          state={fs(villageKey)}
          iconLeft={MapPin}
          label="গ্রাম/মহল্লা *"
          placeholder="গ্রাম বা মহল্লার নাম বাংলায়"
          error={errors[villageKey]?.message}
          blockEnglish
          {...register(villageKey, {
            required: "গ্রামের নাম লিখুন",
            validate: banglaOnly("গ্রামের নাম"),
          })}
        />
        <ValidatedInput
          state={fs(paraKey)}
          iconLeft={MapPin}
          label="পাড়া *"
          placeholder="পাড়ার নাম বাংলায়"
          error={errors[paraKey]?.message}
          blockEnglish
          {...register(paraKey, {
            required: "পাড়ার নাম লিখুন",
            validate: banglaOnly("পাড়ার নাম"),
          })}
        />
      </div>

      <SelectInput
        label="বিভাগ *"
        value={division}
        onChange={(v) => {
          setDivision(v);
          setDistrict("");
          setThana("");
        }}
        placeholder="বিভাগ নির্বাচন করুন"
        options={divisionOptions}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <SelectInput
          label="জেলা *"
          value={district}
          onChange={(v) => {
            setDistrict(v);
            setThana("");
          }}
          placeholder={division ? "জেলা নির্বাচন করুন" : "আগে বিভাগ বাছুন"}
          options={districtOptions}
          disabled={!division}
        />
        <SelectInput
          label="থানা/উপজেলা *"
          value={thana}
          onChange={setThana}
          placeholder={district ? "থানা নির্বাচন করুন" : "আগে জেলা বাছুন"}
          options={thanaOptions}
          disabled={!district}
        />
      </div>

      {showLandmark && (
        <>
          {setPermanentSame && (
            <TogglePermanent
              value={permanentSame ?? null}
              onChange={setPermanentSame}
            />
          )}
          <ValidatedInput
            state={fs("landmark")}
            iconLeft={MapPin}
            label="পরিচিত স্থান *"
            placeholder="মসজিদ / বাজার / স্কুলের কাছে — বাংলায় লিখুন"
            error={errors.landmark?.message}
            blockEnglish
            {...register("landmark", {
              required: "পরিচিত স্থান লিখুন",
              validate: banglaOnly("পরিচিত স্থান"),
            })}
          />
        </>
      )}
    </div>
  );
};

// ─── Geo Validation Warning ───────────────────────────────────────────────────

const GeoWarning = ({
  division,
  district,
  thana,
}: {
  division: string;
  district: string;
  thana: string;
}) => {
  if (division && district && thana) return null;
  return (
    <p className="text-red-400 text-xs mt-2 bangla flex items-center gap-1">
      ⚠️ বিভাগ, জেলা এবং থানা নির্বাচন করুন
    </p>
  );
};

// ─── Required Warning ─────────────────────────────────────────────────────────

const RequiredWarning = ({
  show,
  message,
}: {
  show: boolean;
  message: string;
}) => {
  if (!show) return null;
  return (
    <p className="text-red-400 text-xs mt-3 bangla flex items-center gap-1">
      ⚠️ {message}
    </p>
  );
};

// ─── Main Signup ──────────────────────────────────────────────────────────────

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Step navigation
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Role selection
  const [isStudent, setIsStudent] = useState<boolean | null>(null);
  const [staffPhone, setStaffPhone] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<PhoneCheckResult | null>(null);

  // Personal info
  const [gender, setGender] = useState<Gender>(null);
  const [religion, setReligion] = useState<Religion>(null);
  const [dobDisplay, setDobDisplay] = useState("");
  const [dobIso, setDobIso] = useState("");

  // Address
  const [permanentSame, setPermanentSame] = useState<boolean | null>(null);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [pDivision, setPDivision] = useState("");
  const [pDistrict, setPDistrict] = useState("");
  const [pThana, setPThana] = useState("");

  // Education
  const [educationComplete, setEducationComplete] = useState<boolean | null>(
    null,
  );
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Avatar & password
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<SignupForm>({ mode: "onChange" });

  const fs = useCallback(
    (name: keyof SignupForm): FieldState =>
      getFieldState(name, errors, touchedFields, watch(name)),
    [errors, touchedFields, watch],
  );

  const needsSubject = getSubjects(selectedClass)?.length > 0;
  const geoComplete = !!(division && district && thana);
  const pGeoComplete = !!(pDivision && pDistrict && pThana);

  // ─── Steps ────────────────────────────────────────────────────────────

  const steps = useMemo<string[]>(() => {
    const s: string[] = ["who"];

    if (isStudent === false) {
      s.push(
        "staff-phone-check",
        "parents-name",
        "dob-gender",
        "religion",
        "address",
      );
      if (permanentSame === false) s.push("permanent-address");
      s.push("education-q");
      if (educationComplete === true) s.push("degree");
      if (educationComplete === false) s.push("current-year");
      s.push("email", "emergency-contact");
    } else if (isStudent === true) {
      s.push(
        "name",
        "parents-name",
        "dob-gender",
        "religion",
        "phone",
        "address",
      );
      if (permanentSame === false) s.push("permanent-address");
      s.push("student-class");
      if (needsSubject) s.push("student-subject");
      s.push("roll-school", "email", "emergency-contact");
    }

    s.push("avatar", "password");
    return s;
  }, [isStudent, permanentSame, educationComplete, needsSubject]);

  const currentId = steps[stepIndex] ?? "password";

  // ─── Navigation ───────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  // ─── Trigger + go helper ──────────────────────────────────────────────

  const triggerAndGo = useCallback(
    async (fields: (keyof SignupForm)[]) => {
      if (await trigger(fields)) goNext();
    },
    [trigger, goNext],
  );

  // ─── Enter key → next step ───────────────────────────────────────────

  const nextActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA") return;
      if (e.key !== "Enter" || e.shiftKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.getAttribute("type") === "submit") return;
      e.preventDefault();
      nextActionRef.current?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Update next action ref per step (via useEffect, not in render)
  useEffect(() => {
    switch (currentId) {
      case "who":
        nextActionRef.current = () => {
          if (isStudent !== null) goNext();
        };
        break;
      case "name":
        nextActionRef.current = () => triggerAndGo(["fullName"]);
        break;
      case "parents-name":
        nextActionRef.current = () =>
          triggerAndGo(["fatherName", "motherName"]);
        break;
      case "dob-gender":
        nextActionRef.current = () => {
          if (dobIso && gender !== null) goNext();
        };
        break;
      case "religion":
        nextActionRef.current = () => {
          if (religion !== null) goNext();
        };
        break;
      case "phone":
        nextActionRef.current = () => triggerAndGo(["phone"]);
        break;
      case "address":
        nextActionRef.current = async () => {
          const ok = await trigger(["gramNam", "para", "landmark"]);
          if (ok && permanentSame !== null && geoComplete) goNext();
        };
        break;
      case "permanent-address":
        nextActionRef.current = async () => {
          const ok = await trigger(["permanentGramNam", "permanentPara"]);
          if (ok && pGeoComplete) goNext();
        };
        break;
      case "student-class":
        nextActionRef.current = () => {
          if (selectedClass) goNext();
        };
        break;
      case "student-subject":
        nextActionRef.current = () => {
          if (selectedSubject) goNext();
        };
        break;
      case "roll-school":
        nextActionRef.current = () => triggerAndGo(["roll", "schoolName"]);
        break;
      case "education-q":
        nextActionRef.current = () => {
          if (educationComplete !== null) goNext();
        };
        break;
      case "degree":
        nextActionRef.current = () => triggerAndGo(["degree", "qualification"]);
        break;
      case "current-year":
        nextActionRef.current = () =>
          triggerAndGo(["currentYear", "qualification"]);
        break;
      case "email":
        nextActionRef.current = () => triggerAndGo(["email"]);
        break;
      case "emergency-contact":
        nextActionRef.current = () => triggerAndGo(["emergencyContact"]);
        break;
      case "avatar":
        nextActionRef.current = () => {
          if (avatarFile) goNext();
          else toast.error("প্রোফাইল ছবি দেওয়া বাধ্যতামূলক");
        };
        break;
      default:
        nextActionRef.current = null;
    }
  }, [
    currentId,
    isStudent,
    dobIso,
    gender,
    religion,
    permanentSame,
    geoComplete,
    pGeoComplete,
    selectedClass,
    selectedSubject,
    educationComplete,
    avatarFile,
    goNext,
    trigger,
    triggerAndGo,
  ]);

  // ─── Submit ───────────────────────────────────────────────────────────

  const onSubmit = async (data: SignupForm) => {
    if (!dobIso) {
      toast.error("জন্ম তারিখ দিন");
      return;
    }
    if (!avatarFile) {
      toast.error("প্রোফাইল ছবি দেওয়া বাধ্যতামূলক");
      return;
    }

    try {
      const fd = new FormData();

      if (isStudent) {
        fd.append("name", data.fullName.trim());
        fd.append("role", "student");
        fd.append("phone", toAsciiDigits(data.phone));
        fd.append("studentClass", selectedClass);
        if (needsSubject) fd.append("studentSubject", selectedSubject);
        fd.append("roll", toAsciiDigits(data.roll ?? ""));
        fd.append("schoolName", data.schoolName ?? "");
      } else {
        fd.append("role", staffInfo!.role);
        fd.append("phone", staffPhone!);
        fd.append("educationComplete", String(educationComplete));
        if (data.qualification) fd.append("qualification", data.qualification);
        if (educationComplete === true && data.degree)
          fd.append("degree", data.degree);
        if (educationComplete === false && data.currentYear)
          fd.append("currentYear", data.currentYear);
      }

      // Common fields
      fd.append("fatherName", data.fatherName.trim());
      fd.append("motherName", data.motherName.trim());
      fd.append("email", data.email ?? "");
      fd.append("gender", gender ?? "");
      fd.append("dateOfBirth", dobIso);
      fd.append("religion", religion ?? "");
      fd.append("password", data.password);
      fd.append("emergencyContact", toAsciiDigits(data.emergencyContact ?? ""));

      // Present address
      fd.append("gramNam", data.gramNam);
      fd.append("para", data.para ?? "");
      fd.append("division", division);
      fd.append("district", district);
      fd.append("thana", thana);
      fd.append("landmark", data.landmark ?? "");
      fd.append("permanentSameAsPresent", String(permanentSame ?? true));

      // Permanent address
      if (permanentSame === false) {
        fd.append("permanentGramNam", data.permanentGramNam ?? "");
        fd.append("permanentPara", data.permanentPara ?? "");
        fd.append("permanentDivision", pDivision);
        fd.append("permanentDistrict", pDistrict);
        fd.append("permanentThana", pThana);
      }

      fd.append("avatar", avatarFile);

      const { data: res } = await axiosPublic.post<{
        success: boolean;
        token: string;
        user: AuthUser;
      }>("/api/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem(TOKEN_KEY, res.token);
      setUser(res.user);
      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! 🎉");
      navigate("/");
    } catch (err: unknown) {
      toast.error(getApiMessage(err, "কিছু একটা সমস্যা হয়েছে"));
    }
  };

  // ─── Render Step ──────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentId) {
      case "who":
        return (
          <StepShell title="আপনি রয়েল একাডেমিতে কোন পরিচয়ে যুক্ত?">
            <div className="space-y-2.5">
              <CardBtn
                selected={isStudent === true}
                onClick={() => setIsStudent(true)}
              >
                🎒 আমি ছাত্র/ছাত্রী
              </CardBtn>
              <CardBtn
                selected={isStudent === false}
                onClick={() => setIsStudent(false)}
              >
                📚 আমি শিক্ষক/কর্মী
              </CardBtn>
            </div>
            <div className="flex justify-end mt-6">
              <PrimaryBtn disabled={isStudent === null} onClick={goNext}>
                পরবর্তী <ChevronRight size={15} />
              </PrimaryBtn>
            </div>
          </StepShell>
        );

      case "staff-phone-check":
        return (
          <StaffPhoneCheck
            onBack={goBack}
            onVerified={(phone, info) => {
              setStaffPhone(phone);
              setStaffInfo(info);
              goNext();
            }}
          />
        );

      case "name":
        return (
          <StepShell
            title="আপনার পূর্ণ নাম কী?"
            subtitle="সনদে যেভাবে থাকবে — বাংলায় লিখুন"
          >
            <ValidatedInput
              autoFocus
              state={fs("fullName")}
              iconLeft={User}
              placeholder="পূর্ণ নাম বাংলায় লিখুন"
              error={errors.fullName?.message}
              blockEnglish
              {...register("fullName", {
                required: "নাম লিখুন",
                minLength: { value: 3, message: "কমপক্ষে ৩ অক্ষর" },
                validate: bangladeshiNameValidator("নাম"),
              })}
            />
            <NavRow onBack={goBack} onNext={() => triggerAndGo(["fullName"])} />
          </StepShell>
        );

      case "parents-name":
        return (
          <StepShell
            title="অভিভাবকের নাম লিখুন"
            subtitle="বাংলায় পূর্ণ নাম লিখুন"
          >
            {!isStudent && staffInfo && (
              <div
                className="mb-4 px-4 py-2.5 rounded-xl text-sm bangla"
                style={{
                  backgroundColor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: "var(--color-text)",
                }}
              >
                ✅ অ্যাকাউন্ট পাওয়া গেছে:{" "}
                <span className="font-bold text-blue-500">
                  {staffInfo.name}
                </span>
              </div>
            )}
            <div className="space-y-3">
              <ValidatedInput
                autoFocus
                state={fs("fatherName")}
                iconLeft={User}
                label="বাবার নাম *"
                placeholder="বাবার পূর্ণ নাম বাংলায়"
                error={errors.fatherName?.message}
                blockEnglish
                {...register("fatherName", {
                  required: "বাবার নাম লিখুন",
                  minLength: { value: 3, message: "কমপক্ষে ৩ অক্ষর" },
                  validate: bangladeshiNameValidator("বাবার নাম"),
                })}
              />
              <ValidatedInput
                state={fs("motherName")}
                iconLeft={User}
                label="মায়ের নাম *"
                placeholder="মায়ের পূর্ণ নাম বাংলায়"
                error={errors.motherName?.message}
                blockEnglish
                {...register("motherName", {
                  required: "মায়ের নাম লিখুন",
                  minLength: { value: 3, message: "কমপক্ষে ৩ অক্ষর" },
                  validate: bangladeshiNameValidator("মায়ের নাম"),
                })}
              />
            </div>
            <NavRow
              onBack={goBack}
              onNext={() => triggerAndGo(["fatherName", "motherName"])}
            />
          </StepShell>
        );

      case "dob-gender": {
        const genderOpts = isStudent
          ? STUDENT_GENDER_OPTIONS
          : STAFF_GENDER_OPTIONS;

        return (
          <StepShell
            title="জন্ম তারিখ ও লিঙ্গ"
            subtitle="সঠিক তথ্য দেওয়া বাধ্যতামূলক"
          >
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold mb-1.5 bangla text-[var(--color-gray)]">
                  জন্ম তারিখ <span className="text-red-400">*</span>
                </p>
                <DatePicker
                  value={dobDisplay}
                  onChange={setDobDisplay}
                  onDateChange={(date) => {
                    if (!isNaN(date.getTime())) setDobIso(toLocalIso(date));
                  }}
                  placeholder="জন্ম তারিখ বেছে নিন"
                  maxDate={new Date()}
                />
                <RequiredWarning
                  show={!dobIso}
                  message="জন্ম তারিখ বাধ্যতামূলক"
                />
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 bangla text-[var(--color-gray)]">
                  {isStudent ? "ছেলে নাকি মেয়ে?" : "লিঙ্গ"}{" "}
                  <span className="text-red-400">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {genderOpts.map((o) => (
                    <GenderBtn
                      key={o.v ?? ""}
                      selected={gender === o.v}
                      onClick={() => setGender(o.v)}
                      icon={o.icon}
                      label={o.v ?? ""}
                    />
                  ))}
                </div>
                <RequiredWarning
                  show={gender === null}
                  message="লিঙ্গ নির্বাচন করুন"
                />
              </div>
            </div>
            <NavRow
              onBack={goBack}
              disabled={!dobIso || gender === null}
              onNext={goNext}
            />
          </StepShell>
        );
      }

      case "religion":
        return (
          <StepShell
            title="আপনার ধর্ম কী?"
            subtitle="একটি নির্বাচন করুন — বাধ্যতামূলক"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RELIGIONS.map((r) => (
                <ReligionBtn
                  key={r.value}
                  selected={religion === r.value}
                  onClick={() => setReligion(r.value as Religion)}
                  icon={r.icon}
                  label={r.value}
                />
              ))}
            </div>
            <RequiredWarning
              show={religion === null}
              message="ধর্ম নির্বাচন বাধ্যতামূলক"
            />
            <NavRow
              onBack={goBack}
              disabled={religion === null}
              onNext={goNext}
            />
          </StepShell>
        );

      case "phone":
        return (
          <StepShell
            title="আপনার ফোন নম্বর?"
            subtitle="লগইন করতে এই নম্বর লাগবে — বাধ্যতামূলক"
          >
            <ValidatedInput
              autoFocus
              type="tel"
              numericOnly
              state={fs("phone")}
              iconLeft={Phone}
              placeholder="০১XXXXXXXXX"
              error={errors.phone?.message}
              {...register("phone", {
                required: "ফোন নম্বর দেওয়া বাধ্যতামূলক",
                validate: validateBdPhone,
              })}
            />
            <NavRow onBack={goBack} onNext={() => triggerAndGo(["phone"])} />
          </StepShell>
        );

      case "address":
        return (
          <StepShell
            title="বর্তমান ঠিকানা দিন"
            subtitle="সব তথ্য বাংলায় দেওয়া বাধ্যতামূলক"
          >
            <GeoAddressFields
              register={register}
              errors={errors}
              fs={fs}
              division={division}
              setDivision={setDivision}
              district={district}
              setDistrict={setDistrict}
              thana={thana}
              setThana={setThana}
              showLandmark
              permanentSame={permanentSame}
              setPermanentSame={setPermanentSame}
            />
            <GeoWarning division={division} district={district} thana={thana} />
            <NavRow
              onBack={goBack}
              disabled={permanentSame === null || !geoComplete}
              onNext={async () => {
                const ok = await trigger(["gramNam", "para", "landmark"]);
                if (ok && permanentSame !== null && geoComplete) goNext();
              }}
            />
          </StepShell>
        );

      case "permanent-address":
        return (
          <StepShell
            title="স্থায়ী ঠিকানা দিন"
            subtitle="মূল বাড়ির ঠিকানা — সব তথ্য বাংলায়"
          >
            <GeoAddressFields
              prefix="permanent"
              register={register}
              errors={errors}
              fs={fs}
              division={pDivision}
              setDivision={setPDivision}
              district={pDistrict}
              setDistrict={setPDistrict}
              thana={pThana}
              setThana={setPThana}
            />
            <GeoWarning
              division={pDivision}
              district={pDistrict}
              thana={pThana}
            />
            <NavRow
              onBack={goBack}
              disabled={!pGeoComplete}
              onNext={async () => {
                const ok = await trigger(["permanentGramNam", "permanentPara"]);
                if (ok && pGeoComplete) goNext();
              }}
            />
          </StepShell>
        );

      case "student-class":
        return (
          <StepShell
            title="আপনি কোন শ্রেণিতে পড়েন?"
            subtitle="একটি শ্রেণি নির্বাচন করুন — বাধ্যতামূলক"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CLASSES.map((cls) => (
                <GridBtn
                  key={cls}
                  selected={selectedClass === cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    if (!ADVANCED_CLASSES.includes(cls)) setSelectedSubject("");
                  }}
                >
                  🎓 {cls}
                </GridBtn>
              ))}
            </div>
            <RequiredWarning
              show={!selectedClass}
              message="শ্রেণি নির্বাচন বাধ্যতামূলক"
            />
            <NavRow onBack={goBack} disabled={!selectedClass} onNext={goNext} />
          </StepShell>
        );

      case "student-subject":
        return (
          <StepShell
            title="আপনার বিভাগ কোনটি?"
            subtitle={`${selectedClass} — বিভাগ নির্বাচন করুন — বাধ্যতামূলক`}
          >
            <div className="space-y-2.5">
              {SUBJECT_GROUPS.map((s) => (
                <CardBtn
                  key={s.value}
                  selected={selectedSubject === s.value}
                  onClick={() => setSelectedSubject(s.value)}
                >
                  {s.icon} {s.value}
                </CardBtn>
              ))}
            </div>
            <RequiredWarning
              show={!selectedSubject}
              message="বিভাগ নির্বাচন বাধ্যতামূলক"
            />
            <NavRow
              onBack={goBack}
              disabled={!selectedSubject}
              onNext={goNext}
            />
          </StepShell>
        );

      case "roll-school":
        return (
          <StepShell
            title="বিদ্যালয়ের তথ্য"
            subtitle="রোল নম্বর ও বিদ্যালয়ের নাম — বাধ্যতামূলক"
          >
            <div className="space-y-3">
              <ValidatedInput
                autoFocus
                numericOnly
                state={fs("roll")}
                iconLeft={Hash}
                label="রোল নম্বর *"
                placeholder="আপনার রোল নম্বর"
                error={errors.roll?.message}
                {...register("roll", {
                  required: "রোল নম্বর দেওয়া বাধ্যতামূলক",
                })}
              />
              <ValidatedInput
                state={fs("schoolName")}
                iconLeft={School}
                label="বিদ্যালয়ের নাম *"
                placeholder="বিদ্যালয়ের পূর্ণ নাম বাংলায়"
                error={errors.schoolName?.message}
                blockEnglish
                {...register("schoolName", {
                  required: "বিদ্যালয়ের নাম দেওয়া বাধ্যতামূলক",
                  validate: banglaOnly("বিদ্যালয়ের নাম"),
                })}
              />
            </div>
            <NavRow
              onBack={goBack}
              onNext={() => triggerAndGo(["roll", "schoolName"])}
            />
          </StepShell>
        );

      case "education-q":
        return (
          <StepShell
            title="আপনার পড়াশোনা কি শেষ হয়েছে?"
            subtitle="একটি নির্বাচন করুন — বাধ্যতামূলক"
          >
            <div className="space-y-2.5">
              <CardBtn
                selected={educationComplete === true}
                onClick={() => setEducationComplete(true)}
              >
                ✅ হ্যাঁ, পড়াশোনা সম্পন্ন
              </CardBtn>
              <CardBtn
                selected={educationComplete === false}
                onClick={() => setEducationComplete(false)}
              >
                📚 না, এখনও পড়ছি
              </CardBtn>
            </div>
            <RequiredWarning
              show={educationComplete === null}
              message="একটি বিকল্প নির্বাচন করুন"
            />
            <NavRow
              onBack={goBack}
              disabled={educationComplete === null}
              onNext={goNext}
            />
          </StepShell>
        );

      case "degree": {
        const sel = watch("degree");
        return (
          <StepShell
            title="আপনার সর্বোচ্চ ডিগ্রি কী?"
            subtitle="সব তথ্য বাংলায় — বাধ্যতামূলক"
          >
            <div className="space-y-3">
              <ValidatedInput
                autoFocus
                state={fs("qualification")}
                iconLeft={BookOpen}
                label="যোগ্যতা / বিষয় *"
                placeholder="যেমন: বিএড, বিসিএস, বাংলা সাহিত্য"
                error={errors.qualification?.message}
                blockEnglish
                {...register("qualification", {
                  required: "যোগ্যতার বিবরণ দিন",
                  validate: banglaOnly("যোগ্যতা"),
                })}
              />
              <div className="space-y-2">
                {DEGREES.map((d) => (
                  <CardBtn
                    key={d.value}
                    selected={sel === d.value}
                    onClick={() =>
                      setValue("degree", d.value, { shouldValidate: true })
                    }
                  >
                    {d.icon} {d.label}
                  </CardBtn>
                ))}
              </div>
              <input
                type="hidden"
                {...register("degree", {
                  required: "ডিগ্রি নির্বাচন করুন",
                })}
              />
              <ValidationMsg message={errors.degree?.message} />
            </div>
            <NavRow
              onBack={goBack}
              onNext={() => triggerAndGo(["degree", "qualification"])}
            />
          </StepShell>
        );
      }

      case "current-year": {
        const sel = watch("currentYear");
        return (
          <StepShell
            title="বর্তমানে কোন বর্ষে পড়ছেন?"
            subtitle="সব তথ্য বাংলায় — বাধ্যতামূলক"
          >
            <div className="space-y-3">
              <ValidatedInput
                autoFocus
                state={fs("qualification")}
                iconLeft={BookOpen}
                label="পড়ার বিষয় / প্রতিষ্ঠান *"
                placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়, বাংলা বিভাগ"
                error={errors.qualification?.message}
                blockEnglish
                {...register("qualification", {
                  required: "পড়ার বিষয় ও প্রতিষ্ঠান লিখুন",
                  validate: banglaOnly("পড়ার বিষয়"),
                })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {YEARS.map((y) => (
                  <GridBtn
                    key={y.value}
                    selected={sel === y.value}
                    onClick={() =>
                      setValue("currentYear", y.value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    📖 {y.label}
                  </GridBtn>
                ))}
              </div>
              <input
                type="hidden"
                {...register("currentYear", {
                  required: "বর্ষ নির্বাচন করুন",
                })}
              />
              <ValidationMsg message={errors.currentYear?.message} />
            </div>
            <NavRow
              onBack={goBack}
              onNext={() => triggerAndGo(["currentYear", "qualification"])}
            />
          </StepShell>
        );
      }

      case "email":
        return (
          <StepShell
            title="ইমেইল ঠিকানা"
            subtitle="বাধ্যতামূলক — ভুলে গেলে পাসওয়ার্ড পুনরুদ্ধারে লাগবে"
          >
            <ValidatedInput
              autoFocus
              type="email"
              banglaDigits={false}
              blockEnglish={false}
              state={fs("email")}
              iconLeft={Mail}
              placeholder="example@email.com"
              error={errors.email?.message}
              {...register("email", {
                required: "ইমেইল ঠিকানা দেওয়া বাধ্যতামূলক",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "সঠিক ইমেইল ঠিকানা দিন",
                },
              })}
            />
            <NavRow onBack={goBack} onNext={() => triggerAndGo(["email"])} />
          </StepShell>
        );

      case "emergency-contact":
        return (
          <StepShell
            title="জরুরি যোগাযোগ নম্বর"
            subtitle="অভিভাবক বা নিকটজনের বাংলাদেশি মোবাইল নম্বর — বাধ্যতামূলক"
          >
            <ValidatedInput
              autoFocus
              type="tel"
              numericOnly
              state={fs("emergencyContact")}
              iconLeft={PhoneCall}
              placeholder="০১XXXXXXXXX"
              error={errors.emergencyContact?.message}
              {...register("emergencyContact", {
                required: "জরুরি যোগাযোগ নম্বর দেওয়া বাধ্যতামূলক",
                validate: validateBdPhone,
              })}
            />
            <NavRow
              onBack={goBack}
              onNext={() => triggerAndGo(["emergencyContact"])}
            />
          </StepShell>
        );

      case "avatar":
        return (
          <StepShell
            title="প্রোফাইল ছবি দিন"
            subtitle="ছবি আপলোড করা বাধ্যতামূলক — এড়ানো যাবে না"
          >
            <AvatarPicker
              gender={gender}
              preview={avatarPreview}
              onChange={(f) => {
                setAvatarFile(f);
                setAvatarPreview(URL.createObjectURL(f));
              }}
              onRemove={() => {
                setAvatarFile(null);
                setAvatarPreview(null);
              }}
            />
            <div className="flex justify-between mt-6">
              <SecondaryBtn onClick={goBack}>
                <ChevronLeft size={15} /> পেছনে
              </SecondaryBtn>
              <PrimaryBtn
                onClick={() => {
                  if (avatarFile) goNext();
                  else toast.error("প্রোফাইল ছবি আপলোড করুন — বাধ্যতামূলক");
                }}
                disabled={!avatarFile}
              >
                পরবর্তী <ChevronRight size={15} />
              </PrimaryBtn>
            </div>
          </StepShell>
        );

      case "password":
        return (
          <StepShell title="পাসওয়ার্ড তৈরি করুন" subtitle="কমপক্ষে ৬টি অক্ষর">
            <form onSubmit={handleSubmit(onSubmit)}>
              <PasswordInput
                autoFocus
                state={fs("password")}
                iconLeft={Lock}
                showPassword={showPw}
                onToggle={() => setShowPw((p) => !p)}
                EyeIcon={Eye}
                EyeOffIcon={EyeOff}
                placeholder="পাসওয়ার্ড লিখুন"
                error={errors.password?.message}
                {...register("password", {
                  required: "পাসওয়ার্ড দেওয়া বাধ্যতামূলক",
                  minLength: { value: 6, message: "কমপক্ষে ৬টি অক্ষর" },
                })}
              />
              <SummaryBox
                rows={[
                  {
                    label: "ভূমিকা",
                    value: isStudent
                      ? "ছাত্র/ছাত্রী"
                      : STAFF_ROLE_LABELS[staffInfo?.role ?? "teacher"],
                  },
                  {
                    label: "নাম",
                    value: isStudent
                      ? watch("fullName")?.trim() || "—"
                      : (staffInfo?.name ?? "—"),
                  },
                  {
                    label: "ফোন",
                    value: isStudent
                      ? watch("phone") || "—"
                      : staffPhone
                        ? toBanglaDigits(staffPhone)
                        : "—",
                  },
                  { label: "জন্ম তারিখ", value: dobDisplay || "—" },
                  { label: "বিভাগ", value: division || "—" },
                  { label: "জেলা", value: district || "—" },
                  { label: "থানা", value: thana || "—" },
                  { label: "লিঙ্গ", value: gender || "—" },
                  { label: "ধর্ম", value: religion || "—" },
                  ...(isStudent && selectedClass
                    ? [{ label: "শ্রেণি", value: selectedClass }]
                    : []),
                  ...(isStudent && needsSubject && selectedSubject
                    ? [{ label: "বিভাগ", value: selectedSubject }]
                    : []),
                ]}
              />
              <div className="flex justify-between mt-5">
                <SecondaryBtn onClick={goBack}>
                  <ChevronLeft size={15} /> পেছনে
                </SecondaryBtn>
                <SubmitBtn disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      অপেক্ষা করুন...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> অ্যাকাউন্ট খুলুন
                    </>
                  )}
                </SubmitBtn>
              </div>
            </form>
          </StepShell>
        );

      default:
        return null;
    }
  };

  // ─── Page Shell ───────────────────────────────────────────────────────

  return (
    <PageShell
      stepIndex={stepIndex}
      totalSteps={steps.length}
      footer={
        <p className="text-center text-sm bangla text-[var(--color-gray)]">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link
            to="/login"
            className="font-semibold hover:underline text-blue-500"
          >
            লগইন করুন
          </Link>
        </p>
      }
    >
      <div
        className="pt-6 pb-4 text-center -mx-4 sm:-mx-8 px-4 sm:px-8 mb-1"
        style={{
          borderBottom: "1px solid var(--color-active-border)",
        }}
      >
        <Link to="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-2.5"
            style={{
              background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            }}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </motion.div>
        </Link>
        <h2 className="text-lg font-bold bangla text-[var(--color-text)]">
          রয়েল একাডেমি
        </h2>
        <p className="text-xs bangla mt-0.5 text-[var(--color-gray)]">
          নতুন অ্যাকাউন্ট তৈরি করুন
        </p>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentId}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTrans}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  );
};

export default Signup;
