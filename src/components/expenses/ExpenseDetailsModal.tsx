import React from "react";
import { X, Printer, Download, ExternalLink, Calendar, IndianRupee, Tag, User, FileText, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { ExpenseItem } from "../../types";

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseItem | null;
  onEdit?: (expense: ExpenseItem) => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  isOpen,
  onClose,
  expense,
  onEdit,
}) => {
  if (!isOpen || !expense) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="expense-details-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Expense Voucher</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                  {expense.id}
                </span>
              </div>
              <p className="text-xs text-slate-300">Institutional expenditure audit record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-expense-voucher-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              id="close-expense-details-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voucher Body (Printable) */}
        <div className="p-6 space-y-6">
          {/* Institutional Stamp Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Our College of Engineering & Technology
                </h3>
                <p className="text-xs text-slate-500">Autonomous Institution • Finance & Accounts Wing</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  expense.payment_status === "Paid"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {expense.payment_status === "Paid" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                {expense.payment_status}
              </span>
            </div>
          </div>

          {/* Amount Display */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Voucher Amount</p>
              <h2 className="text-3xl font-extrabold text-white mt-0.5 tracking-tight">
                ₹{Number(expense.amount || 0).toLocaleString("en-IN")}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Category</p>
              <span className="inline-block mt-1 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                {expense.category}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">Expense Title</span>
              <span className="text-slate-900 font-bold text-sm block leading-snug">{expense.title}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">Paid To / Vendor</span>
              <span className="text-slate-900 font-bold text-sm block leading-snug">{expense.paid_to}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">Expense Date</span>
              <span className="text-slate-900 font-bold text-sm block leading-snug">{expense.date}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">Payment Method</span>
              <span className="text-slate-900 font-bold text-sm block leading-snug">{expense.payment_method}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">Reference / UTR #</span>
              <span className="text-slate-900 font-mono font-bold text-xs block leading-snug">
                {expense.reference_no || "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">Source / Module</span>
              <span className="text-slate-900 font-bold text-xs block uppercase leading-snug">
                {expense.source_type ? `${expense.source_type} module` : "Manual Entry"}
              </span>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Description / Authorization Notes
              </span>
              <p className="text-slate-800 font-medium whitespace-pre-wrap">{expense.description}</p>
            </div>
          )}

          {/* Receipt Attachment Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-slate-600 font-bold text-xs uppercase tracking-wider block mb-2">
              Attached Document / Invoice
            </span>
            {expense.receipt_name || expense.receipt_url ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {expense.receipt_name || `${expense.id}_voucher_invoice.pdf`}
                    </p>
                    <p className="text-[11px] text-slate-400">Verified institutional billing receipt</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expense.receipt_url ? (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                  ) : (
                    <button
                      onClick={() => alert(`Invoice document for ${expense.id} is securely stored in institutional records.`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No digital receipt attachment uploaded for this voucher.</p>
            )}
          </div>

          {/* Authorization Footer */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="h-8 border-b border-dashed border-slate-300 mb-1" />
              <p className="text-[10px] uppercase font-bold text-slate-500">Prepared By</p>
              <p className="text-[11px] font-semibold text-slate-800">Finance Clerk</p>
            </div>
            <div>
              <div className="h-8 border-b border-dashed border-slate-300 mb-1" />
              <p className="text-[10px] uppercase font-bold text-slate-500">Checked By</p>
              <p className="text-[11px] font-semibold text-slate-800">Bursar / Accountant</p>
            </div>
            <div>
              <div className="h-8 border-b border-dashed border-slate-300 mb-1" />
              <p className="text-[10px] uppercase font-bold text-slate-500">Authorized By</p>
              <p className="text-[11px] font-semibold text-slate-800">Principal / Super Admin</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Edit Voucher
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
