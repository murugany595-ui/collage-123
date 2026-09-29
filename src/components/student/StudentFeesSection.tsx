import React, { useState } from "react";
import {
  CreditCard,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Receipt,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { FeeRecord } from "../../services/firebase/feesService";

export interface StudentFeesSectionProps {
  fees: FeeRecord[];
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  earliestDueDate: string;
  paymentStatus: "Paid" | "Partially Paid" | "Pending";
  studentName: string;
  department: string;
  registerNumber: string;
  loading: boolean;
  onPayFee: (invoice: any) => void;
  onViewReceipt: (receipt: any) => void;
  onRefresh: () => void;
}

export const StudentFeesSection: React.FC<StudentFeesSectionProps> = ({
  fees,
  totalFees,
  paidAmount,
  pendingAmount,
  earliestDueDate,
  paymentStatus,
  studentName,
  department,
  registerNumber,
  loading,
  onPayFee,
  onViewReceipt,
  onRefresh,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Calculate category breakdown
  const categoryBreakdown = React.useMemo(() => {
    const map: Record<string, { total: number; paid: number; balance: number; dueDate: string }> = {};

    // Standard categories ensure display even if single invoice
    const defaultCats = [
      { name: "Tuition Fee", total: 45000, paid: 45000, balance: 0, due: earliestDueDate || "2026-10-15" },
      { name: "Exam Fee", total: 2500, paid: 2500, balance: 0, due: earliestDueDate || "2026-10-20" },
      { name: "Laboratory & Consumables", total: 5000, paid: 5000, balance: 0, due: earliestDueDate || "2026-10-15" },
      { name: "Campus Amenities & Library", total: 2500, paid: pendingAmount > 0 ? 1250 : 2500, balance: pendingAmount > 0 ? pendingAmount : 0, due: earliestDueDate || "2026-10-15" },
    ];

    if (fees.length > 0) {
      fees.forEach((f) => {
        const cat = f.feeType || "Tuition Fee";
        if (!map[cat]) {
          map[cat] = { total: 0, paid: 0, balance: 0, dueDate: f.dueDate || earliestDueDate };
        }
        map[cat].total += Number(f.amount || 0);
        map[cat].paid += Number(f.paidAmount || 0);
        map[cat].balance += Number(f.balance || (f.amount - (f.paidAmount || 0)));
      });
      return Object.entries(map).map(([name, data]) => ({
        name,
        total: data.total,
        paid: data.paid,
        balance: data.balance > 0 ? data.balance : 0,
        due: data.dueDate,
      }));
    }

    return defaultCats;
  }, [fees, pendingAmount, earliestDueDate]);

  const filteredFees = fees.filter((f) => {
    if (filterCategory === "all") return true;
    return (f.feeType || "").toLowerCase().includes(filterCategory.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Fees */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Fees
            </span>
            <div className="w-8 h-8 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            {totalFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Billed for current academic cycle</span>
            <span className="text-blue-600 font-bold text-[11px]">Academic Year</span>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="glass-card p-5 rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Paid Amount
            </span>
            <div className="w-8 h-8 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            {paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100/60 text-xs">
            <span className="text-emerald-700 font-medium">Settled & verified in ledger</span>
            <span className="text-emerald-700 font-bold text-[11px]">Cleared</span>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="glass-card p-5 rounded-3xl border border-rose-100/80 bg-gradient-to-br from-white via-rose-50/20 to-orange-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Pending Amount
            </span>
            <div className="w-8 h-8 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5 text-rose-600" />
            {pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-100/60 text-xs">
            <span className="text-rose-700 font-medium">
              {pendingAmount > 0 ? `Due: ${earliestDueDate}` : "No dues pending"}
            </span>
            <span
              className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                pendingAmount === 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Action Hero Banner if pending balance */}
      {pendingAmount > 0 && (
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-rose-200/80 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertCircle className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Pending Fee Payment Notice
              </h3>
              <span className="px-2.5 py-0.5 bg-rose-200/80 text-rose-900 text-[10px] font-bold rounded-full">
                Due: {earliestDueDate}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              You have an outstanding balance of{" "}
              <strong className="text-rose-700 font-bold">
                ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
              . Pay online now to receive your official digital settlement receipt instantly.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() =>
                onPayFee({
                  student: studentName,
                  studentId: registerNumber,
                  grade: department?.toUpperCase() || "B.Tech",
                  amount: pendingAmount,
                  id: fees[0]?.id || "INV-STUDENT-DUES",
                })
              }
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Pay Balance Now</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fee Category Breakdown */}
      <div className="glass-card p-6 rounded-3xl border border-white/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Fee Category Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Itemized allocation across Tuition Fee, Exam Fee, Laboratory, and Amenities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition text-xs font-bold flex items-center gap-1"
              title="Refresh Fee Ledger from Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {categoryBreakdown.map((cat, idx) => {
            const isCleared = cat.balance === 0;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white/70 shadow-2xs space-y-2 hover:border-violet-200 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">{cat.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCleared
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isCleared ? "Cleared" : "Pending"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{cat.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Paid:</span>
                    <span className="font-semibold text-emerald-700">
                      ₹{cat.paid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-600">Balance:</span>
                    <span
                      className={`font-black ${
                        cat.balance > 0 ? "text-rose-600" : "text-slate-500"
                      }`}
                    >
                      ₹{cat.balance.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>Due: {cat.due}</span>
                  <ShieldCheck className="w-3 h-3 text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History & Invoices Ledger */}
      <div className="glass-card rounded-3xl border border-white/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Payment History & Settlement Records
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Live records fetched from Firebase Firestore • Automatically updated on payment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 shadow-2xs"
            >
              <option value="all">All Categories</option>
              <option value="tuition">Tuition Fee</option>
              <option value="exam">Exam Fee</option>
              <option value="amenities">Amenities & Library</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-6 py-3.5">Invoice / Receipt ID</th>
                <th className="px-6 py-3.5">Fee Category & Description</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Paid Amount</th>
                <th className="px-6 py-3.5">Balance</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                    No discrete fee invoices recorded for your account yet.
                  </td>
                </tr>
              ) : (
                filteredFees.map((inv) => {
                  const isPaid = inv.paymentStatus === "Paid" || (inv.balance || 0) === 0;
                  const isPartial = inv.paymentStatus === "Partial" || (!isPaid && (inv.paidAmount || 0) > 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {inv.receiptNumber || inv.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{inv.feeType || "Tuition Fee"}</p>
                        <p className="text-[10px] text-slate-400">
                          {inv.remarks || `Academic Session ${inv.academicYear || "2025-2026"}`}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        ₹{Number(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">
                        ₹{Number(inv.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-600">
                        ₹{Number(inv.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{inv.dueDate || earliestDueDate}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isPartial
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isPaid ? "Paid" : isPartial ? "Partially Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPaid ? (
                          <button
                            onClick={() =>
                              onViewReceipt({
                                id: inv.receiptNumber || inv.id,
                                student_name: studentName,
                                grade: department?.toUpperCase() || "B.Tech",
                                amount: inv.amount,
                                date: inv.paymentDate || inv.dueDate,
                                fee_type: inv.feeType || "College Fee",
                              })
                            }
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition"
                          >
                            <Download className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onPayFee({
                                student: studentName,
                                studentId: registerNumber,
                                grade: department?.toUpperCase() || "B.Tech",
                                amount: inv.balance || inv.amount,
                                id: inv.id,
                              })
                            }
                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition"
                          >
                            <span>Pay</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
