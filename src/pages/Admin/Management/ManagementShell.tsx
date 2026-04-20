// src/pages/Admin/Management/ManagementShell.tsx

import { useState, useMemo, useRef } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import axiosPublic from "../../../hooks/axiosPublic";
import SelectInput from "../../../components/common/SelectInput";
import ExamPagination from "../../../components/common/ExamPagination";
import Skeleton from "../../../components/common/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import EmptyState from "../../../components/common/Emptystate";
import DatePicker from "../../../components/common/Datepicker";
import { useAuth } from "../../../context/AuthContext";
import {
  CLASS_OPTIONS,
  getSubjects,
  PRIVILEGED_ROLES,
  STAFF_DASHBOARD_ROLES,
  ROLE_BADGE_CLASS,
  type UserRole,
} from "../../../utility/Constants";
import { toBn, toBnDateStr } from "../../../utility/Formatters";

import {
  RequiredStar,
  ErrMsg,
  PageHeader,
  FilterBar,
  SearchBox,
  ResultCount,
  StatCard,
  RecordGrid,
  RecordCard,
  DeleteModal,
  EditModalShell,
  ImageUploader,
  BookOpen,
  User,
  Award,
  inputCls,
  labelCls,
} from "./ManagementUI";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamImage {
  imageUrl: string;
  publicId: string;
}

export interface ManagedRecord {
  _id: string;
  subject: string;
  teacher: string;
  teacherSlug?: string;
  class: string;
  groupKey: string;
  topics: string;
  images?: (string | ExamImage)[];
  createdAt: string;
}

export interface EditFormValues {
  subject: string;
  class: string;
  groupKey: string;
  topics: string;
}

export interface ShellConfig {
  title: string;
  apiPath: string;
  queryKey: string[];
  groupLabel: string;
  groupField: string;
  hasImages?: boolean;
  updateMethod?: "put" | "patch";
  useDateFilter?: boolean;
  mapRecord: (raw: Record<string, unknown>) => ManagedRecord;
  buildFormData: (
    data: EditFormValues,
    original: ManagedRecord,
    existingImages: { imageUrl: string; publicId: string }[],
    newFiles: File[],
  ) => FormData;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────

const EditModal = ({
  record,
  config,
  onClose,
}: {
  record: ManagedRecord;
  config: ShellConfig;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const initialExisting = (record.images ?? []).map((img) =>
    typeof img === "string" ? { imageUrl: img, publicId: "" } : img,
  );
  const [existingImages, setExistingImages] = useState(initialExisting);

  const allPreviews = [
    ...existingImages.map((i) => i.imageUrl),
    ...newPreviews,
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid, isDirty, touchedFields },
  } = useForm<EditFormValues>({
    mode: "onTouched",
    defaultValues: {
      subject: record.subject,
      class: record.class,
      groupKey: record.groupKey,
      topics: record.topics,
    },
  });

  const selectedClass = watch("class");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageFiles((p) => [...p, ...files]);
    setNewPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    if (i < existingImages.length) {
      setExistingImages((p) => p.filter((_, j) => j !== i));
    } else {
      const ni = i - existingImages.length;
      URL.revokeObjectURL(newPreviews[ni]);
      setNewPreviews((p) => p.filter((_, j) => j !== ni));
      setImageFiles((p) => p.filter((_, j) => j !== ni));
    }
  };

  const method = config.updateMethod ?? "put";

  const mutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const imagesChanged =
        config.hasImages &&
        (imageFiles.length > 0 ||
          existingImages.length !== (record.images ?? []).length);

      const fd = config.buildFormData(data, record, existingImages, imageFiles);

      if (imagesChanged) {
        return axiosPublic[method](`${config.apiPath}/${record._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const json: Record<string, string> = {};
      fd.forEach((val, key) => {
        json[key] = val as string;
      });
      return axiosPublic[method](`${config.apiPath}/${record._id}`, json);
    },
    onSuccess: () => {
      toast.success("সফলভাবে আপডেট হয়েছে!");
      qc.invalidateQueries({ queryKey: config.queryKey });
      onClose();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message ?? err?.message ?? "আপডেট ব্যর্থ হয়েছে",
      ),
  });

  const onSubmit: SubmitHandler<EditFormValues> = (data) =>
    mutation.mutate(data);

  return (
    <EditModalShell
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      isPending={mutation.isPending}
      isValid={isValid}
      isDirty={isDirty}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Controller
          name="class"
          control={control}
          rules={{ required: "শ্রেণি আবশ্যিক" }}
          render={({ field, fieldState }) => (
            <SelectInput
              label="শ্রেণি"
              required
              placeholder="শ্রেণি বেছে নিন"
              options={CLASS_OPTIONS}
              value={field.value}
              onChange={(v) => {
                field.onChange(v);
                setValue("subject", "", { shouldTouch: false });
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              isTouched={fieldState.isTouched}
            />
          )}
        />
        <Controller
          name="subject"
          control={control}
          rules={{ required: "বিষয় আবশ্যিক" }}
          render={({ field, fieldState }) => (
            <SelectInput
              label="বিষয়"
              required
              placeholder={
                selectedClass ? "বিষয় বেছে নিন" : "আগে শ্রেণি বেছে নিন"
              }
              options={getSubjects(selectedClass)}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={!selectedClass}
              error={fieldState.error?.message}
              isTouched={fieldState.isTouched}
            />
          )}
        />
      </div>

      <div>
        <label className={labelCls}>
          {config.groupLabel} নম্বর <RequiredStar />
        </label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="যেমন: ১, ৫, ২.৫"
          {...register("groupKey", {
            required: `${config.groupLabel} নম্বর আবশ্যিক`,
            minLength: { value: 1, message: "সঠিক নম্বর দিন" },
          })}
          className={inputCls(
            !!errors.groupKey,
            !!touchedFields.groupKey && !errors.groupKey,
          )}
        />
        <ErrMsg msg={errors.groupKey?.message} />
      </div>

      <div>
        <label className={labelCls}>
          বিষয়বস্তু <RequiredStar />
        </label>
        <textarea
          rows={4}
          placeholder="বিষয়বস্তু লিখুন..."
          {...register("topics", {
            required: "বিষয়বস্তু আবশ্যিক",
            minLength: {
              value: 6,
              message: "কমপক্ষে ৬ অক্ষর লিখুন",
            },
          })}
          className={`${inputCls(
            !!errors.topics,
            !!touchedFields.topics && !errors.topics,
          )} resize-none leading-relaxed bangla`}
        />
        <ErrMsg msg={errors.topics?.message} />
      </div>

      {config.hasImages && (
        <ImageUploader
          previews={allPreviews}
          onPickFiles={() => fileInputRef.current?.click()}
          onRemove={removeImage}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />
      )}
    </EditModalShell>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SHELL
// ─────────────────────────────────────────────────────────────────────────────

const ManagementShell = ({ config }: { config: ShellConfig }) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const role = (user?.role ?? "teacher") as UserRole;
  const isManager = PRIVILEGED_ROLES.includes(role);
  const mySlug = user?.slug ?? "";

  // ── filter state ──────────────────────────────────────────────────────

  const today = new Date();

  const [filterDateStr, setFilterDateStr] = useState(
    config.useDateFilter ? toBnDateStr(today) : "",
  );
  const [filterDateObj, setFilterDateObj] = useState<Date | null>(
    config.useDateFilter ? today : null,
  );
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTeacherSlug, setFilterTeacherSlug] = useState(
    isManager ? "" : mySlug,
  );
  const [selectedKey, setSelectedKey] = useState("");

  // ── modal state ───────────────────────────────────────────────────────

  const [editTarget, setEditTarget] = useState<ManagedRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedRecord | null>(null);

  // ── data fetching ─────────────────────────────────────────────────────

  const {
    data: records = [],
    isLoading,
    isError,
  } = useQuery<ManagedRecord[]>({
    queryKey: config.queryKey,
    queryFn: async () => {
      const res = await axiosPublic.get(config.apiPath);
      const p = res.data;
      const raw: Record<string, unknown>[] = Array.isArray(p)
        ? p
        : Array.isArray(p?.data)
          ? p.data
          : Array.isArray(p?.exams)
            ? p.exams
            : [];
      return raw.map(config.mapRecord);
    },
  });

  const { data: allStaff = [] } = useQuery<{ slug: string; name: string }[]>({
    queryKey: ["staff-for-filter"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      const list: Record<string, unknown>[] = Array.isArray(res.data)
        ? res.data
        : [];
      return list
        .filter(
          (u) => STAFF_DASHBOARD_ROLES.includes(u.role as UserRole) && u.slug,
        )
        .map((u) => ({
          slug: u.slug as string,
          name: u.name as string,
        }));
    },
    enabled: isManager,
  });

  // ── derived ───────────────────────────────────────────────────────────

  const teacherSelectOptions = useMemo(
    () => [
      { value: "", label: "সকল শিক্ষক" },
      ...allStaff.map((u) => ({ value: u.slug, label: u.name })),
    ],
    [allStaff],
  );

  const sortedKeys = useMemo(() => {
    const unique = [...new Set(records.map((r) => r.groupKey))];
    return unique.sort((a, b) => Number(a) - Number(b));
  }, [records]);

  const effectiveKey = selectedKey || sortedKeys[sortedKeys.length - 1] || "";

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const q = search.toLowerCase();
        const activeSlug = isManager ? filterTeacherSlug : mySlug;

        if (activeSlug && r.teacherSlug !== activeSlug) return false;

        if (filterDateObj && !isSameDay(new Date(r.createdAt), filterDateObj))
          return false;

        if (
          !config.useDateFilter &&
          effectiveKey &&
          r.groupKey !== effectiveKey
        )
          return false;

        if (filterClass && r.class !== filterClass) return false;

        if (
          q &&
          !r.subject.toLowerCase().includes(q) &&
          !r.topics.toLowerCase().includes(q) &&
          !r.groupKey.includes(q)
        )
          return false;

        return true;
      }),
    [
      records,
      search,
      filterClass,
      filterDateObj,
      effectiveKey,
      config.useDateFilter,
      filterTeacherSlug,
      isManager,
      mySlug,
    ],
  );

  // ── delete mutation ───────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosPublic.delete(`${config.apiPath}/${id}`),
    onSuccess: () => {
      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: config.queryKey });
      setDeleteTarget(null);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(
        err?.response?.data?.message ?? err?.message ?? "মুছতে ব্যর্থ হয়েছে",
      ),
  });

  // ── stats ─────────────────────────────────────────────────────────────

  const totalForSlug =
    isManager && !filterTeacherSlug
      ? records.length
      : records.filter(
          (r) => r.teacherSlug === (isManager ? filterTeacherSlug : mySlug),
        ).length;

  const stats = [
    {
      label: "মোট",
      value: totalForSlug,
      icon: <BookOpen className="w-4 h-4" />,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20",
    },
    {
      label: "শ্রেণি",
      value: new Set(
        records
          .filter(
            (r) => !filterTeacherSlug || r.teacherSlug === filterTeacherSlug,
          )
          .map((r) => r.class),
      ).size,
      icon: <Award className="w-4 h-4" />,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: isManager ? "শিক্ষক" : "নাম",
      value: isManager ? allStaff.length : (user?.name ?? "—"),
      icon: <User className="w-4 h-4" />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  const hasFilter = !!(search || filterClass || filterTeacherSlug);

  // ── early returns ─────────────────────────────────────────────────────

  if (isLoading)
    return (
      <div className="min-h-screen bg-[var(--color-bg)] py-10 px-4">
        <Skeleton variant="daily-lesson" />
      </div>
    );

  if (isError)
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <ErrorState message="ডেটা লোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।" />
      </div>
    );

  // ── render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 md:py-10">
      <PageHeader
        title={config.title}
        subtitle={
          isManager
            ? "সকল শিক্ষকের ডেটা দেখুন, সম্পাদনা করুন বা মুছে ফেলুন"
            : "আপনার যোগ করা ডেটা দেখুন ও পরিচালনা করুন"
        }
        roleBadge={
          ROLE_BADGE_CLASS[role]
            ? { label: role, color: ROLE_BADGE_CLASS[role]! }
            : null
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <FilterBar>
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="বিষয় বা বিষয়বস্তু খুঁজুন…"
        />

        <div className="sm:w-44">
          <SelectInput
            options={[{ value: "", label: "সকল শ্রেণি" }, ...CLASS_OPTIONS]}
            value={filterClass}
            onChange={setFilterClass}
            placeholder="সকল শ্রেণি"
          />
        </div>

        {isManager && (
          <div className="sm:w-52">
            <SelectInput
              options={teacherSelectOptions}
              value={filterTeacherSlug}
              onChange={(v) => {
                setFilterTeacherSlug(v);
                setSelectedKey("");
              }}
              placeholder="সকল শিক্ষক"
            />
          </div>
        )}

        {config.useDateFilter && (
          <div className="sm:w-64">
            <DatePicker
              value={filterDateStr}
              onChange={(val) => {
                setFilterDateStr(val);
                if (!val) setFilterDateObj(null);
                setSelectedKey("");
              }}
              onDateChange={(d) => setFilterDateObj(d)}
              placeholder="তারিখ ফিল্টার করুন"
              maxDate={new Date()}
            />
          </div>
        )}
      </FilterBar>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <div key="empty">
            <EmptyState
              title="কোনো ডেটা পাওয়া যায়নি"
              message={
                search || filterClass || filterDateStr || filterTeacherSlug
                  ? "এই ফিল্টারে কোনো ডেটা নেই"
                  : "এখনো কিছু যোগ করা হয়নি"
              }
              icon={<BookOpen className="w-10 h-10 text-[var(--color-gray)]" />}
            />
          </div>
        ) : (
          <RecordGrid key="grid">
            <ResultCount
              visible={filtered.length}
              total={records.length}
              hasFilter={hasFilter}
            />
            {filtered.map((r, i) => (
              <RecordCard
                key={r._id}
                record={r}
                index={i}
                groupLabel={config.groupLabel}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </RecordGrid>
        )}
      </AnimatePresence>

      {!config.useDateFilter && sortedKeys.length > 1 && (
        <ExamPagination
          examNumbers={sortedKeys}
          selected={effectiveKey}
          onSelect={(k) => {
            setSelectedKey(k);
            setSearch("");
            setFilterDateStr("");
            setFilterDateObj(null);
          }}
          hint={`${config.groupLabel} নং বেছে নিন • মোট ${toBn(sortedKeys.length)}টি`}
          windowSize={7}
        />
      )}

      <AnimatePresence>
        {editTarget && (
          <EditModal
            key="edit"
            record={editTarget}
            config={config}
            onClose={() => setEditTarget(null)}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete"
            record={deleteTarget}
            groupLabel={config.groupLabel}
            onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagementShell;
