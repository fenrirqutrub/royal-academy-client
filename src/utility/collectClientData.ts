// src/utility/collectClientData.ts
import { UAParser } from "ua-parser-js";

// ── Interface এ যোগ করো ──
export interface ClientDevice {
  vendor: string | null;
  model: string | null;
  type: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  ua: string | null;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ClientHardware {
  screenWidth: number | null;
  screenHeight: number | null;
  colorDepth: number | null;
  pixelRatio: number | null;
  ram: number | null;
  cpuCores: number | null;
  isTouchScreen: boolean;
  maxTouchPoints: number;
  language: string | null;
  languages: string[];
  timezone: string | null;
  timezoneOffset: number | null;
  platform: string | null;
  cookiesEnabled: boolean | null;
  doNotTrack: string | null;
  pdfViewerEnabled: boolean | null;
  webglVendor: string | null;
  webglRenderer: string | null;
  screenResolution: string | null;
  availableResolution: string | null;
  colorGamut: string | null;
  hdr: boolean | null;
  prefersDark: boolean | null;
  prefersReducedMotion: boolean | null;
  touchSupport: boolean | null;
  pointerType: string | null;
  fonts: string[];
  plugins: string[];
  maxTextureSize: number | null;
  antialiasSupport: boolean | null;
  audioSampleRate: number | null;
  performanceMemory: number | null;
  canvasFingerprint: string | null;
}

export interface ClientNetwork {
  type: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean | null;
}

export interface ClientBattery {
  level: number | null;
  charging: boolean | null;
}

export interface ClientViewport {
  width: number | null;
  height: number | null;
  outerWidth: number | null;
  outerHeight: number | null;
}

export interface ClientOrientation {
  angle: number | null;
  type: string | null;
}

export interface ClientData {
  hardware: ClientHardware;
  network: ClientNetwork;
  battery: ClientBattery;
  viewport: ClientViewport;
  orientation: ClientOrientation;
  device: ClientDevice;
}

// ── Internal types (browser APIs) ─────────────────────────────────────────────

interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface BatteryManager {
  level: number;
  charging: boolean;
}

type NavigatorExtended = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
  getBattery?: () => Promise<BatteryManager>;
};

interface PerformanceMemory {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
}

interface PerformanceExtended extends Performance {
  memory?: PerformanceMemory;
}

// ── WebGL helpers ─────────────────────────────────────────────────────────────

interface WebGLInfo {
  vendor: string | null;
  renderer: string | null;
  maxTextureSize: number | null;
  antialiasSupport: boolean | null;
}

const getWebGLInfo = (): WebGLInfo => {
  const empty: WebGLInfo = {
    vendor: null,
    renderer: null,
    maxTextureSize: null,
    antialiasSupport: null,
  };

  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) return empty;

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const attrs = gl.getContextAttributes();

    return {
      vendor: ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : null,
      renderer: ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : null,
      maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || null,
      antialiasSupport: attrs?.antialias ?? null,
    };
  } catch {
    return empty;
  }
};

// ── Font detection ────────────────────────────────────────────────────────────

const detectFonts = (): string[] => {
  const testFonts = [
    "Arial",
    "Verdana",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Comic Sans MS",
    "Impact",
    "Tahoma",
    "Trebuchet MS",
    "Lucida Console",
  ];
  const available: string[] = [];

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const baseline = "monospace";
    const testStr = "mmmmmmmmmmlli";
    const size = 72;

    ctx.font = `${size}px ${baseline}`;
    const baselineWidth = ctx.measureText(testStr).width;

    for (const font of testFonts) {
      ctx.font = `${size}px '${font}', ${baseline}`;
      const w = ctx.measureText(testStr).width;
      if (w !== baselineWidth) available.push(font);
    }
  } catch {
    // silent
  }

  return available;
};

// ── Plugin detection ──────────────────────────────────────────────────────────

const detectPlugins = (): string[] => {
  try {
    const pluginList: string[] = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const name = navigator.plugins[i]?.name;
      if (name) pluginList.push(name);
    }
    return pluginList;
  } catch {
    return [];
  }
};

// ── Media query helper ────────────────────────────────────────────────────────

const mqMatch = (q: string): boolean => {
  try {
    return window.matchMedia(q).matches;
  } catch {
    return false;
  }
};

// ── Audio sample rate ─────────────────────────────────────────────────────────

const getAudioSampleRate = (): number | null => {
  try {
    if (typeof AudioContext === "undefined") return null;
    const ctx = new AudioContext();
    const rate = ctx.sampleRate;
    ctx.close().catch(() => {});
    return rate ?? null;
  } catch {
    return null;
  }
};

// ── Performance memory (Chrome only) ──────────────────────────────────────────

const getPerformanceMemory = (): number | null => {
  try {
    const perf = performance as PerformanceExtended;
    if (!perf.memory?.jsHeapSizeLimit) return null;
    return Math.round(perf.memory.jsHeapSizeLimit / 1048576);
  } catch {
    return null;
  }
};

// ── Canvas fingerprint (short hash) ───────────────────────────────────────────

const getCanvasFingerprint = (): string | null => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "#069";
    ctx.fillText("Browser fp test", 2, 2);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("Canvas test", 4, 18);

    const dataURL = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataURL.length; i++) {
      const char = dataURL.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  } catch {
    return null;
  }
};

// ── Hardware collect ──────────────────────────────────────────────────────────

const collectHardware = (): ClientHardware => {
  const nav = navigator as NavigatorExtended;
  const webgl = getWebGLInfo();

  return {
    screenWidth: window.screen?.width ?? null,
    screenHeight: window.screen?.height ?? null,
    colorDepth: window.screen?.colorDepth ?? null,
    pixelRatio: window.devicePixelRatio ?? null,
    ram: nav.deviceMemory ?? null,
    cpuCores: nav.hardwareConcurrency ?? null,
    isTouchScreen: navigator.maxTouchPoints > 0,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    language: navigator.language ?? null,
    languages: Array.from(navigator.languages ?? []),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    timezoneOffset: new Date().getTimezoneOffset(),
    platform: nav.platform ?? null,
    cookiesEnabled: navigator.cookieEnabled ?? null,
    doNotTrack: navigator.doNotTrack ?? null,
    pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    screenResolution: window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : null,
    availableResolution: window.screen
      ? `${window.screen.availWidth}x${window.screen.availHeight}`
      : null,
    colorGamut: mqMatch("(color-gamut: p3)")
      ? "p3"
      : mqMatch("(color-gamut: srgb)")
        ? "srgb"
        : null,
    hdr: mqMatch("(dynamic-range: high)"),
    prefersDark: mqMatch("(prefers-color-scheme: dark)"),
    prefersReducedMotion: mqMatch("(prefers-reduced-motion: reduce)"),
    touchSupport: "ontouchstart" in window,
    pointerType: mqMatch("(pointer: fine)")
      ? "fine"
      : mqMatch("(pointer: coarse)")
        ? "coarse"
        : null,
    fonts: detectFonts(),
    plugins: detectPlugins(),
    maxTextureSize: webgl.maxTextureSize,
    antialiasSupport: webgl.antialiasSupport,
    audioSampleRate: getAudioSampleRate(),
    performanceMemory: getPerformanceMemory(),
    canvasFingerprint: getCanvasFingerprint(),
  };
};

// ── Network collect ───────────────────────────────────────────────────────────

const collectNetwork = (): ClientNetwork => {
  const nav = navigator as NavigatorExtended;
  const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;

  if (!conn) {
    return {
      type: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
      saveData: null,
    };
  }

  return {
    type: conn.type ?? null,
    effectiveType: conn.effectiveType ?? null,
    downlink: conn.downlink ?? null,
    rtt: conn.rtt ?? null,
    saveData: conn.saveData ?? null,
  };
};

// ── Battery collect ───────────────────────────────────────────────────────────

const collectBattery = async (): Promise<ClientBattery> => {
  try {
    const nav = navigator as NavigatorExtended;
    if (!nav.getBattery) return { level: null, charging: null };
    const battery = await nav.getBattery();
    return {
      level: Math.round(battery.level * 100),
      charging: battery.charging,
    };
  } catch {
    return { level: null, charging: null };
  }
};

// ── Viewport collect ──────────────────────────────────────────────────────────

const collectViewport = (): ClientViewport => ({
  width: window.innerWidth ?? null,
  height: window.innerHeight ?? null,
  outerWidth: window.outerWidth ?? null,
  outerHeight: window.outerHeight ?? null,
});

// ── Orientation collect ───────────────────────────────────────────────────────

const collectOrientation = (): ClientOrientation => {
  try {
    const o = screen.orientation;
    return {
      angle: o?.angle ?? null,
      type: o?.type ?? null,
    };
  } catch {
    return { angle: null, type: null };
  }
};

// collectClientData.ts এ যোগ করো

// ── Device collect ────────────────────────────────────────────────────────────
const collectDevice = (): ClientDevice => {
  try {
    const parser = new UAParser(navigator.userAgent);
    const r = parser.getResult();
    return {
      vendor: r.device.vendor ?? null,
      model: r.device.model ?? null,
      type: r.device.type ?? "desktop",
      browserName: r.browser.name ?? null,
      browserVersion: r.browser.version ?? null,
      osName: r.os.name ?? null,
      osVersion: r.os.version ?? null,
      ua: navigator.userAgent ?? null,
    };
  } catch {
    return {
      vendor: null,
      model: null,
      type: null,
      browserName: null,
      browserVersion: null,
      osName: null,
      osVersion: null,
      ua: navigator.userAgent ?? null,
    };
  }
};

// ── Main export update ────────────────────────────────────────────────────────
export const collectClientData = async (): Promise<ClientData> => {
  const [hardware, network, battery, viewport, orientation] = await Promise.all(
    [
      collectHardware(),
      collectNetwork(),
      collectBattery(),
      collectViewport(),
      collectOrientation(),
    ],
  );

  const device = collectDevice();

  return { hardware, network, battery, viewport, orientation, device };
};

// ── Main export ───────────────────────────────────────────────────────────────
