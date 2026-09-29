import React, { useState, useEffect } from "react";
import { X, Calendar, IndianRupee, Tag, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

export interface EditFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: (updatedInvoice: any) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const EditFeeModal: React.FC<EditFeeModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
  onShowToast,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [category, setCategory] = useState<string>("Tuition & Academic Term Fee");
  const [remarks, setRemarks] = useState<string>("");
  const [status, setStatus] = useState<string>("Pending");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      const rawAmt = invoice.amount !== undefined ? invoice.amount : (invoice.total || 0);
      setAmount(String(typeof rawAmt === "number" ? rawAmt : parseFloat(String(rawAmt).replace(/[^0-9.]/g, "")) || 0));
      setDueDate(invoice.due_date || invoice.dueDate || new Date().toISOString().slice(0, 10));
      setCategory(invoice.category || invoice.type || "Tuition & Academic Term Fee");
      setRemarks(invoice.remarks || "");
      setStatus(invoice.status || "Pending");
      setError(null);
    }
  }, [invoice, isOpen]);

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

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0.00");
      return;
    }
    if (!dueDate) {
      setError("Please specify a valid due date");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.fees.update(invoice.id, {
        amount: numAmount,
        due_date: dueDate,
        category,
        remarks,
        status,
      });

      if (res.success) {
        if (onShowToast) onShowToast("Fee invoice updated successfully!", "success");
        onSuccess({
          ...invoice,
          amount: numAmount,
          due_date: dueDate,
          dueDate,
          category,
          remarks,
          status,
        });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update fee invoice.");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 transition-opacity duration-200"
    >
      <div
        id="edit-fee-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] transform-gpu transition-all duration-200 scale-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-blue-950 text-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              Invoice #{invoice.id}
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">Edit Fee Record</h2>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 active:scale-90 active:bg-white/25 transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-400"
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info preview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-500 font-medium">Student</p>
              <p className="font-bold text-slate-900 mt-0.5">
                {invoice.student_name || invoice.student || invoice.name || "Student"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Department</p>
              <p className="font-bold text-blue-600 mt-0.5">{invoice.grade || "B.Tech CSE"}</p>
            </div>
          </div>

          {/* Fee Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Fee Category / Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            {/* Total Fee Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                Total Fee Amount (₹)
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
                Payment Due Date
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

          {/* Status Override */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
              Payment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white font-medium text-slate-800"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Remarks / Memo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes & Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Approved installment plan, scholarship deduction applied"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
