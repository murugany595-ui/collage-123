import React, { useState, useEffect } from "react";
import { X, CreditCard, Banknote, Building, Smartphone, CheckCircle, AlertCircle, IndianRupee, Receipt } from "lucide-react";
import { api } from "../../services/api";

export interface CollectFeeModalProps {
  isOpen?: boolean;
  invoice: any | null;
  onClose?: () => void;
  onSuccess?: (receipt?: any) => void;
}

export const CollectFeeModal: React.FC<CollectFeeModalProps> = ({
  isOpen = true,
  invoice,
  onClose = () => {},
  onSuccess = () => {},
}) => {
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [method, setMethod] = useState<"Card" | "UPI" | "Bank Transfer" | "Cash">("Card");
  const [referenceNote, setReferenceNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getDueAmount = () => {
    if (!invoice) return 0;
    if (invoice.pending_amount !== undefined) return Number(invoice.pending_amount);
    if (invoice.balance !== undefined) {
      return typeof invoice.balance === "number"
        ? invoice.balance
        : parseFloat(String(invoice.balance).replace(/[^0-9.]/g, "")) || 0;
    }
    const rawTotal = invoice.amount !== undefined ? invoice.amount : (invoice.total || 0);
    return typeof rawTotal === "number" ? rawTotal : parseFloat(String(rawTotal).replace(/[^0-9.]/g, "")) || 0;
  };

  const dueAmount = getDueAmount();
  const totalAmount = invoice ? (typeof invoice.amount === "number" ? invoice.amount : (parseFloat(String(invoice.amount || invoice.total || 0).replace(/[^0-9.]/g, "")) || dueAmount)) : 0;
  const previouslyPaid = invoice ? (Number(invoice.paid_amount || (totalAmount - dueAmount)) || 0) : 0;

  const currentPayingAmount = paymentType === "full" ? dueAmount : (parseFloat(customAmount) || 0);
  const remainingPendingAfterPayment = Math.max(0, dueAmount - currentPayingAmount);

  useEffect(() => {
    if (invoice) {
      setPaymentType("full");
      setCustomAmount(dueAmount > 0 ? String(Math.round(dueAmount / 2)) : "0");
      setReferenceNote("");
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

  if (!invoice || isOpen === false) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPayingAmount <= 0) {
      setError("Please enter a payment amount greater than ₹0.00");
      return;
    }
    if (currentPayingAmount > dueAmount + 0.01) {
      setError(`Payment amount cannot exceed the pending due of ₹${dueAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const studentId = invoice.student_id || invoice.studentId || invoice.id || "STU-1042";
      const invoiceId = invoice.id || invoice.invoice_id || "";
      const studentName = invoice.student || invoice.name || invoice.student_name || "Ava Thompson";
      const grade = invoice.grade || "B.Tech CSE - Sem 5";
      const category = invoice.category || invoice.type || invoice.fee_type || "Tuition & Academic Term Fee";

      const res = await api.fees.collect({
        student_id: studentId,
        invoice_id: invoiceId,
        amount: currentPayingAmount,
        method: method,
        reference_note: referenceNote,
        student_name: studentName,
        grade: grade,
        category: category,
      });

      if (res.success) {
        const receiptData = res.receipt || {
          id: res.receipt_id || `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
          payment_id: res.payment_id || `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
          invoice_id: invoiceId,
          student_id: studentId,
          student_name: studentName,
          grade: grade,
          amount: currentPayingAmount,
          fee_type: category,
          date: new Date().toISOString().slice(0, 10),
          payment_method: method,
          reference_note: referenceNote,
        };
        onSuccess(receiptData);
        onClose();
      } else {
        setError(res.message || "Failed to collect fee payment.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process payment.");
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
        id="collect-fee-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] transform-gpu transition-all duration-200 scale-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-300" />
              <h3 className="font-black text-white text-base sm:text-lg">Collect Fee Payment</h3>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Invoice #{invoice.id || "Direct Receipt"} • {invoice.student || invoice.name || invoice.student_name || "Student"}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/15 active:scale-90 active:bg-white/25 rounded-lg transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
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

          {/* Student & Fee Snapshot Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Profile</span>
                <p className="font-bold text-slate-900 text-sm">{invoice.student || invoice.name || invoice.student_name}</p>
                <span className="text-xs text-slate-500">{invoice.grade || "B.Tech CSE - Sem 5"}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Category</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">{invoice.category || invoice.type || "Tuition & Lab Fee"}</p>
              </div>
            </div>

            {/* Financial Ledger Breakdown: Total = Paid + Pending */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Invoice</span>
                <span className="text-xs sm:text-sm font-black text-slate-800">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-emerald-600 font-semibold block">Paid So Far</span>
                <span className="text-xs sm:text-sm font-black text-emerald-600">₹{previouslyPaid.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 bg-amber-50/40 shadow-2xs">
                <span className="text-[10px] text-amber-700 font-semibold block">Pending Due</span>
                <span className="text-xs sm:text-sm font-black text-amber-700">₹{dueAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Type: Full vs Partial */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Payment Option</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                  paymentType === "full"
                    ? "border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-600/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <div>
                  <span className="block">Pay Full Due</span>
                  <span className="text-[11px] font-normal text-slate-500">Clear entire balance</span>
                </div>
                <span className="font-black text-sm text-emerald-600">₹{dueAmount.toFixed(2)}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("partial")}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                  paymentType === "partial"
                    ? "border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-600/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <div>
                  <span className="block">Custom Installment</span>
                  <span className="text-[11px] font-normal text-slate-500">Partial payment</span>
                </div>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Custom Amount input if Partial selected */}
          {paymentType === "partial" && (
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
              <label className="block text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>Enter Paying Amount (₹)</span>
                <span className="text-[11px] text-amber-700 font-normal">Max due: ₹{dueAmount.toFixed(2)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={dueAmount}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 font-bold text-slate-900 bg-white"
                  placeholder="e.g. 500.00"
                  required
                />
              </div>
              <div className="flex items-center justify-between text-xs text-amber-900 pt-1">
                <span>Remaining balance after payment:</span>
                <span className="font-black text-amber-800">₹{remainingPendingAfterPayment.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "Card", label: "Card POS", icon: <CreditCard className="w-4 h-4" /> },
                { id: "UPI", label: "UPI / QR", icon: <Smartphone className="w-4 h-4" /> },
                { id: "Bank Transfer", label: "Net Banking", icon: <Building className="w-4 h-4" /> },
                { id: "Cash", label: "Cash Desk", icon: <Banknote className="w-4 h-4" /> },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition gap-1.5 ${
                    method === m.id
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  <span className={method === m.id ? "text-emerald-600" : "text-slate-400"}>{m.icon}</span>
                  <span className="text-[11px] whitespace-nowrap">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reference / Transaction Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Transaction Ref / Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. UPI Ref #889210, Card Approval #4412, Cheque #00129"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || currentPayingAmount <= 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm & Issue Receipt (₹{currentPayingAmount.toFixed(2)})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
