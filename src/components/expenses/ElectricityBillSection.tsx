import React, { useState } from "react";
import {
  Zap,
  Plus,
  Search,
  Download,
  Calendar,
  IndianRupee,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Activity,
  Building2,
  Trash2,
  Edit2,
  Eye,
  FileText,
  Upload,
  X,
  Gauge,
} from "lucide-react";
import { ElectricityBillItem } from "../../types";

interface ElectricityBillSectionProps {
  bills: ElectricityBillItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateBill: (data: any) => Promise<boolean | void>;
  onUpdateBill: (id: string, data: any) => Promise<boolean | void>;
  onDeleteBill: (id: string) => Promise<boolean | void>;
}

export const ElectricityBillSection: React.FC<ElectricityBillSectionProps> = ({
  bills,
  isLoading,
  onRefresh,
  onCreateBill,
  onUpdateBill,
  onDeleteBill,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<ElectricityBillItem | null>(null);
  const [editingBill, setEditingBill] = useState<ElectricityBillItem | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Form State
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [ebConsumerNumber, setEbConsumerNumber] = useState("EB-9482014-LT");
  const [meterLocation, setMeterLocation] = useState("Main Academic Substation & Classrooms");
  const [previousReading, setPreviousReading] = useState<string>("84200");
  const [currentReading, setCurrentReading] = useState<string>("89650");
  const [billAmount, setBillAmount] = useState<string>("38500");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automated Unit Consumption Calculation
  const prevNum不易 = Number(previousReading) || 0;
  const currNum不易 = Number(currentReading) || 0;
  const calculatedUnits = Math.max(0, currNum不易 - prevNum不易);

  const meterPresets = [
    { location: "Main Academic Substation & Classrooms", ebNo: "EB-9482014-LT", prev: 84200, curr: 89650, amount: 38500 },
    { location: "Computer Science & AI Server Complex", ebNo: "EB-9482015-HT", prev: 112400, curr: 118900, amount: 46200 },
    { location: "Hostel Blocks (A & B) Power Substation", ebNo: "EB-9482016-LT", prev: 63100, curr: 67300, amount: 28400 },
    { location: "Central Administrative Complex & Auditorium", ebNo: "EB-9482017-LT", prev: 42300, curr: 45100, amount: 19800 },
  ];

  const handleSelectPreset = (p: typeof meterPresets[0]) => {
    setMeterLocation(p.location);
    setEbConsumerNumber(p.ebNo);
    setPreviousReading(String(p.prev));
    setCurrentReading(String(p.curr));
    setBillAmount(String(p.amount));
  };

  const handleOpenCreateModal進 = () => {
    setEditingBill(null);
    handleSelectPreset(meterPresets[0]);
    setBillingMonth(new Date().toISOString().slice(0, 7));
    setDueDate(new Date().toISOString().slice(0, 10));
    setPaidDate(new Date().toISOString().slice(0, 10));
    setPaymentStatus("Paid");
    setReceiptName(null);
    setReceiptUrl(null);
    setRemarks("Verified with meter reading logs and board tariff invoice.");
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (b: ElectricityBillItem) => {
    setEditingBill(b);
    setBillingMonth(b.billing_month);
    setEbConsumerNumber(b.eb_consumer_number);
    setMeterLocation(b.meter_location || "");
    setPreviousReading(String(b.previous_reading));
    setCurrentReading(String(b.current_reading));
    setBillAmount(String(b.bill_amount));
    setDueDate(b.due_date);
    setPaidDate(b.paid_date || new Date().toISOString().slice(0, 10));
    setPaymentStatus(b.payment_status);
    setReceiptName(b.bill_receipt_name || null);
    setReceiptUrl(b.bill_receipt_url || null);
    setRemarks(b.remarks || "");
    setFormErrors({});
    setModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      setReceiptUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!ebConsumerNumber.trim()) errs.ebConsumerNumber = "EB consumer number is required";
    if (!previousReading || isNaN(prevNum不易) || prevNum不易 < 0) errs.previousReading = "Valid previous reading required";
    if (!currentReading || isNaN(currNum不易) || currNum不易 < 0) errs.currentReading = "Valid current reading required";
    if (currNum不易 < prevNum不易) errs.currentReading = "Current reading cannot be less than previous reading";
    if (!billAmount || isNaN(Number(billAmount)) || Number(billAmount) <= 0) errs.billAmount = "Valid positive bill amount required";

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        billing_month: billingMonth,
        eb_consumer_number: ebConsumerNumber.trim(),
        previous_reading: prevNum不易,
        current_reading: currNum不易,
        units_consumed: calculatedUnits,
        bill_amount: Number(billAmount),
        due_date: dueDate,
        paid_date: paymentStatus === "Paid" ? paidDate : null,
        payment_status: paymentStatus,
        bill_receipt_name: receiptName,
        bill_receipt_url: receiptUrl,
        meter_location: meterLocation,
        remarks: remarks.trim(),
      };

      if (editingBill) {
        await onUpdateBill(editingBill.id, payload);
      } else {
        await onCreateBill(payload);
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormErrors({ form: err.message || "Failed to save electricity bill record" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const q不易 = searchQuery.toLowerCase();
    const matchesQ =
      !q不易 ||
      b.eb_consumer_number?.toLowerCase().includes(q不易) ||
      b.meter_location?.toLowerCase().includes(q不易) ||
      b.id?.toLowerCase().includes(q不易);
    const matchesMonth = !selectedMonth || b.billing_month === selectedMonth;
    return matchesQ && matchesMonth;
  });

  const totalBillAmount = filteredBills.reduce((sum, b) => sum + Number(b.bill_amount || 0), 0);
  const totalUnitsConsumed = filteredBills.reduce((sum, b) => sum + Number(b.units_consumed || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-xs uppercase font-bold tracking-wider text-amber-600">
              Electricity & Energy Sub-Module
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            College Electricity & Power Bill Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track substation meter readings, automated kWh unit consumption, power tariffs, and sync with central expenses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal進}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Electricity Bill
          </button>
        </div>
      </div>

      {/* 2. Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Electricity Outflow
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalBillAmount.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{filteredBills.length} meter connection bills in view</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Energy Consumption (kWh)
          </span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {totalUnitsConsumed.toLocaleString("en-IN")} Units
          </h3>
          <p className="text-xs text-amber-600 mt-0.5 font-medium">Automated Current − Previous reading math</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Average Tariff Rate
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {totalUnitsConsumed > 0 ? `₹${(totalBillAmount / totalUnitsConsumed).toFixed(2)} / kWh` : "₹7.10 / kWh"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Commercial Institutional HT/LT tariff tier</p>
        </div>
      </div>

      {/* 3. Search & Month Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search EB Consumer Number, meter location, voucher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-hidden"
          />
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedMonth("");
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 4. EB Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Consumer & Location</th>
                <th className="py-3.5 px-4">Billing Month</th>
                <th className="py-3.5 px-4">Previous Reading</th>
                <th className="py-3.5 px-4">Current Reading</th>
                <th className="py-3.5 px-4">Units Consumed</th>
                <th className="py-3.5 px-4">Bill Amount</th>
                <th className="py-3.5 px-4">Status & Dates</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading electricity bills...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Zap className="w-7 h-7 text-slate-300" />
                      <p className="font-bold text-slate-700">No electricity bill records found</p>
                      <p className="text-[11px] text-slate-400">Click "Add Electricity Bill" to record meter readings</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900">{bill.eb_consumer_number}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{bill.meter_location}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {bill.billing_month}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {Number(bill.previous_reading).toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900 font-bold">
                      {Number(bill.current_reading).toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                        {Number(bill.units_consumed).toLocaleString()} Units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 text-sm">
                        ₹{Number(bill.bill_amount).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          bill.payment_status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {bill.payment_status === "Paid" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                        )}
                        {bill.payment_status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Due: {bill.due_date} {bill.paid_date ? `• Paid: ${bill.paid_date}` : ""}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="View Bill Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(bill)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Bill"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteBill(bill.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit Bill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {editingBill ? "Edit Electricity Bill Record" : "Record Electricity Bill & Meter Readings"}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Automated Unit Consumption: Current Reading − Previous Reading
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBill} className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto">
              {/* Presets */}
              {!editingBill && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Campus Substation Meter
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {meterPresets.map((p) => (
                      <button
                        key={p.ebNo}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                          ebConsumerNumber === p.ebNo
                            ? "bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <p className="font-semibold truncate">{p.location}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.ebNo}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Consumer Number & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    EB Consumer / Service Connection # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ebConsumerNumber}
                    onChange={(e) => setEbConsumerNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-200"
                  />
                  {formErrors.ebConsumerNumber && <p className="text-xs text-rose-600 mt-1">{formErrors.ebConsumerNumber}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Meter Location
                  </label>
                  <input
                    type="text"
                    value={meterLocation}
                    onChange={(e) => setMeterLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Automated Reading & Units Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-600" />
                    Meter Readings & Automated Consumption
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-700">Units = Current − Previous</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Previous Reading (kWh) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={previousReading}
                      onChange={(e) => setPreviousReading(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-200"
                    />
                    {formErrors.previousReading && <p className="text-xs text-rose-600 mt-1">{formErrors.previousReading}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Current Reading (kWh) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={currentReading}
                      onChange={(e) => setCurrentReading(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-200"
                    />
                    {formErrors.currentReading && <p className="text-xs text-rose-600 mt-1">{formErrors.currentReading}</p>}
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">Automated Units Consumed:</span>
                  <span className="text-lg font-black text-amber-900 font-mono">
                    {calculatedUnits.toLocaleString("en-IN")} kWh Units
                  </span>
                </div>
              </div>

              {/* Bill Amount & Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bill Amount (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-bold text-slate-900 focus:bg-white"
                    />
                  </div>
                  {formErrors.billAmount && <p className="text-xs text-rose-600 mt-1">{formErrors.billAmount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Billing Month <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Due Date, Paid Date, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-bold text-slate-800 focus:bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Paid Date
                  </label>
                  <input
                    type="date"
                    disabled={paymentStatus !== "Paid"}
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Upload EB Bill Copy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attach Electricity Board Bill Copy
                </label>
                <div className="border border-dashed border-slate-300 rounded-xl p-3.5 text-center bg-slate-50/50 relative hover:bg-slate-100/60 cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-slate-400" />
                    {receiptName ? (
                      <span className="text-xs font-bold text-emerald-600">Attached: {receiptName}</span>
                    ) : (
                      <span className="text-xs text-slate-600">Upload official board invoice (PDF, JPG)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingBill ? "Update Electricity Bill" : "Save & Sync with Expenses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Bill Details Modal */}
      {viewModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Electricity Bill Voucher</h3>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] text-amber-800 uppercase font-bold block">Bill Amount</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  ₹{Number(selectedBill.bill_amount).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-amber-800 font-bold font-mono mt-1 inline-block">
                  {Number(selectedBill.units_consumed).toLocaleString()} kWh Energy Units
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block">Consumer #</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedBill.eb_consumer_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Billing Month</span>
                  <span className="font-bold text-slate-900">{selectedBill.billing_month}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-bold block">Meter Substation Location</span>
                  <span className="font-semibold text-slate-800">{selectedBill.meter_location}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400 font-sans font-bold block">Previous Reading</span>
                  <span className="text-slate-700">{Number(selectedBill.previous_reading).toLocaleString()} kWh</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-bold block">Current Reading</span>
                  <span className="text-slate-900 font-bold">{Number(selectedBill.current_reading).toLocaleString()} kWh</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 text-slate-700">
                <span>Payment Status: <strong className="text-emerald-700">{selectedBill.payment_status}</strong></span>
                <span>Due: {selectedBill.due_date}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
