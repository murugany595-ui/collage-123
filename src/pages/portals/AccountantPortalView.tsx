import React, { useState } from "react";
import {
  Calculator,
  IndianRupee,
  Plus,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  ArrowUpRight,
  TrendingUp,
  Receipt,
} from "lucide-react";

export interface AccountantPortalViewProps {
  onCollectFee?: (invoice: any) => void;
  onCreateInvoice?: () => void;
  onViewReceipt?: (receipt: any) => void;
  onNavigate?: (tab: string) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const AccountantPortalView: React.FC<AccountantPortalViewProps> = ({
  onCollectFee = () => {},
  onCreateInvoice = () => {},
  onViewReceipt = () => {},
  onNavigate = () => {},
  onShowToast = () => {},
}) => {
  const [quickStudent, setQuickStudent] = useState("");

  const recentTransactions = [
    { id: "REC-9012", student: "Ava Thompson", grade: "B.Tech CSE - Sem 5", amount: 1250, method: "UPI QR", time: "10:14 AM", cashier: "Rita Álvarez" },
    { id: "REC-9011", student: "Noah Patel", grade: "B.Tech ECE - Sem 3", amount: 1100, method: "Cash Desk", time: "09:40 AM", cashier: "Rita Álvarez" },
    { id: "REC-9010", student: "Emma Wilson", grade: "MBA Finance - Sem 1", amount: 980, method: "Card POS", time: "09:12 AM", cashier: "Rita Álvarez" },
    { id: "REC-9009", student: "Lucas Miller", grade: "B.Tech MECH - Sem 7", amount: 1250, method: "Cash Desk", time: "08:50 AM", cashier: "Rita Álvarez" },
  ];

  const handleQuickCollect = () => {
    if (!quickStudent) {
      onShowToast("Please enter a student name or ID", "error");
      return;
    }
    onCollectFee({
      student: quickStudent,
      grade: "B.Tech CSE - Sem 5",
      amount: 1250,
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-xs">
            Accountant & Finance Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Cash & Fee Collection Terminal</h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Logged in as <strong>Rita Álvarez</strong> (Lead Bursar). Cash register balance: <strong className="text-white">₹4,580.00</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate("expenses")}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Manage Expenses</span>
          </button>
          <button
            onClick={() => onCollectFee({})}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Collect Fee</span>
          </button>
          <button
            onClick={onCreateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Today's Collections</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">₹14,580.00</h3>
          <p className="text-xs text-slate-400 mt-1">18 receipts settled today</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Physical Cash in Drawer</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">₹4,580.00</h3>
          <p className="text-xs text-slate-400 mt-1">Counter balance</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Pending Approvals</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">14 Online Txns</h3>
          <p className="text-xs text-slate-400 mt-1">Awaiting ledger credit</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Month-to-Date Revenue</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">₹48,500.00</h3>
          <p className="text-xs text-slate-400 mt-1">84.5% target achieved</p>
        </div>
      </div>

      {/* Quick Collect Box & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Counter Quick Collection */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            Quick Counter Receipting
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Name or ID</label>
              <input
                type="text"
                placeholder="e.g. STU-1042 or Ava Thompson"
                value={quickStudent}
                onChange={(e) => setQuickStudent(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              onClick={handleQuickCollect}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Open Instant Collect Window →
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => onNavigate("payment-approval")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
            >
              <span>Verify Online Submissions (14)</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigate("generate-monthly-fees")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
            >
              <span>Batch Generate Monthly Invoices</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Today's Fee Register</h3>
              <p className="text-xs text-slate-400">Live journal of cleared cash desk and online receipts</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print Register
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-700">{tx.id}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {tx.student} <span className="text-slate-400 font-normal">({tx.grade})</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{tx.method}</td>
                    <td className="px-4 py-3.5 font-black text-emerald-600">₹{tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-slate-400">{tx.time}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() =>
                          onViewReceipt({
                            id: tx.id,
                            student_name: tx.student,
                            grade: tx.grade,
                            amount: tx.amount,
                            date: "2026-08-14",
                            fee_type: "Term Tuition & Lab Fee",
                          })
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px]"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
