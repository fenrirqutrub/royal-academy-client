import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, AlertCircle, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosPublic from "../../hooks/axiosPublic";
import { Pagination } from "../../components/common/Pagination";
import { toBn } from "../../utility/Formatters";

interface Complain {
  _id: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  slug: string;
  postedBy?: {
    name?: string;
    role?: string;
    slug?: string;
    phone?: string;
    fatherName?: string;
    motherName?: string;
    gramNam?: string;
    thana?: string;
    district?: string;
    studentClass?: string;
    roll?: string;
    schoolName?: string;
    avatar?: { url: string | null };
  };
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

const Avatar = ({ user }: { user: Complain["postedBy"] }) => {
  if (!user)
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--color-active-border)] flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-[var(--color-gray)]">
          ?
        </span>
      </div>
    );
  return user.avatar?.url ? (
    <img
      src={user.avatar.url}
      alt={user.name}
      className="w-10 h-10 rounded-full object-cover shrink-0"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-[var(--color-active-border)] flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-[var(--color-gray)]">
        {user.name?.[0] ?? "?"}
      </span>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-[var(--color-gray)] shrink-0 w-28">{label}</span>
      <span className="text-[var(--color-text)]">{value}</span>
    </div>
  );
};

const Complain = () => {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Complain | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Complain[]>({
    queryKey: ["complains"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/complain");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosPublic.delete(`/api/complain/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["complains"] });
      setSelected(null);
      setConfirmDelete(false);
      toast.success(data?.message || "অভিযোগ সফলভাবে মুছে ফেলা হয়েছে");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      setConfirmDelete(false);
      const message =
        error?.response?.data?.message || "অভিযোগ মুছতে সমস্যা হয়েছে";
      toast.error(message);
    },
  });

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (selected) {
      deleteMutation.mutate(selected._id);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };

  const handleCloseModal = () => {
    setSelected(null);
    setConfirmDelete(false);
  };

  const totalPages = Math.ceil((data?.length ?? 0) / ITEMS_PER_PAGE);
  const paginated = data?.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-[var(--color-gray)]">
        <LoaderCircle className="w-5 h-5 animate-spin" />
        <span className="text-sm">লোড হচ্ছে...</span>
      </div>
    );

  if (isError)
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-red-500">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">লোড করতে সমস্যা হয়েছে</span>
      </div>
    );

  return (
    <div className="p-5 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">
          অভিযোগ সমূহ
          {data && (
            <span className="ml-2 text-sm font-normal text-[var(--color-gray)]">
              ({toBn(data.length)}টি)
            </span>
          )}
        </h2>
      </div>

      {/* List */}
      {!paginated?.length ? (
        <p className="text-center text-sm text-[var(--color-gray)] py-16">
          কোনো অভিযোগ নেই
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--color-active-border)] border border-[var(--color-active-border)] rounded-xl overflow-hidden">
          {paginated.map((c, i) => (
            <button
              key={c._id}
              onClick={() => setSelected(c)}
              className="flex items-center gap-4 px-4 py-3.5 bg-[var(--color-active-bg)] hover:bg-[var(--color-active-border)]/40 transition-colors text-left"
            >
              {/* Serial */}
              <span className="text-xs text-[var(--color-gray)] w-6 shrink-0">
                {(page - 1) * ITEMS_PER_PAGE + i + 1}
              </span>

              <Avatar user={c.postedBy} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                    {c.postedBy?.name ?? "অজানা"}
                  </p>
                  {c.postedBy?.role === "student" &&
                    c.postedBy?.studentClass && (
                      <span className="text-[0.65rem] px-1.5 py-0.5 rounded border border-[var(--color-active-border)] text-[var(--color-gray)] shrink-0">
                        {c.postedBy.studentClass}
                      </span>
                    )}
                </div>
                <p className="text-xs text-[var(--color-gray)] truncate">
                  {c.description}
                </p>
              </div>

              <p className="text-xs text-[var(--color-gray)] shrink-0 hidden sm:block">
                {new Date(c.createdAt).toLocaleDateString("bn-BD")}
              </p>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Modal */}
      <div
        className={`${
          selected ? "visible opacity-100" : "invisible opacity-0"
        } fixed inset-0 z-[200000000] bg-[var(--color-bg)] transition-all duration-300`}
        onClick={handleCloseModal}
      >
        <div
          className="w-full h-full overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {selected && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-active-border)] sticky top-0 bg-[var(--color-bg)] z-10">
                <div className="flex items-center gap-3">
                  <Avatar user={selected.postedBy} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {selected.postedBy?.name ?? "অজানা"}
                    </p>
                    <p className="text-xs text-[var(--color-gray)]">
                      {selected.postedBy?.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Delete Button */}
                  <button
                    onClick={handleDeleteClick}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">মুছুন</span>
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-full bg-red-500 hover:rotate-90 transition-transform duration-300"
                  >
                    <X className="text-white w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex flex-col gap-2 max-w-3xl mx-auto w-full">
                <p className="text-xs uppercase tracking-widest text-[var(--color-gray)] mb-1">
                  ব্যক্তিগত তথ্য
                </p>

                <Row label="নাম" value={selected.postedBy?.name} />
                <Row label="পিতার নাম" value={selected.postedBy?.fatherName} />
                <Row label="মাতার নাম" value={selected.postedBy?.motherName} />
                <Row label="ফোন" value={selected.postedBy?.phone} />
                <Row
                  label="ঠিকানা"
                  value={[
                    selected.postedBy?.gramNam,
                    selected.postedBy?.thana,
                    selected.postedBy?.district,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />

                {selected.postedBy?.role === "student" && (
                  <div>
                    <div className="border-t border-[var(--color-active-border)] my-1" />
                    <p className="text-xs uppercase tracking-widest text-[var(--color-gray)] mb-1">
                      শিক্ষার্থী তথ্য
                    </p>
                    <Row
                      label="শ্রেণি"
                      value={selected.postedBy?.studentClass}
                    />
                    <Row label="রোল" value={toBn(selected.postedBy?.roll)} />
                    <Row
                      label="বিদ্যালয়"
                      value={selected.postedBy?.schoolName}
                    />
                  </div>
                )}

                <div className="border-t border-[var(--color-active-border)] my-1" />
                <p className="text-xs uppercase tracking-widest text-[var(--color-gray)] mb-1">
                  অভিযোগ
                </p>

                <p className="text-sm text-[var(--color-text)] bg-[var(--color-active-bg)] p-5 rounded whitespace-pre-line leading-relaxed">
                  {selected.description}
                </p>

                <p className="text-xs text-[var(--color-gray)] mt-2 text-right">
                  অভিযোগের সময়:{" "}
                  {new Date(selected.createdAt).toLocaleString("bn-BD", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <div
        className={`${
          confirmDelete ? "visible opacity-100" : "invisible opacity-0"
        } fixed inset-0 z-[300000000] flex items-center justify-center transition-all duration-200`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleCancelDelete}
        />

        {/* Dialog Box */}
        <div className="relative bg-[var(--color-bg)] rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-sm flex flex-col gap-4 border border-[var(--color-active-border)]">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-base font-semibold text-[var(--color-text)] mb-1">
              অভিযোগ মুছবেন?
            </p>
            <p className="text-sm text-[var(--color-gray)]">
              এই অভিযোগটি স্থায়ীভাবে মুছে যাবে। এই কাজটি পূর্বাবস্থায় ফেরানো
              যাবে না।
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-1">
            <button
              onClick={handleCancelDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-active-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-active-bg)] transition-colors disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span>মুছছে...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>মুছুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complain;
