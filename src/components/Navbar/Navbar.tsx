// Navbar.tsx
import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import axiosPublic from "../../hooks/axiosPublic";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar, { type BadgeCounts } from "./MobileNavbar";
import ProfileButton from "./ProfileButton";
import type { NoticeItem } from "../../pages/Notice/NoticeModal";
import Logo from "./Logo";
import { Notification } from "./Notification";

export type MenuItem = { readonly name: string; readonly path: string };

/* ─── Menu config ───────────────────────────────────────────────────────── */
const BASE_MENU: MenuItem[] = [
  { name: "হোম", path: "/" },
  // { name: "ফটোগ্রাফি", path: "/photography" },
  { name: "প্রতিদিনের পড়া", path: "/dailylesson" },
  { name: "সাপ্তাহিক পরিক্ষা", path: "/weekly-exam" },
];

// const AUTH_MENU: MenuItem[] = [
//   { name: "প্রতিদিনের পড়া", path: "/dailylesson" },
//   { name: "সাপ্তাহিক পরিক্ষা", path: "/weekly-exam" },
// ];

const PRIVILEGED_MENU: MenuItem[] = [{ name: "ব্যবহারকারী", path: "/people" }];

const PRIVILEGED_ROLES = ["principal", "admin", "owner"];

const SEEN_KEY = "navbar_seen_notice_ids";

const getSeenIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
};

const saveSeenIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch (err) {
    console.error(err);
  }
};

/* ─── Nav bar styles ────────────────────────────────────────────────────── */
const NAV_BASE_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-bg)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  willChange: "transform",
};

/* ─── Navbar ────────────────────────────────────────────────────────────── */
const Navbar = memo(() => {
  const [scrolled, setScrolled] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const role = user?.role ?? "";
  const isPrivileged = PRIVILEGED_ROLES.includes(role);

  const menuConfig = useMemo<MenuItem[]>(() => {
    if (!isAuthenticated) return BASE_MENU;
    return [
      ...BASE_MENU,
      // ...AUTH_MENU,
      ...(isPrivileged ? PRIVILEGED_MENU : []),
    ];
  }, [isAuthenticated, isPrivileged]);

  const activeItem = useMemo(() => {
    const path = location.pathname;
    return (
      menuConfig.find((m) =>
        m.path === "/" ? path === "/" : path.startsWith(m.path),
      )?.name ?? ""
    );
  }, [location.pathname, menuConfig]);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        rafRef.current = null;
      });
    };
    setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const { data: notices } = useQuery<NoticeItem[]>({
    queryKey: ["notices"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/notices");
      return res.data.data as NoticeItem[];
    },
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (!notices?.length) return;
    const seenIds = getSeenIds();
    const active = notices.filter((n) => new Date(n.expiresAt) > new Date());
    setUnseenCount(active.filter((n) => !seenIds.has(n._id)).length);
  }, [notices]);

  useEffect(() => {
    if (location.pathname !== "/notice" || !notices?.length) return;
    const seenIds = getSeenIds();
    notices.forEach((n) => seenIds.add(n._id));
    saveSeenIds(seenIds);
    setUnseenCount(0);
  }, [location.pathname, notices]);

  const badgeCounts = useMemo<BadgeCounts>(
    () => ({ "/notice": unseenCount }),
    [unseenCount],
  );

  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  const handleLogo = useCallback(() => navigate("/"), [navigate]);

  const navStyle = useMemo<React.CSSProperties>(
    () => ({
      ...NAV_BASE_STYLE,
      borderColor: scrolled ? "var(--color-active-border)" : "transparent",
    }),
    [scrolled],
  );

  return (
    <>
      {/* ── Top bar ── */}
      <nav
        className={`fixed z-50 left-0 right-0 top-0 transition-[padding,border-color,box-shadow] duration-300 ${
          scrolled ? "py-2 md:py-3 border-b shadow-lg" : "py-2 md:py-4"
        }`}
        style={navStyle}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-1">
          <div className="flex items-center justify-between">
            {/* Desktop */}
            <div className="hidden md:contents">
              <DesktopNavbar
                menuConfig={menuConfig}
                activeItem={activeItem}
                onNavigate={handleNavigation}
                onLogoClick={handleLogo}
              />
            </div>

            {/* Mobile: logo + profile */}
            <div className="flex md:hidden items-center justify-between w-full">
              <Logo className="pt-5" onClick={handleLogo} />

              <div className="flex items-center gap-x-3">
                <Notification />
                <ProfileButton size={32} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Bottom tab bar (mobile only) ── */}
      <MobileNavbar
        menuConfig={menuConfig}
        activeItem={activeItem}
        badgeCounts={badgeCounts}
        onNavigate={handleNavigation}
      />
    </>
  );
});

Navbar.displayName = "Navbar";
export default Navbar;
