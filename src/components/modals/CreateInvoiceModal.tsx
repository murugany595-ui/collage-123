import React, { useState, useEffect } from "react";
import { X, FileText, Plus, IndianRupee, Calendar, Tag, AlertCircle, Search, User } from "lucide-react";
import { api } from "../../services/api";

export interface CreateInvoiceModalProps {
  isOpen?: boolean;
  students?: any[];
  onClose?: () => void;
  onSuccess?: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen = true,
  students: initialStudents,
  onClose = () => {},
  onSuccess = () => {},
}) => {
  const [studentList, setStudentList] = useState<any[]>(initialStudents || []);
  const [studentId, setStudentId] = useState<string>("");
  const [grade, setGrade] = useState<string>("B.Tech CSE - Sem 5");
  const [category, setCategory] = useState<string>("Tuition & Academic Term Fee");
  const [amount, setAmount] = useState<string>("1250");
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [stuRes, catRes] = await Promise.all([
        api.admin.getStudents(),
        api.fees.getCategories().catch(() => ({ success: true, data: [] })),
      ]);

      if (stuRes.success && Array.isArray(stuRes.data) && stuRes.data.length > 0) {
        setStudentList(stuRes.data);
        setStudentId(stuRes.data[0].id);
        setGrade(stuRes.data[0].grade || "B.Tech CSE - Sem 5");
      }

      if (catRes.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
        setCategories(catRes.data);
      }
    } catch {
      // Keep defaults
    }
  };

  const handleStudentSelect = (sId: string) => {
    setStudentId(sId);
    const found = studentList.find((s) => s.id === sId);
    if (found?.grade) setGrade(found.grade);
  };

  const handleCategorySelect = (catName: string) => {
    setCategory(catName);
    const found = categories.find((c) => c.name === catName);
    if (found?.amount) {
      setAmount(String(found.amount));
    }
  };

  // Escape key and scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (isOpen === false) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0.00");
      return;
    }
    if (!dueDate) {
      setError("Please select a due date");
      return;
    }
    if (!studentId) {
      setError("Please select a student");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.fees.create({
        student_id: studentId,
        grade,
        category,
        amount: numAmount,
        due_date: dueDate,
        remarks,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || "Failed to create fee invoice");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto transition-opacity duration-200"
    >
      <div
        id="create-invoice-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] transform-gpu transition-all duration-200 scale-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/20 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg">Generate Fee Invoice</h3>
              <p className="text-xs text-blue-200">Create new student billing statement</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-blue-300 hover:text-white hover:bg-white/15 active:scale-90 active:bg-white/25 rounded-lg transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-400"
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Target Student
            </label>
            <select
              value={studentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white font-medium text-slate-800"
              required
            >
              {studentList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id}) • {s.grade}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Fee Category / Type
            </label>
            <select
              value={category}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white font-medium text-slate-800"
            >
              <option value="Tuition & Academic Term Fee">Tuition & Academic Term Fee</option>
              <option value="Transportation / Bus Facility">Transportation / Bus Facility</option>
              <option value="Science & Computer Lab Fee">Science & Computer Lab Fee</option>
              <option value="Digital Library & Learning Resources">Digital Library & Learning Resources</option>
              <option value="Sports & Physical Gymnasium">Sports & Physical Gymnasium</option>
              <option value="Hostel & Residential Boarding">Hostel & Residential Boarding</option>
              <option value="Examination & Certification Fee">Examination & Certification Fee</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                Fee Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800"
                required
              />
            </div>
          </div>

          {/* Department / Batch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Department / Batch</label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. B.Tech CSE - Sem 5"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
              required
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks / Description</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Semester 5 Core Tuition Fee"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs sm:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate Invoice</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
