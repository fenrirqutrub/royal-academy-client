// src/components/Students/StudentsFiles.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosPublic from "../../hooks/axiosPublic";
import { type Student, StudentCard } from "./StudentsFiles.Ui";
import SearchBar from "../../components/common/Searchbar";
import Skeleton from "../../components/common/Skeleton";
import EmptyState from "../../components/common/Emptystate";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import { toBn } from "../../utility/shared";

const StudentsFiles = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canDelete = ["owner", "admin", "principal"].includes(user?.role ?? "");
  const canEdit = ["owner", "admin", "principal"].includes(user?.role ?? "");

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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosPublic.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      Swal.fire({
        icon: "success",
        title: "সফল!",
        text: "ছাত্র/ছাত্রী সফলভাবে মুছে ফেলা হয়েছে",
        confirmButtonColor: "#10b981",
        customClass: {
          popup: "bangla",
          title: "bangla",
          confirmButton: "bangla",
        },
      });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "ত্রুটি!",
        text: "মুছে ফেলতে সমস্যা হয়েছে",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: "bangla",
          title: "bangla",
          confirmButton: "bangla",
        },
      });
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Student>;
    }) => {
      await axiosPublic.patch(`/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      Swal.fire({
        icon: "success",
        title: "সফল!",
        text: "তথ্য সফলভাবে আপডেট করা হয়েছে",
        confirmButtonColor: "#10b981",
        customClass: {
          popup: "bangla",
          title: "bangla",
          confirmButton: "bangla",
        },
      });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "ত্রুটি!",
        text: "আপডেট করতে সমস্যা হয়েছে",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: "bangla",
          title: "bangla",
          confirmButton: "bangla",
        },
      });
    },
  });

  // Delete handler with SweetAlert2
  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      html: `<p class="bangla"><strong>${name}</strong> কে স্থায়ীভাবে মুছে ফেলা হবে।</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "বাতিল",
      reverseButtons: true,
      customClass: {
        popup: "bangla",
        title: "bangla",
        confirmButton: "bangla",
        cancelButton: "bangla",
      },
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(id);
          return true;
        } catch (error) {
          Swal.showValidationMessage("মুছে ফেলতে ব্যর্থ হয়েছে");
          console.error(error);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    return result.isConfirmed;
  };

  // Edit handler
  const handleEdit = async (id: string, data: Partial<Student>) => {
    await editMutation.mutateAsync({ id, data });
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
    <div className="min-h-screen px-4 sm:px-6 bg-[var(--color-bg)] relative">
      {/* header */}
      <div className="mb-7 flex items-end justify-center md:justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl text-center text-[var(--color-gray)]">
            মোট{" "}
            <span className="font-semibold" style={{ color: "#3b82f6" }}>
              {toBn(students.length)}
            </span>{" "}
            জন নিবন্ধিত
          </h2>
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
              onEdit={canEdit ? handleEdit : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentsFiles;
