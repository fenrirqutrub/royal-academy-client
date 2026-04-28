// TeacherCard.tsx
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import {
  DEGREE_LABEL,
  ROLE_CONFIG,
  type UserRole,
} from "../../utility/Constants";
import { Avatar } from "../common/Avatar";

export interface TeacherData {
  _id: string;
  name: string;
  email: string;
  role: string;
  slug: string;
  phone?: string;
  address?: string;
  collegeName?: string | null;
  degree?: string | null;
  currentYear?: string | null;
  gramNam?: string | null;
  para?: string | null;
  thana?: string | null;
  district?: string | null;
  avatar?: { url: string | null; publicId: string | null };
}

const TeacherCard = ({ teacher }: { teacher: TeacherData }) => {
  const role = (teacher.role as UserRole) ?? "teacher";
  const { color, handle } = ROLE_CONFIG[role] ?? ROLE_CONFIG.teacher;

  // collegeName takes priority, then degree, then currentYear (e.g. "mba"), then fallback
  const eduText =
    teacher.collegeName?.trim() ||
    (teacher.degree
      ? (DEGREE_LABEL[teacher.degree] ?? teacher.degree)
      : null) ||
    (teacher.currentYear
      ? (DEGREE_LABEL[teacher.currentYear] ?? teacher.currentYear)
      : null) ||
    "—";

  const location = [teacher.gramNam, teacher.para].filter(Boolean).join(", ");

  return (
    <motion.div
      className="relative cursor-pointer px-4 pb-4 mx-3 my-2 w-72 bg-[var(--color-bg)] rounded-xl shadow-xl hover:shadow-none border border-[var(--color-active-border)]"
      transition={{ duration: 0.15 }}
    >
      <div className="flex flex-col justify-center items-center gap-3 pt-5">
        {/* Avatar */}
        <Avatar
          name={teacher.name}
          url={teacher.avatar?.url}
          color={color}
          size={100}
        />

        {/* Info */}
        <div className="w-full flex flex-col items-center gap-0.5">
          {/* Name + verified badge */}
          <div className="flex items-center mt-5 gap-x-2">
            <span
              className="font-bold  text-xl leading-tight truncate max-w-[160px] text-[var(--color-text)] bangla"
              title={teacher.name}
            >
              {teacher.name}
            </span>
            <BadgeCheck className="w-4 h-4 shrink-0" style={{ color }} />
          </div>

          {/* Role badge */}
          <span
            className="text-xs px-4 py-0.5 rounded-xl text-[var(--color-gray)] bangla"
            style={{
              background: `linear-gradient(to bottom right, ${color}33, ${color}55)`,
            }}
          >
            {handle}
          </span>

          {/* Education */}
          {eduText && (
            <p className="mt-1 text-sm text-[var(--color-gray)] bangla">
              {eduText}
            </p>
          )}

          {/* Location */}
          {location && (
            <p className="text-sm text-[var(--color-gray)] bangla">
              গ্রামঃ {location}
            </p>
          )}

          {(teacher.thana || teacher.district) && (
            <div className="flex items-center gap-x-4 text-sm text-[var(--color-gray)] bangla">
              {teacher.thana && <span>থানাঃ {teacher.thana}</span>}
              {teacher.district && <span>জেলাঃ {teacher.district}</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TeacherCard;
