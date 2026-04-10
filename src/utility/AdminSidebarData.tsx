import { type LucideIcon } from "lucide-react";
import {
  Folder,
  ImageIcon,
  Image,
  BookOpen,
  Camera,
  Star,
  User,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SubNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

export interface NavItem {
  name: string;
  icon: LucideIcon;
  path?: string;
  subItems?: SubNavItem[];
}

export interface SidebarContentProps {
  user: {
    name?: string;
    role?: string;
    slug?: string;
    avatar?: { url?: string | null };
  } | null;
  navGroups: NavItem[];

  roleConfig: { label: string; color: string };
  onLogout: () => void;
  onThemeToggle: () => void;
  onNavClick?: () => void;
}

export const dashboardNav = (): NavItem[] => [
  { name: "ড্যাসবোর্ড", path: "/dashboard", icon: BookOpen },
  { name: "প্রোফাইল", path: "/dashboard/profile", icon: User },
];

export const studentNav = (): NavItem[] => [
  { name: "প্রোফাইল", path: "/dashboard/profile", icon: User },
];

export const contentNav = (isPrivileged: boolean): NavItem[] => [
  {
    name: "এখানে লিখুন",
    icon: Folder,
    subItems: [
      {
        name: "আজকের পড়া লিখুন",
        path: "/dashboard/add-daily-lesson",
        icon: BookOpen,
      },
      {
        name: "পরিক্ষার ধারণা লিখুন",
        path: "/dashboard/add-weekly-exam",
        icon: BookOpen,
      },

      ...(isPrivileged
        ? ([
            {
              name: "নতুন শিক্ষক যোগ করুন",
              path: "/dashboard/add-teacher",
              icon: ImageIcon,
            },
            {
              name: "স্লাইডার যোগ করুন",
              path: "/dashboard/add-hero",
              icon: Image,
            },
            {
              name: "নোটিশ যোগ করুন",
              path: "/dashboard/add-notice",
              icon: Image,
            },
            {
              name: "ছবি যোগ করুন",
              path: "/dashboard/add-photography",
              icon: Image,
            },
            {
              name: "রুটিন যোগ করুন",
              path: "/dashboard/add-routine",
              icon: Image,
            },
            {
              name: "মান বন্টন যোগ করুন",
              path: "/dashboard/add-exam-marks",
              icon: Image,
            },
          ] satisfies NavItem["subItems"])
        : []),
    ],
  },
];

export const managementNav = (isPrivileged: boolean): NavItem[] => [
  {
    name: "ব্যবস্থাপনা দেখুন",
    icon: Folder,
    subItems: [
      ...(isPrivileged
        ? ([
            {
              name: "ছবি ডিলিট করুন",
              path: "/dashboard/management/photos",
              icon: Camera,
            },
            {
              name: "স্লাইডার মুছুন",
              path: "/dashboard/management/heroes",
              icon: Star,
            },
            {
              name: "নোটিশ মুছুন",
              path: "/dashboard/management/notice",
              icon: Star,
            },
          ] satisfies NavItem["subItems"])
        : []),
    ],
  },
];
