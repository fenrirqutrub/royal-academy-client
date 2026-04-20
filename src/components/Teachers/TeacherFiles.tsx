// src/components/Teachers/TeacherFiles.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosPublic from "../../hooks/axiosPublic";
import Skeleton from "../common/Skeleton";
import { type Teacher, TeacherCard } from "./TeacherFiles.Ui";
import SearchBar from "../common/Searchbar";
import EmptyState from "../common/Emptystate";
import { useAuth } from "../../context/AuthContext";
import { toBn } from "../../utility/Formatters";

const TeacherFiles = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canDelete = ["owner", "admin", "principal"].includes(user?.role ?? "");

  const {
    data: teachers = [],
    isLoading,
    isError,
  } = useQuery<Teacher[]>({
    queryKey: ["teacherFiles"],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/users");
      const list = Array.isArray(data) ? data : [];
      return list.filter(
        (u: Teacher) =>
          (u.role === "teacher" ||
            u.role === "admin" ||
            u.role === "principal") &&
          !u.isHardcoded,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosPublic.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherFiles"] });
    },
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.phone?.includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.collegeName?.toLowerCase().includes(q) ||
      t.district?.toLowerCase().includes(q) ||
      t.thana?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen px-4 sm:px-6 bg-[var(--color-bg)] relative">
      {/* header */}
      <div className=" flex items-end justify-center md:justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="text-xl text-[var(--color-gray)]">
            মোট{" "}
            <span className="font-semibold" style={{ color: "#3b82f6" }}>
              {toBn(teachers.length)}
            </span>{" "}
            জন নিবন্ধিত
          </p>
        </div>
        <div className="w-full sm:w-72">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="নাম, ফোন বা জেলা দিয়ে খুঁজুন..."
          />
        </div>
      </div>

      {/* content */}
      {isLoading ? (
        <Skeleton variant="teacher-card" count={6} />
      ) : isError ? (
        <div className="text-center py-20 text-rose-400 text-sm bangla">
          ডেটা লোড করতে সমস্যা হয়েছে।
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          query={search}
          message={!search ? "কোনো শিক্ষক পাওয়া যায়নি" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <TeacherCard
              key={t._id}
              teacher={t}
              index={i}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherFiles;
