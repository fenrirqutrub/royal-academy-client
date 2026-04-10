import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import axiosPublic from "../../../hooks/axiosPublic";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";

interface ExamMarksPage {
  pageNumber: number;
  url: string;
  publicId: string;
}

interface ExamMarksData {
  _id: string;
  pages: ExamMarksPage[];
  totalPages: number;
  isActive: boolean;
  createdAt: string;
}

const AddExamMarks = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // fetch all exam marks
  const { data: allExamMarks = [], isLoading: listLoading } = useQuery({
    queryKey: ["all-exam-marks"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/exam-marks");
      return res.data.data as ExamMarksData[];
    },
  });

  // upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await axiosPublic.post("/api/exam-marks", formData);
      return res.data;
    },
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["all-exam-marks"] });
      queryClient.invalidateQueries({ queryKey: ["active-exam-marks"] });
    },
  });

  // delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosPublic.delete(`/api/exam-marks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-exam-marks"] });
      queryClient.invalidateQueries({ queryKey: ["active-exam-marks"] });
    },
  });

  // toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosPublic.patch(`/api/exam-marks/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-exam-marks"] });
      queryClient.invalidateQueries({ queryKey: ["active-exam-marks"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  return (
    <div className="w-full mt-4 space-y-6">
      {/* Upload area */}
      <div className="space-y-3">
        <p className="bangla text-lg font-semibold text-[var(--color-text)] opacity-70">
          পরীক্ষার ফলাফল আপলোড
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full border-2 border-dashed rounded-2xl p-8
            flex flex-col items-center justify-center gap-3 cursor-pointer
            transition-colors duration-200
            ${
              dragOver
                ? "border-[var(--color-text)] bg-[var(--color-active-bg)]"
                : "border-[var(--color-active-border)] hover:border-[var(--color-text)]/40"
            }
          `}
        >
          <FileText className="w-8 h-8 opacity-40" />

          {selectedFile ? (
            <p className="bangla text-sm font-medium text-[var(--color-text)]">
              ✅ {selectedFile.name}
            </p>
          ) : (
            <p className="bangla text-sm text-[var(--color-gray)] text-center">
              PDF ফাইল এখানে drag করুন অথবা click করুন
              <br />
              <span className="opacity-60 text-xs">সর্বোচ্চ ২০MB</span>
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload btn */}
        <AnimatePresence>
          {selectedFile && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="
                w-full py-3 rounded-xl font-medium text-sm bangla
                bg-black text-white
                hover:opacity-80 transition-opacity
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  আপলোড হচ্ছে...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  আপলোড করুন
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {uploadMutation.isError && (
          <p className="bangla text-sm text-red-500 text-center">
            আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।
          </p>
        )}
      </div>

      {/* Existing exam marks list */}
      <div className="space-y-3">
        <p className="bangla text-base font-semibold text-[var(--color-text)] opacity-70">
          সকল ফলাফল
        </p>

        {listLoading ? (
          <div className="space-y-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-16 rounded-xl bg-[var(--color-active-bg)] animate-pulse"
              />
            ))}
          </div>
        ) : allExamMarks.length === 0 ? (
          <p className="bangla text-sm text-[var(--color-gray)] text-center py-4">
            কোনো ফলাফল নেই
          </p>
        ) : (
          <div className="space-y-2">
            {allExamMarks.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--color-active-border)] bg-[var(--color-active-bg)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* active indicator */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isActive ? "bg-green-500" : "bg-[var(--color-gray)]/40"}`}
                  />
                  <div className="min-w-0">
                    <p className="bangla text-sm font-medium text-[var(--color-text)] truncate">
                      {new Date(item.createdAt).toLocaleDateString("bn-BD", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="bangla text-xs text-[var(--color-gray)]">
                      {item.totalPages} পৃষ্ঠা
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle active */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleMutation.mutate(item._id)}
                    disabled={toggleMutation.isPending}
                    title={item.isActive ? "Deactivate" : "Activate"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bangla bg-black text-white hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    {item.isActive ? "নিষ্ক্রিয়" : "সক্রিয়"}
                  </motion.button>

                  {/* Delete */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => deleteMutation.mutate(item._id)}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-[15px] h-[15px]" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExamMarks;
