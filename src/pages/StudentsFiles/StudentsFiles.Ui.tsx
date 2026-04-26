import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  MapPin,
  BookOpen,
  Eye,
  Trash2,
  Edit3,
  X,
  Save,
  User,
  GraduationCap,
  Monitor,
  Wifi,
  Cpu,
  Clock,
} from "lucide-react";
import { createPortal } from "react-dom";
import PersonModal, {
  formatDOB,
  InfoRow,
  Section,
} from "../../components/common/PersonModal";
import { Avatar } from "../../components/common/Avatar";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Student {
  _id: string;
  name: string;
  fatherName?: string | null;
  motherName?: string | null;
  phone?: string | null;
  slug?: string;
  gender?: string | null;
  religion?: string | null;
  dateOfBirth?: string | null;
  emergencyContact?: string | null;
  gramNam?: string | null;
  para?: string | null;
  thana?: string | null;
  district?: string | null;
  division?: string | null;
  landmark?: string | null;
  permanentSameAsPresent?: boolean;
  permanentGramNam?: string | null;
  permanentPara?: string | null;
  permanentThana?: string | null;
  permanentDistrict?: string | null;
  permanentDivision?: string | null;
  studentClass?: string | null;
  studentSubject?: string | null;
  roll?: string | null;
  schoolName?: string | null;
  avatar?: { url: string | null };
  role?: string;
  isHardcoded?: boolean;
}

export interface SessionSummary {
  _id: string;
  name?: string | null;
  role?: string | null;
  slug?: string | null;
  totalLogins?: number;
  totalActiveSeconds?: number;
  totalActiveMinutes?: number;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  lastDevice?: {
    vendor?: string | null;
    model?: string | null;
    type?: string | null;
  };
  lastOS?: {
    name?: string | null;
    version?: string | null;
  };
  lastBrowser?: {
    name?: string | null;
    version?: string | null;
  };
  lastIP?: string | null;
  lastHardware?: {
    screenWidth?: number | null;
    screenHeight?: number | null;
    colorDepth?: number | null;
    pixelRatio?: number | null;
    ram?: number | null;
    cpuCores?: number | null;
    isTouchScreen?: boolean | null;
    maxTouchPoints?: number | null;
    language?: string | null;
    languages?: string[];
    timezone?: string | null;
    timezoneOffset?: number | null;
    platform?: string | null;
    cookiesEnabled?: boolean | null;
    doNotTrack?: string | null;
    pdfViewerEnabled?: boolean | null;
    webglVendor?: string | null;
    webglRenderer?: string | null;
    screenResolution?: string | null;
    availableResolution?: string | null;
    colorGamut?: string | null;
    hdr?: boolean | null;
    prefersDark?: boolean | null;
    prefersReducedMotion?: boolean | null;
    touchSupport?: boolean | null;
    pointerType?: string | null;
    fonts?: string[];
    plugins?: string[];
  };
  lastNetwork?: {
    type?: string | null;
    effectiveType?: string | null;
    downlink?: number | null;
    rtt?: number | null;
    saveData?: boolean | null;
  };
  lastBattery?: {
    level?: number | null;
    charging?: boolean | null;
  };
  lastViewport?: {
    width?: number | null;
    height?: number | null;
    outerWidth?: number | null;
    outerHeight?: number | null;
  };
  lastOrientation?: {
    angle?: number | null;
    type?: string | null;
  };
  isOnline?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getAccent = (gender?: string | null) =>
  gender === "মেয়ে" || gender === "নারী" ? "#ec4899" : "#3b82f6";

const joinValues = (
  arr?: Array<string | number | null | undefined>,
): string | null => {
  const clean = (arr ?? []).filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== "",
  );
  return clean.length ? clean.join(", ") : null;
};

const boolText = (v?: boolean | null) =>
  v === null || v === undefined ? null : v ? "হ্যাঁ" : "না";

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("bn-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatBrowser = (b?: SessionSummary["lastBrowser"]) =>
  joinValues([b?.name, b?.version]);

const formatOS = (o?: SessionSummary["lastOS"]) =>
  joinValues([o?.name, o?.version]);

const formatDevice = (d?: SessionSummary["lastDevice"]) =>
  joinValues([d?.vendor, d?.model, d?.type]);

const formatScreen = (w?: number | null, h?: number | null): string | null =>
  w || h ? `${w ?? "—"} × ${h ?? "—"}` : null;

const formatViewport = (v?: SessionSummary["lastViewport"]): string | null =>
  v?.width || v?.height ? `${v.width ?? "—"} × ${v.height ?? "—"}` : null;

const formatOuterViewport = (
  v?: SessionSummary["lastViewport"],
): string | null =>
  v?.outerWidth || v?.outerHeight
    ? `${v.outerWidth ?? "—"} × ${v.outerHeight ?? "—"}`
    : null;

const formatBattery = (b?: SessionSummary["lastBattery"]) => {
  if (!b) return null;
  if (b.level == null && b.charging == null) return null;
  return `${b.level ?? "—"}%${b.charging === true ? " · চার্জ হচ্ছে" : b.charging === false ? " · চার্জ হচ্ছে না" : ""}`;
};

const formatOrientation = (o?: SessionSummary["lastOrientation"]) => {
  if (!o) return null;
  return joinValues([
    o.type ?? null,
    o.angle !== null && o.angle !== undefined ? `${o.angle}°` : null,
  ]);
};

// ── Session sections ──────────────────────────────────────────────────────────
const SessionInfoSections = ({
  sessionInfo,
  accent,
}: {
  sessionInfo?: SessionSummary | null;
  accent: string;
}) => {
  if (!sessionInfo) {
    return (
      <Section
        title="ডিভাইস / সেশন তথ্য"
        color={accent + "0a"}
        borderColor={accent + "33"}
        titleColor={accent}
        icon={<Monitor className="w-3 h-3" />}
      >
        <p className="text-xs bangla text-[var(--color-gray)]">
          এখনো কোনো সেশন তথ্য পাওয়া যায়নি।
        </p>
      </Section>
    );
  }

  const hw = sessionInfo.lastHardware;
  const nw = sessionInfo.lastNetwork;
  const bt = sessionInfo.lastBattery;
  const vp = sessionInfo.lastViewport;
  const or = sessionInfo.lastOrientation;

  const hasDeviceSection =
    formatBrowser(sessionInfo.lastBrowser) ||
    formatOS(sessionInfo.lastOS) ||
    formatDevice(sessionInfo.lastDevice) ||
    sessionInfo.lastIP;

  const hasHardwareSection =
    hw?.screenResolution ||
    formatScreen(hw?.screenWidth, hw?.screenHeight) ||
    hw?.availableResolution ||
    hw?.colorDepth != null ||
    hw?.pixelRatio != null ||
    hw?.ram != null ||
    hw?.cpuCores != null ||
    hw?.language ||
    joinValues(hw?.languages) ||
    hw?.timezone ||
    hw?.timezoneOffset != null ||
    hw?.platform ||
    hw?.webglVendor ||
    hw?.webglRenderer ||
    hw?.colorGamut ||
    hw?.pointerType ||
    joinValues(hw?.fonts) ||
    joinValues(hw?.plugins) ||
    boolText(hw?.isTouchScreen) ||
    boolText(hw?.touchSupport) ||
    boolText(hw?.cookiesEnabled) ||
    boolText(hw?.pdfViewerEnabled) ||
    boolText(hw?.hdr) ||
    boolText(hw?.prefersDark) ||
    boolText(hw?.prefersReducedMotion);

  const hasNetworkSection =
    nw?.type ||
    nw?.effectiveType ||
    nw?.downlink != null ||
    nw?.rtt != null ||
    nw?.saveData != null ||
    formatBattery(bt) ||
    formatViewport(vp) ||
    formatOuterViewport(vp) ||
    formatOrientation(or);

  return (
    <>
      <Section
        title="সেশন সারাংশ"
        color="rgba(34,197,94,0.06)"
        borderColor="rgba(34,197,94,0.2)"
        titleColor="#22c55e"
        icon={<Clock className="w-3 h-3" />}
      >
        <InfoRow
          label="অবস্থা"
          value={sessionInfo.isOnline ? "অনলাইন" : "অফলাইন"}
        />
        <InfoRow
          label="মোট লগইন"
          value={
            sessionInfo.totalLogins != null
              ? String(sessionInfo.totalLogins)
              : null
          }
        />
        <InfoRow
          label="সক্রিয় সময়"
          value={
            sessionInfo.totalActiveMinutes != null
              ? `${sessionInfo.totalActiveMinutes} মিনিট`
              : null
          }
        />
        <InfoRow
          label="শেষ লগইন"
          value={formatDateTime(sessionInfo.lastLoginAt)}
        />
        <InfoRow
          label="শেষ সক্রিয়"
          value={formatDateTime(sessionInfo.lastActiveAt)}
        />
      </Section>

      {hasDeviceSection && (
        <Section
          title="ডিভাইস ও ব্রাউজার"
          color="rgba(59,130,246,0.06)"
          borderColor="rgba(59,130,246,0.2)"
          titleColor="#3b82f6"
          icon={<Monitor className="w-3 h-3" />}
        >
          <InfoRow
            label="ব্রাউজার"
            value={formatBrowser(sessionInfo.lastBrowser)}
          />
          <InfoRow label="OS" value={formatOS(sessionInfo.lastOS)} />
          <InfoRow
            label="ডিভাইস"
            value={formatDevice(sessionInfo.lastDevice)}
          />
          <InfoRow label="IP" value={sessionInfo.lastIP} />
        </Section>
      )}

      {hasHardwareSection && (
        <Section
          title="হার্ডওয়্যার ও পরিবেশ"
          color="rgba(139,92,246,0.06)"
          borderColor="rgba(139,92,246,0.2)"
          titleColor="#8b5cf6"
          icon={<Cpu className="w-3 h-3" />}
        >
          <InfoRow label="স্ক্রিন" value={hw?.screenResolution} />
          <InfoRow
            label="স্ক্রিন (W×H)"
            value={formatScreen(hw?.screenWidth, hw?.screenHeight)}
          />
          <InfoRow label="Available" value={hw?.availableResolution} />
          <InfoRow
            label="Color depth"
            value={hw?.colorDepth != null ? String(hw.colorDepth) : null}
          />
          <InfoRow
            label="Pixel ratio"
            value={hw?.pixelRatio != null ? String(hw.pixelRatio) : null}
          />
          <InfoRow
            label="RAM"
            value={hw?.ram != null ? `${hw.ram} GB` : null}
          />
          <InfoRow
            label="CPU cores"
            value={hw?.cpuCores != null ? String(hw.cpuCores) : null}
          />
          <InfoRow label="Touch screen" value={boolText(hw?.isTouchScreen)} />
          <InfoRow label="Touch support" value={boolText(hw?.touchSupport)} />
          <InfoRow
            label="Max touch"
            value={
              hw?.maxTouchPoints != null ? String(hw.maxTouchPoints) : null
            }
          />
          <InfoRow label="Language" value={hw?.language} />
          <InfoRow label="Languages" value={joinValues(hw?.languages)} />
          <InfoRow label="Timezone" value={hw?.timezone} />
          <InfoRow
            label="TZ offset"
            value={
              hw?.timezoneOffset != null ? String(hw.timezoneOffset) : null
            }
          />
          <InfoRow label="Platform" value={hw?.platform} />
          <InfoRow label="Cookies" value={boolText(hw?.cookiesEnabled)} />
          <InfoRow label="DNT" value={hw?.doNotTrack} />
          <InfoRow label="PDF viewer" value={boolText(hw?.pdfViewerEnabled)} />
          <InfoRow label="GPU vendor" value={hw?.webglVendor} />
          <InfoRow label="GPU renderer" value={hw?.webglRenderer} />
          <InfoRow label="Color gamut" value={hw?.colorGamut} />
          <InfoRow label="HDR" value={boolText(hw?.hdr)} />
          <InfoRow label="Dark mode" value={boolText(hw?.prefersDark)} />
          <InfoRow
            label="Reduced motion"
            value={boolText(hw?.prefersReducedMotion)}
          />
          <InfoRow label="Pointer" value={hw?.pointerType} />
          <InfoRow label="Fonts" value={joinValues(hw?.fonts)} />
          <InfoRow label="Plugins" value={joinValues(hw?.plugins)} />
        </Section>
      )}

      {hasNetworkSection && (
        <Section
          title="নেটওয়ার্ক / ব্যাটারি / ভিউপোর্ট"
          color="rgba(245,158,11,0.06)"
          borderColor="rgba(245,158,11,0.2)"
          titleColor="#f59e0b"
          icon={<Wifi className="w-3 h-3" />}
        >
          <InfoRow label="Network type" value={nw?.type} />
          <InfoRow label="Effective type" value={nw?.effectiveType} />
          <InfoRow
            label="Downlink"
            value={nw?.downlink != null ? `${nw.downlink} Mbps` : null}
          />
          <InfoRow
            label="RTT"
            value={nw?.rtt != null ? `${nw.rtt} ms` : null}
          />
          <InfoRow label="Save data" value={boolText(nw?.saveData)} />
          <InfoRow label="Battery" value={formatBattery(bt)} />
          <InfoRow label="Viewport" value={formatViewport(vp)} />
          <InfoRow label="Outer viewport" value={formatOuterViewport(vp)} />
          <InfoRow label="Orientation" value={formatOrientation(or)} />
        </Section>
      )}
    </>
  );
};

// ══════════════════════════════════════════════════
// EDIT MODAL
// ══════════════════════════════════════════════════
interface EditModalProps {
  student: Student;
  onSave: (data: Partial<Student>) => Promise<void>;
  onClose: () => void;
}

const EditModal = ({ student, onSave, onClose }: EditModalProps) => {
  const [formData, setFormData] = useState({
    name: student.name || "",
    fatherName: student.fatherName || "",
    motherName: student.motherName || "",
    phone: student.phone || "",
    gender: student.gender || "",
    religion: student.religion || "",
    dateOfBirth: student.dateOfBirth?.split("T")[0] || "",
    emergencyContact: student.emergencyContact || "",
    studentClass: student.studentClass || "",
    studentSubject: student.studentSubject || "",
    roll: student.roll || "",
    schoolName: student.schoolName || "",
    gramNam: student.gramNam || "",
    para: student.para || "",
    thana: student.thana || "",
    district: student.district || "",
    division: student.division || "",
    landmark: student.landmark || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const accent = getAccent(student.gender);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = `
    w-full px-3 py-2.5 rounded-xl text-sm bangla
    bg-[var(--color-active-bg)] 
    border border-[var(--color-active-border)]
    text-[var(--color-text)]
    placeholder:text-[var(--color-gray)]
    focus:outline-none focus:border-blue-500/50
    transition-all duration-200
  `;

  const labelClass =
    "text-xs font-semibold bangla text-[var(--color-gray)] mb-1.5 block";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center px-2 bg-black/60 backdrop-blur-xl overflow-y-auto py-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-auto"
        style={{
          backgroundColor: "var(--color-bg)",
          border: "1px solid var(--color-active-border)",
        }}
      >
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)`,
          }}
        />

        <div className="p-4 border-b border-[var(--color-active-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: accent + "18" }}
            >
              <Edit3 className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <h2 className="text-lg font-bold bangla text-[var(--color-text)]">
                তথ্য সম্পাদনা
              </h2>
              <p className="text-xs bangla text-[var(--color-gray)]">
                {student.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-active-bg)] hover:bg-red-500/20 transition-colors"
          >
            <X className="w-4 h-4 text-[var(--color-gray)]" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-5 max-h-[70vh] overflow-y-auto"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-active-border)]">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold bangla text-[var(--color-text)]">
                ব্যক্তিগত তথ্য
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>নাম *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="পূর্ণ নাম"
                />
              </div>
              <div>
                <label className={labelClass}>ফোন</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="০১XXXXXXXXX"
                />
              </div>
              <div>
                <label className={labelClass}>পিতার নাম</label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="পিতার নাম"
                />
              </div>
              <div>
                <label className={labelClass}>মাতার নাম</label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="মাতার নাম"
                />
              </div>
              <div>
                <label className={labelClass}>লিঙ্গ</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="ছেলে">ছেলে</option>
                  <option value="মেয়ে">মেয়ে</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ধর্ম</label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="ইসলাম">ইসলাম</option>
                  <option value="হিন্দু">হিন্দু</option>
                  <option value="খ্রিস্টান">খ্রিস্টান</option>
                  <option value="বৌদ্ধ">বৌদ্ধ</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>জন্ম তারিখ</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>জরুরি যোগাযোগ</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="জরুরি ফোন নম্বর"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-active-border)]">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-bold bangla text-[var(--color-text)]">
                শিক্ষা সম্পর্কিত
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>শ্রেণি</label>
                <input
                  type="text"
                  name="studentClass"
                  value={formData.studentClass}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="যেমন: দশম"
                />
              </div>
              <div>
                <label className={labelClass}>বিভাগ</label>
                <select
                  name="studentSubject"
                  value={formData.studentSubject}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="বিজ্ঞান">বিজ্ঞান</option>
                  <option value="মানবিক">মানবিক</option>
                  <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা</option>
                  <option value="সাধারণ">সাধারণ</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>রোল</label>
                <input
                  type="text"
                  name="roll"
                  value={formData.roll}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="রোল নম্বর"
                />
              </div>
              <div>
                <label className={labelClass}>বিদ্যালয়</label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="বিদ্যালয়ের নাম"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-active-border)]">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold bangla text-[var(--color-text)]">
                ঠিকানা
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>গ্রাম</label>
                <input
                  type="text"
                  name="gramNam"
                  value={formData.gramNam}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="গ্রামের নাম"
                />
              </div>
              <div>
                <label className={labelClass}>পাড়া/মহল্লা</label>
                <input
                  type="text"
                  name="para"
                  value={formData.para}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="পাড়া/মহল্লা"
                />
              </div>
              <div>
                <label className={labelClass}>থানা</label>
                <input
                  type="text"
                  name="thana"
                  value={formData.thana}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="থানা/উপজেলা"
                />
              </div>
              <div>
                <label className={labelClass}>জেলা</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="জেলা"
                />
              </div>
              <div>
                <label className={labelClass}>বিভাগ</label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="ঢাকা">ঢাকা</option>
                  <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                  <option value="রাজশাহী">রাজশাহী</option>
                  <option value="খুলনা">খুলনা</option>
                  <option value="বরিশাল">বরিশাল</option>
                  <option value="সিলেট">সিলেট</option>
                  <option value="রংপুর">রংপুর</option>
                  <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>চিহ্ন</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="নিকটবর্তী চিহ্ন"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--color-active-border)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bangla transition-all bg-[var(--color-active-bg)] border border-[var(--color-active-border)] text-[var(--color-gray)] hover:bg-[var(--color-active-border)]"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bangla transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                backgroundColor: isSaving ? accent + "88" : accent,
                color: "#fff",
              }}
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body,
  );
};

// ── StudentModal ──────────────────────────────────────────────────────────────
export const StudentModal = ({
  student,
  sessionInfo,
  onClose,
}: {
  student: Student;
  sessionInfo?: SessionSummary | null;
  onClose: () => void;
}) => {
  const accent = getAccent(student.gender);

  const pAddr = student.permanentSameAsPresent
    ? {
        gram: student.gramNam,
        para: student.para,
        thana: student.thana,
        district: student.district,
        division: student.division,
      }
    : {
        gram: student.permanentGramNam,
        para: student.permanentPara,
        thana: student.permanentThana,
        district: student.permanentDistrict,
        division: student.permanentDivision,
      };

  const hasPresent = student.gramNam || student.thana || student.district;
  const hasPermanent = pAddr.gram || pAddr.thana || pAddr.district;

  return (
    <PersonModal
      onClose={onClose}
      accentColor={accent}
      header={
        <div className="flex flex-col justify-center items-center bangla">
          <Avatar
            name={student.name}
            url={student.avatar?.url}
            color={accent}
            size={250}
          />
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold bangla leading-snug text-[var(--color-text)] mt-5">
              {student.name}
            </p>
            {student.fatherName && (
              <p className="text-sm bangla mt-0.5 text-[var(--color-gray)]">
                পিতা: {student.fatherName}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {student.slug && (
                <span className="text-sm md:text-md font-mono px-1.5 py-0.5 rounded bg-[var(--color-active-bg)] text-[var(--color-gray)]">
                  #{student.slug}
                </span>
              )}
              {student.gender && (
                <span
                  className="text-sm md:text-md px-1.5 py-0.5 rounded font-bold bangla"
                  style={{ backgroundColor: accent + "18", color: accent }}
                >
                  {student.gender}
                </span>
              )}
              {student.religion && (
                <span className="text-sm md:text-md px-1.5 py-0.5 rounded font-bold bangla bg-[var(--color-active-bg)] text-[var(--color-gray)]">
                  {student.religion}
                </span>
              )}
              {sessionInfo && (
                <span
                  className="text-sm md:text-md px-1.5 py-0.5 rounded font-bold bangla"
                  style={{
                    backgroundColor: sessionInfo.isOnline
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(148,163,184,0.12)",
                    color: sessionInfo.isOnline ? "#22c55e" : "#94a3b8",
                  }}
                >
                  {sessionInfo.isOnline ? "অনলাইন" : "অফলাইন"}
                </span>
              )}
            </div>
          </div>
        </div>
      }
    >
      <Section
        title="মূল তথ্য"
        color="var(--color-active-bg)"
        borderColor="var(--color-active-border)"
      >
        <InfoRow label="ফোন" value={student.phone} />
        <InfoRow label="শ্রেণি" value={student.studentClass} />
        <InfoRow label="বিভাগ" value={student.studentSubject} />
        <InfoRow label="রোল" value={student.roll} />
        <InfoRow label="বিদ্যা." value={student.schoolName} />
        <InfoRow
          label="জন্ম"
          value={student.dateOfBirth ? formatDOB(student.dateOfBirth) : null}
        />
        <InfoRow label="মা" value={student.motherName} />
        <InfoRow label="জরুরি" value={student.emergencyContact} />
      </Section>

      {hasPresent && (
        <Section
          title="বর্তমান ঠিকানা"
          color="rgba(239,68,68,0.06)"
          borderColor="rgba(239,68,68,0.2)"
          titleColor="#ef4444"
          icon={<MapPin className="w-3 h-3" />}
        >
          <InfoRow label="গ্রাম" value={student.gramNam} />
          <InfoRow label="পাড়া" value={student.para} />
          <InfoRow label="থানা" value={student.thana} />
          <InfoRow label="জেলা" value={student.district} />
          <InfoRow label="বিভাগ" value={student.division} />
          <InfoRow label="চিহ্ন" value={student.landmark} />
        </Section>
      )}

      {hasPermanent && (
        <Section
          title="স্থায়ী ঠিকানা"
          color="rgba(245,158,11,0.06)"
          borderColor="rgba(245,158,11,0.2)"
          titleColor="#f59e0b"
          icon={<MapPin className="w-3 h-3" />}
        >
          {student.permanentSameAsPresent && (
            <p
              className="text-[10px] bangla mb-1 px-1 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(245,158,11,0.12)",
                color: "#f59e0b",
              }}
            >
              ★ বর্তমান ঠিকানার মতো
            </p>
          )}
          <InfoRow label="গ্রাম" value={pAddr.gram} />
          <InfoRow label="পাড়া" value={pAddr.para} />
          <InfoRow label="থানা" value={pAddr.thana} />
          <InfoRow label="জেলা" value={pAddr.district} />
          <InfoRow label="বিভাগ" value={pAddr.division} />
        </Section>
      )}

      <SessionInfoSections sessionInfo={sessionInfo} accent={accent} />
    </PersonModal>
  );
};

// ── StudentCard ───────────────────────────────────────────────────────────────
export const StudentCard = ({
  student,
  sessionInfo,
  index,
  onDelete,
  onEdit,
}: {
  student: Student;
  sessionInfo?: SessionSummary | null;
  index: number;
  onDelete?: (id: string, name: string) => Promise<boolean>;
  onEdit?: (id: string, data: Partial<Student>) => Promise<void>;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const accent = getAccent(student.gender);

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete(student._id, student.name);
  };

  const handleEdit = async (data: Partial<Student>) => {
    if (!onEdit) return;
    await onEdit(student._id, data);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.04,
          type: "spring",
          stiffness: 260,
          damping: 22,
        }}
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--color-bg)",
          border: "1px solid var(--color-active-border)",
        }}
      >
        <div
          className="h-1.5"
          style={{ background: `linear-gradient(90deg,${accent},${accent}40)` }}
        />

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start gap-3 mb-4">
            <Avatar
              name={student.name}
              url={student.avatar?.url}
              color={accent}
              size={52}
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold bangla leading-snug text-[var(--color-text)]">
                {student.name}
              </p>
              {student.fatherName && (
                <p className="text-xs bangla mt-0.5 text-[var(--color-gray)]">
                  পিতা: {student.fatherName}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {student.slug && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--color-active-bg)",
                      color: "var(--color-gray)",
                    }}
                  >
                    #{student.slug}
                  </span>
                )}
                {student.gender && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold bangla"
                    style={{ backgroundColor: accent + "18", color: accent }}
                  >
                    {student.gender}
                  </span>
                )}
                {sessionInfo && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold bangla"
                    style={{
                      backgroundColor: sessionInfo.isOnline
                        ? "rgba(34,197,94,0.12)"
                        : "rgba(148,163,184,0.12)",
                      color: sessionInfo.isOnline ? "#22c55e" : "#94a3b8",
                    }}
                  >
                    {sessionInfo.isOnline ? "অনলাইন" : "অফলাইন"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className="space-y-2.5 pt-3 flex-1"
            style={{ borderTop: "1px solid var(--color-active-border)" }}
          >
            {student.phone && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(16,185,129,0.1)]">
                  <Phone className="w-3 h-3" style={{ color: "#10b981" }} />
                </div>
                <span className="text-sm font-mono text-[var(--color-text)]">
                  {student.phone}
                </span>
              </div>
            )}

            {student.studentClass && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(139,92,246,0.1)]">
                  <BookOpen className="w-3 h-3" style={{ color: "#8b5cf6" }} />
                </div>
                <span className="text-sm bangla text-[var(--color-text)]">
                  {student.studentClass}
                </span>
              </div>
            )}

            {(student.thana || student.gramNam) && (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[rgba(239,68,68,0.08)]">
                  <MapPin className="w-3 h-3" style={{ color: "#ef4444" }} />
                </div>
                <div className="space-y-0.5">
                  {student.gramNam && (
                    <p className="text-xs bangla text-[var(--color-gray)]">
                      {student.gramNam}
                    </p>
                  )}
                  {student.thana && (
                    <p className="text-xs bangla text-[var(--color-gray)]">
                      {student.thana}
                    </p>
                  )}
                </div>
              </div>
            )}

            {sessionInfo?.lastBrowser?.name && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.1)]">
                  <Monitor className="w-3 h-3" style={{ color: "#3b82f6" }} />
                </div>
                <span className="text-xs text-[var(--color-gray)] truncate">
                  {formatBrowser(sessionInfo.lastBrowser)}
                </span>
              </div>
            )}

            {sessionInfo?.lastActiveAt && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(245,158,11,0.12)]">
                  <Clock className="w-3 h-3" style={{ color: "#f59e0b" }} />
                </div>
                <span className="text-xs bangla text-[var(--color-gray)] truncate">
                  সর্বশেষ: {formatDateTime(sessionInfo.lastActiveAt)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bangla cursor-pointer transition-all bg-transparent text-[var(--color-gray)] border border-[var(--color-active-border)]"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent + "88";
                e.currentTarget.style.color = accent;
                e.currentTarget.style.backgroundColor = accent + "0a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--color-active-border)";
                e.currentTarget.style.color = "var(--color-gray)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              বিস্তারিত
            </button>

            {onEdit && (
              <motion.button
                type="button"
                onClick={() => setEditOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all shrink-0"
                style={{
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: "rgba(59,130,246,0.7)",
                  backgroundColor: "rgba(59,130,246,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
                  e.currentTarget.style.color = "rgb(59,130,246)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(59,130,246,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)";
                  e.currentTarget.style.color = "rgba(59,130,246,0.7)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(59,130,246,0.05)";
                }}
                title="সম্পাদনা"
              >
                <Edit3 className="w-4 h-4" />
              </motion.button>
            )}

            {onDelete && (
              <motion.button
                type="button"
                onClick={handleDelete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all shrink-0"
                style={{
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "rgba(239,68,68,0.6)",
                  backgroundColor: "rgba(239,68,68,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.6)";
                  e.currentTarget.style.color = "rgb(239,68,68)";
                  e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
                  e.currentTarget.style.color = "rgba(239,68,68,0.6)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(239,68,68,0.05)";
                }}
                title="মুছুন"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {modalOpen && (
        <StudentModal
          student={student}
          sessionInfo={sessionInfo}
          onClose={() => setModalOpen(false)}
        />
      )}

      {editOpen && onEdit && (
        <EditModal
          student={student}
          onSave={handleEdit}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
};
