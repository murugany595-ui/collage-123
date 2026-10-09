import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

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
  const { user } = useAuth();
  const [quickStudent, setQuickStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayCollections: 0,
    todayCount: 0,
    cashDrawer: 0,
    pendingApprovalsCount: 0,
    mtdRevenue: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const loadAccountantData = async () => {
      try {
        setLoading(true);
        const [historyRes, finRes] = await Promise.all([
          api.fees.getPaymentsHistory({ limit: 10 }).catch(() => ({ data: [] })),
          api.expenses.getFinancialOverview().catch(() => null),
        ]);

        if (!isMounted) return;

        const txList = (historyRes?.data || []).map((f: any) => ({
          id: f.receiptNumber || f.id || `REC-${f.id?.slice(-4)}`,
          student: f.studentName || "Student",
          grade: f.department?.toUpperCase() || "General",
          amount: Number(f.paidAmount || f.amount || 0),
          method: f.paymentMethod || "Cash Desk",
          time: f.paymentDate ? new Date(f.paymentDate).toLocaleDateString("en-IN") : "Today",
          cashier: user?.name || "Accountant",
          dueDate: f.dueDate || "",
          feeType: f.feeType || "Tuition Fee",
        }));

        setRecentTransactions(txList);

        const totalRevenue = finRes?.totalFeesCollected || txList.reduce((acc: number, t: any) => acc + t.amount, 0);
        const todayTotal = txList.slice(0, 5).reduce((acc: number, t: any) => acc + t.amount, 0);

        setStats({
          todayCollections: todayTotal,
          todayCount: txList.length,
          cashDrawer: todayTotal,
          pendingApprovalsCount: 0,
          mtdRevenue: totalRevenue,
        });
      } catch (err) {
        console.warn("Could not load accountant portal data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAccountantData();
    return () => {
      isMounted = false;
    };
  }, [user?.name]);

  const handleQuickCollect = () => {
    if (!quickStudent.trim()) {
      onShowToast("Please enter a student name or ID", "error");
      return;
    }
    onCollectFee({
      student: quickStudent.trim(),
      amount: 0,
      id: `INV-${Date.now().toString().slice(-4)}`,
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
            Logged in as <strong>{user?.name || "Accountant"}</strong> ({user?.designation || "Finance Office"}).
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
            onClick={() => onNavigate("financial-analytics")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Financial Analytics</span>
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
        <div className="glass-card glass-card-hover liquid-specular p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Collections</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
            ₹{stats.todayCollections.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">{stats.todayCount} transactions recorded</p>
        </div>
        <div className="glass-card glass-card-hover liquid-specular p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash in Register</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            ₹{stats.cashDrawer.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Active collection sum</p>
        </div>
        <div className="glass-card glass-card-hover liquid-specular p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1 tabular-nums">{stats.pendingApprovalsCount} Online Txns</h3>
          <p className="text-xs text-slate-400 mt-1">Awaiting verification</p>
        </div>
        <div className="glass-card glass-card-hover liquid-specular p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Month-to-Date Revenue</span>
          <h3 className="text-2xl font-black text-indigo-600 mt-1 tabular-nums">
            ₹{stats.mtdRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Total revenue collected</p>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Name or Register No</label>
              <input
                type="text"
                placeholder="e.g. 21AD045 or Student Name"
                value={quickStudent}
                onChange={(e) => setQuickStudent(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              onClick={handleQuickCollect}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Open Instant Collect Window →
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => onNavigate("financial-analytics")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-xs font-bold text-indigo-900 border border-indigo-100 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Financial Analytics & Trends</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={() => onNavigate("payment-approval")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <span>Verify Online Submissions</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigate("generate-monthly-fees")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Register
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading ledger records...</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No payment transactions recorded in Firestore yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
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
                              date: tx.time,
                              fee_type: tx.feeType,
                            })
                          }
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] cursor-pointer"
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantPortalView;
