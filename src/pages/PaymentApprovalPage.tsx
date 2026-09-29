import React, { useState } from "react";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  IndianRupee,
  Smartphone,
  CreditCard,
  Building,
  Eye,
} from "lucide-react";

export interface PaymentApprovalPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  onViewReceipt?: (receipt: any) => void;
}

export const PaymentApprovalPage: React.FC<PaymentApprovalPageProps> = ({
  onShowToast = () => {},
  onViewReceipt = () => {},
}) => {
  const [approvals, setApprovals] = useState([
    { id: "TXN-8801", student: "Ava Thompson", student_id: "STU-1042", grade: "10-A", amount: 1250, method: "UPI / QR", date: "Today, 10:14 AM", ref: "UPI-Ref-9920148", status: "Pending" },
    { id: "TXN-8802", student: "Noah Patel", student_id: "STU-1043", grade: "9-B", amount: 1100, method: "Bank Transfer", date: "Today, 09:30 AM", ref: "Wire-HDFC-00129", status: "Pending" },
    { id: "TXN-8803", student: "Liam Chen", student_id: "STU-1044", grade: "10-A", amount: 625, method: "Online Card", date: "Yesterday, 04:20 PM", ref: "STRIPE-CH-88219", status: "Pending" },
    { id: "TXN-8804", student: "Emma Wilson", student_id: "STU-1045", grade: "8-C", amount: 980, method: "Net Banking", date: "Yesterday, 02:15 PM", ref: "IMPS-Ref-44910", status: "Pending" },
    { id: "TXN-8805", student: "Lucas Miller", student_id: "STU-1047", grade: "9-A", amount: 1250, method: "UPI / QR", date: "Jul 23, 2026", ref: "UPI-Ref-104921", status: "Pending" },
  ]);

  const [search, setSearch] = useState("");

  const handleApprove = (id: string, studentName: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    onShowToast(`Payment ${id} for ${studentName} approved and official receipt dispatched!`, "success");
  };

  const handleReject = (id: string, studentName: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    onShowToast(`Payment ${id} for ${studentName} was rejected/flagged for review.`, "info");
  };

  const filtered = approvals.filter((a) =>
    a.student.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Verification</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{approvals.length} Transactions</h3>
          <p className="text-xs text-slate-400 mt-1">Direct parent online submissions</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Queue Value</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">
            ₹{approvals.reduce((a, b) => a + b.amount, 0).toLocaleString()}.00
          </h3>
          <p className="text-xs text-slate-400 mt-1">Pending ledger balance credit</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Verified Today</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">₹32,100.00</h3>
          <p className="text-xs text-slate-400 mt-1">28 approved transactions</p>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Payment Approvals Queue</h3>
            <p className="text-xs text-slate-400">Review and verify student online and bank transfer receipts</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search txn or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Txn ID & Ref</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    All payment submissions have been approved and reconciled!
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-slate-900">{tx.id}</p>
                      <span className="text-[10px] font-mono text-slate-400">{tx.ref}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{tx.student}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{tx.grade}</td>
                    <td className="px-6 py-4 text-slate-600">{tx.method}</td>
                    <td className="px-6 py-4 font-black text-slate-900">₹{tx.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(tx.id, tx.student)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(tx.id, tx.student)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
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
    </div>
  );
};
