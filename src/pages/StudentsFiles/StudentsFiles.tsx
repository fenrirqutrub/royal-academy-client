// src/components/Students/StudentsFiles.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosPublic from "../../hooks/axiosPublic";
import { type Student, StudentCard } from "./StudentsFiles.Ui";
import SearchBar from "../../components/common/Searchbar";
import Skeleton from "../../components/common/Skeleton";
import EmptyState from "../../components/common/Emptystate";
import { useAuth } from "../../context/AuthContext";

const StudentsFiles = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canDelete = ["owner", "admin", "principal"].includes(user?.role ?? "");

  const {
    data: students = [],
    isLoading,
    isError,
  } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/api/users?role=student");
      const list = Array.isArray(data) ? data : [];
      return list.filter(
        (u: Student) => u.role === "student" && !u.isHardcoded,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosPublic.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.studentClass?.toLowerCase().includes(q) ||
      s.district?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 bg-[var(--color-bg)] relative">
      {/* header */}
      <div className="mb-7 mt-10 lg:mt-0 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold bangla text-[var(--color-text)]">
            ছাত্রছাত্রী তালিকা
          </h1>
          <p className="text-sm bangla mt-1 text-[var(--color-gray)]">
            মোট{" "}
            <span className="font-semibold" style={{ color: "#3b82f6" }}>
              {students.length}
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
        <Skeleton variant="student-card" count={6} />
      ) : isError ? (
        <div className="text-center py-20 text-rose-400 text-sm bangla">
          ডেটা লোড করতে সমস্যা হয়েছে।
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          query={search}
          message={!search ? "কোনো ছাত্রছাত্রী পাওয়া যায়নি" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s, i) => (
            <StudentCard
              key={s._id}
              student={s}
              index={i}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentsFiles;
