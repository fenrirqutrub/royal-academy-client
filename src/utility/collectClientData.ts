// src/utility/collectClientData.ts
// Browser থেকে যা যা পাওয়া সম্ভব সব collect করে — সবই optional, error হলে silent fail

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
  // ✅ New fields
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
}

// ── WebGL helpers ─────────────────────────────────────────────────────────────
const getWebGLInfo = (): { vendor: string | null; renderer: string | null } => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return { vendor: null, renderer: null };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return { vendor: null, renderer: null };
    return {
      vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? null,
      renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? null,
    };
  } catch {
    return { vendor: null, renderer: null };
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

    testFonts.forEach((font) => {
      ctx.font = `${size}px '${font}', ${baseline}`;
      const w = ctx.measureText(testStr).width;
      if (w !== baselineWidth) available.push(font);
    });
  } catch (err) {
    console.error(err);
  }
  return available;
};

// ── Plugin detection ──────────────────────────────────────────────────────────
const detectPlugins = (): string[] => {
  try {
    return Array.from(navigator.plugins || [])
      .map((p) => p.name)
      .filter(Boolean);
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

// ── Hardware collect ──────────────────────────────────────────────────────────
const collectHardware = (): ClientHardware => {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    platform?: string;
    pdfViewerEnabled?: boolean;
  };

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
    timezoneOffset: new Date().getTimezoneOffset() ?? null,
    platform: nav.platform ?? null,
    cookiesEnabled: navigator.cookieEnabled ?? null,
    doNotTrack: navigator.doNotTrack ?? null,
    pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
    // ✅ New
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
  };
};

// ── Network collect ───────────────────────────────────────────────────────────
const collectNetwork = (): ClientNetwork => {
  const conn =
    (navigator as any).connection ??
    (navigator as any).mozConnection ??
    (navigator as any).webkitConnection;

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
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
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
    const o = screen.orientation as ScreenOrientation | undefined;
    return {
      angle: o?.angle ?? null,
      type: o?.type ?? null,
    };
  } catch {
    return { angle: null, type: null };
  }
};

// ── Main export ───────────────────────────────────────────────────────────────
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

  return { hardware, network, battery, viewport, orientation };
};
