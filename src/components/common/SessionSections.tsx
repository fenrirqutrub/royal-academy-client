// src/components/common/SessionSections.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Wifi,
  Cpu,
  Clock,
  MapPin,
  History,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosPublic from "../../hooks/axiosPublic";
import { InfoRow, Section } from "./PersonModal";

// ── SessionSummary type ───────────────────────────────────────────────────────
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
  lastOS?: { name?: string | null; version?: string | null };
  lastBrowser?: { name?: string | null; version?: string | null };
  lastIP?: string | null;
  lastLocation?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    countryCode?: string | null;
    lat?: number | null;
    lon?: number | null;
    timezone?: string | null;
    isp?: string | null;
    org?: string | null;
    as?: string | null;
  };
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
    maxTextureSize?: number | null;
    antialiasSupport?: boolean | null;
    audioSampleRate?: number | null;
    performanceMemory?: number | null;
    canvasFingerprint?: string | null;
  };
  lastNetwork?: {
    type?: string | null;
    effectiveType?: string | null;
    downlink?: number | null;
    rtt?: number | null;
    saveData?: boolean | null;
  };
  lastBattery?: { level?: number | null; charging?: boolean | null };
  lastViewport?: {
    width?: number | null;
    height?: number | null;
    outerWidth?: number | null;
    outerHeight?: number | null;
  };
  lastOrientation?: { angle?: number | null; type?: string | null };
  isOnline?: boolean;
}

// ── History item type ─────────────────────────────────────────────────────────
interface HistorySession {
  _id: string;
  loginAt: string;
  logoutAt?: string | null;
  durationMinutes: number;
  activeMinutes: number;
  isOnline: boolean;
  ip?: string | null;
  location?: SessionSummary["lastLocation"];
  browser?: SessionSummary["lastBrowser"];
  os?: SessionSummary["lastOS"];
  device?: SessionSummary["lastDevice"];
  hardware?: SessionSummary["lastHardware"];
  network?: SessionSummary["lastNetwork"];
  battery?: SessionSummary["lastBattery"];
  viewport?: SessionSummary["lastViewport"];
  orientation?: SessionSummary["lastOrientation"];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const formatScreen = (w?: number | null, h?: number | null) =>
  w || h ? `${w ?? "—"} × ${h ?? "—"}` : null;

const formatViewport = (v?: SessionSummary["lastViewport"]) =>
  v?.width || v?.height ? `${v.width ?? "—"} × ${v.height ?? "—"}` : null;

const formatOuterViewport = (v?: SessionSummary["lastViewport"]) =>
  v?.outerWidth || v?.outerHeight
    ? `${v.outerWidth ?? "—"} × ${v.outerHeight ?? "—"}`
    : null;

const formatBattery = (b?: SessionSummary["lastBattery"]) => {
  if (!b) return null;
  if (b.level == null && b.charging == null) return null;
  return `${b.level ?? "—"}%${b.charging === true ? " ⚡ চার্জ হচ্ছে" : b.charging === false ? "" : ""}`;
};

const formatOrientation = (o?: SessionSummary["lastOrientation"]) => {
  if (!o) return null;
  return joinValues([o.type ?? null, o.angle != null ? `${o.angle}°` : null]);
};

const formatLocation = (loc?: SessionSummary["lastLocation"]) => {
  if (!loc) return null;
  return joinValues([loc.city, loc.region, loc.country]);
};

// ── Render all collected info for a single session ────────────────────────────
const RenderSessionDetails = ({
  browser,
  os,
  device,
  ip,
  location,
  hardware: hw,
  network: nw,
  battery: bt,
  viewport: vp,
  orientation: or,
}: {
  browser?: SessionSummary["lastBrowser"];
  os?: SessionSummary["lastOS"];
  device?: SessionSummary["lastDevice"];
  ip?: string | null;
  location?: SessionSummary["lastLocation"];
  hardware?: SessionSummary["lastHardware"];
  network?: SessionSummary["lastNetwork"];
  battery?: SessionSummary["lastBattery"];
  viewport?: SessionSummary["lastViewport"];
  orientation?: SessionSummary["lastOrientation"];
}) => {
  const hasLocation =
    location?.city || location?.country || location?.isp || location?.lat;

  const hasDevice =
    formatBrowser(browser) || formatOS(os) || formatDevice(device) || ip;

  const hasHardware =
    hw?.screenResolution ||
    hw?.ram != null ||
    hw?.cpuCores != null ||
    hw?.webglVendor ||
    hw?.webglRenderer ||
    hw?.language ||
    hw?.timezone ||
    hw?.platform ||
    hw?.colorGamut ||
    hw?.pointerType ||
    joinValues(hw?.fonts) ||
    joinValues(hw?.plugins) ||
    hw?.maxTextureSize != null ||
    hw?.audioSampleRate != null ||
    hw?.performanceMemory != null ||
    hw?.canvasFingerprint;

  const hasNetwork =
    nw?.type ||
    nw?.effectiveType ||
    nw?.downlink != null ||
    nw?.rtt != null ||
    formatBattery(bt) ||
    formatViewport(vp) ||
    formatOrientation(or);

  return (
    <>
      {hasLocation && (
        <Section
          title="অবস্থান (IP-based)"
          color="rgba(16,185,129,0.06)"
          borderColor="rgba(16,185,129,0.2)"
          titleColor="#10b981"
          icon={<MapPin className="w-3 h-3" />}
        >
          <InfoRow label="শহর" value={location?.city} />
          <InfoRow label="অঞ্চল" value={location?.region} />
          <InfoRow
            label="দেশ"
            value={joinValues([location?.country, location?.countryCode])}
          />
          <InfoRow
            label="Lat"
            value={location?.lat != null ? String(location.lat) : null}
          />
          <InfoRow
            label="Lon"
            value={location?.lon != null ? String(location.lon) : null}
          />
          <InfoRow label="Timezone" value={location?.timezone} />
          <InfoRow label="ISP" value={location?.isp} />
          <InfoRow label="Org" value={location?.org} />
          <InfoRow label="AS" value={location?.as} />
        </Section>
      )}

      {hasDevice && (
        <Section
          title="ডিভাইস ও ব্রাউজার"
          color="rgba(59,130,246,0.06)"
          borderColor="rgba(59,130,246,0.2)"
          titleColor="#3b82f6"
          icon={<Monitor className="w-3 h-3" />}
        >
          <InfoRow label="ব্রাউজার" value={formatBrowser(browser)} />
          <InfoRow label="OS" value={formatOS(os)} />
          <InfoRow label="ডিভাইস" value={formatDevice(device)} />
          <InfoRow label="IP" value={ip} />
        </Section>
      )}

      {hasHardware && (
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
          <InfoRow
            label="Max texture"
            value={
              hw?.maxTextureSize != null ? String(hw.maxTextureSize) : null
            }
          />
          <InfoRow label="Antialias" value={boolText(hw?.antialiasSupport)} />
          <InfoRow
            label="Audio rate"
            value={
              hw?.audioSampleRate != null ? `${hw.audioSampleRate} Hz` : null
            }
          />
          <InfoRow
            label="JS heap"
            value={
              hw?.performanceMemory != null
                ? `${hw.performanceMemory} MB`
                : null
            }
          />
          <InfoRow label="Canvas FP" value={hw?.canvasFingerprint} />
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

      {hasNetwork && (
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

// ── History Tab ───────────────────────────────────────────────────────────────
const HistoryTab = ({ userId }: { userId: string }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["session-history", userId],
    queryFn: async () => {
      const { data } = await axiosPublic.get(
        `/api/sessions/history/${userId}?limit=50`,
      );
      return (data.sessions ?? []) as HistorySession[];
    },
    staleTime: 30_000,
  });

  const sessions = data ?? [];

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs bangla text-[var(--color-gray)] mt-2">
          ইতিহাস লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-xs bangla text-[var(--color-gray)] py-6 text-center">
        কোনো সেশন ইতিহাস পাওয়া যায়নি।
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s, i) => {
        const isExp = expanded === s._id;
        const isCurrent = i === 0 && s.isOnline;

        return (
          <div
            key={s._id}
            className="rounded-xl overflow-hidden"
            style={{
              border: `1px solid ${isCurrent ? "rgba(34,197,94,0.3)" : "var(--color-active-border)"}`,
              backgroundColor: isCurrent
                ? "rgba(34,197,94,0.04)"
                : "var(--color-active-bg)",
            }}
          >
            {/* Header */}
            <button
              onClick={() => setExpanded(isExp ? null : s._id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: s.isOnline ? "#22c55e" : "#94a3b8",
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-text)] truncate">
                    {formatDateTime(s.loginAt) ?? "—"}
                  </p>
                  <p className="text-[10px] text-[var(--color-gray)] truncate">
                    {formatBrowser(s.browser)} · {formatOS(s.os)}
                    {s.location?.city ? ` · ${s.location.city}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] bangla text-[var(--color-gray)]">
                  {s.durationMinutes} মি.
                </span>
                <motion.span
                  animate={{ rotate: isExp ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--color-gray)]" />
                </motion.span>
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {isExp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-3 pb-3 space-y-2"
                    style={{
                      borderTop: "1px solid var(--color-active-border)",
                    }}
                  >
                    <div className="pt-2">
                      <Section
                        title="সেশন সময়"
                        color="rgba(34,197,94,0.06)"
                        borderColor="rgba(34,197,94,0.2)"
                        titleColor="#22c55e"
                        icon={<Clock className="w-3 h-3" />}
                      >
                        <InfoRow
                          label="অবস্থা"
                          value={s.isOnline ? "অনলাইন" : "অফলাইন"}
                        />
                        <InfoRow
                          label="লগইন"
                          value={formatDateTime(s.loginAt)}
                        />
                        <InfoRow
                          label="লগআউট"
                          value={formatDateTime(s.logoutAt)}
                        />
                        <InfoRow
                          label="মোট সময়"
                          value={`${s.durationMinutes} মিনিট`}
                        />
                        <InfoRow
                          label="সক্রিয় সময়"
                          value={`${s.activeMinutes} মিনিট`}
                        />
                      </Section>

                      <RenderSessionDetails
                        browser={s.browser}
                        os={s.os}
                        device={s.device}
                        ip={s.ip}
                        location={s.location}
                        hardware={s.hardware}
                        network={s.network}
                        battery={s.battery}
                        viewport={s.viewport}
                        orientation={s.orientation}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MAIN EXPORT: SessionInfoSections
// ══════════════════════════════════════════════════
export const SessionInfoSections = ({
  userId,
  sessionInfo,
  accent,
}: {
  userId: string;
  sessionInfo?: SessionSummary | null;
  accent: string;
}) => {
  const [tab, setTab] = useState<"current" | "history">("current");

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

  return (
    <div className="mt-2">
      {/* Tab buttons */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--color-active-border)] mb-3">
        <button
          onClick={() => setTab("current")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bangla transition-all ${
            tab === "current"
              ? "text-white"
              : "bg-[var(--color-active-bg)] text-[var(--color-gray)]"
          }`}
          style={tab === "current" ? { backgroundColor: accent } : undefined}
        >
          <Globe className="w-3 h-3" />
          বর্তমান
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bangla transition-all ${
            tab === "history"
              ? "text-white"
              : "bg-[var(--color-active-bg)] text-[var(--color-gray)]"
          }`}
          style={tab === "history" ? { backgroundColor: accent } : undefined}
        >
          <History className="w-3 h-3" />
          ইতিহাস ({sessionInfo.totalLogins ?? 0})
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "current" ? (
          <motion.div
            key="current"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
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

            <RenderSessionDetails
              browser={sessionInfo.lastBrowser}
              os={sessionInfo.lastOS}
              device={sessionInfo.lastDevice}
              ip={sessionInfo.lastIP}
              location={sessionInfo.lastLocation}
              hardware={sessionInfo.lastHardware}
              network={sessionInfo.lastNetwork}
              battery={sessionInfo.lastBattery}
              viewport={sessionInfo.lastViewport}
              orientation={sessionInfo.lastOrientation}
            />
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <HistoryTab userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Export helpers for card usage ──────────────────────────────────────────────
export { formatBrowser, formatDateTime, formatLocation };
