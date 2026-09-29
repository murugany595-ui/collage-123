import React, { useState, useEffect } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Calendar, IndianRupee, Tag, User, FileText, CreditCard } from "lucide-react";
import { EXPENSE_CATEGORIES, ExpenseItem } from "../../types";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean | void>;
  editingExpense?: ExpenseItem | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingExpense = null,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Stationery Expenses");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
  const [paidTo, setPaidTo] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string>("Paid");
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title || "");
      setCategory(editingExpense.category || "Stationery Expenses");
      setAmount(String(editingExpense.amount || ""));
      setDate(editingExpense.date || new Date().toISOString().slice(0, 10));
      setPaymentMethod(editingExpense.payment_method || "Bank Transfer");
      setPaidTo(editingExpense.paid_to || "");
      setPaymentStatus(editingExpense.payment_status || "Paid");
      setReferenceNo(editingExpense.reference_no || "");
      setDescription(editingExpense.description || "");
      setReceiptName(editingExpense.receipt_name || null);
      setReceiptUrl(editingExpense.receipt_url || null);
    } else {
      setTitle("");
      setCategory("Stationery Expenses");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod("Bank Transfer");
      setPaidTo("");
      setPaymentStatus("Paid");
      setReferenceNo(`REF-${Date.now().toString().slice(-6)}`);
      setDescription("");
      setReceiptName(null);
      setReceiptUrl(null);
    }
    setErrors({});
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      // Create local object URL for preview
      const fakeUrl = URL.createObjectURL(file);
      setReceiptUrl(fakeUrl);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Expense title is required";
    }
    if (!category) {
      newErrors.category = "Please select a valid expense category";
    }
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = "Please enter a valid positive amount (₹)";
    }
    if (!date) {
      newErrors.date = "Expense date is required";
    }
    if (!paidTo.trim()) {
      newErrors.paidTo = "Paid To / Vendor Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        amount: Number(amount),
        date,
        payment_method: paymentMethod,
        paid_to: paidTo.trim(),
        payment_status: paymentStatus,
        reference_no: referenceNo.trim() || `REF-${Date.now().toString().slice(-6)}`,
        description: description.trim(),
        receipt_name: receiptName,
        receipt_url: receiptUrl,
      };
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to record expense" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="add-expense-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {editingExpense ? "Edit Expense Record" : "Record New College Expense"}
              </h2>
              <p className="text-xs text-slate-300">
                {editingExpense ? `Updating voucher ${editingExpense.id}` : "Log college financial expenditure with category attribution"}
              </p>
            </div>
          </div>
          <button
            id="close-expense-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto">
          {errors.form && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="expense-title-input"
                  type="text"
                  placeholder="e.g. Lab Chemicals & Glassware"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    errors.title
                      ? "border-rose-300 focus:ring-rose-200"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
              </div>
              {errors.title && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="expense-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.category}</p>}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                <input
                  id="expense-amount-input"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    errors.amount
                      ? "border-rose-300 focus:ring-rose-200"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="expense-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
              {errors.date && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.date}</p>}
            </div>
          </div>

          {/* Paid To & Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Paid To / Vendor Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="expense-paid-to-input"
                type="text"
                placeholder="e.g. Apex Scientific Supplies Ltd"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.paidTo
                    ? "border-rose-300 focus:ring-rose-200"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
              {errors.paidTo && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.paidTo}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                id="expense-payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="UPI / Net Banking">UPI / Net Banking</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash Voucher</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          {/* Payment Status & Reference No */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus("Paid")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentStatus === "Paid"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus("Pending")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentStatus === "Pending"
                      ? "bg-amber-50 border-amber-300 text-amber-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Pending
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reference / Cheque / UTR #
              </label>
              <input
                id="expense-reference-input"
                type="text"
                placeholder="e.g. UTR-9827104928"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              id="expense-description-input"
              rows={2}
              placeholder="Provide context, invoice number, department authorization or procurement reason..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Receipt Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Bill / Receipt Attachment (PDF, PNG, JPG)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer relative">
              <input
                id="expense-receipt-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <Upload className="w-5 h-5 text-slate-400" />
                {receiptName ? (
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Attached: {receiptName}
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-700">
                      Click to upload invoice or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              id="cancel-expense-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-expense-modal-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : editingExpense ? (
                "Update Expense Record"
              ) : (
                "Save Expense Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
