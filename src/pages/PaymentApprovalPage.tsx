import React, { useState, useEffect } from "react";
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
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { requestService } from "../services/firebase/requestService";
import { feesService } from "../services/firebase/feesService";

export interface PaymentApprovalItem {
  id: string;
  student: string;
  student_id?: string;
  grade?: string;
  amount: number;
  method: string;
  date: string;
  ref: string;
  status: "Pending" | "Approved" | "Rejected";
  departmentId?: string;
  feeId?: string;
}

export interface PaymentApprovalPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  onViewReceipt?: (receipt: any) => void;
}

export const PaymentApprovalPage: React.FC<PaymentApprovalPageProps> = ({
  onShowToast = () => {},
  onViewReceipt = () => {},
}) => {
  const [approvals, setApprovals] = useState<PaymentApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedTodayCount, setVerifiedTodayCount] = useState(0);
  const [verifiedTodayAmount, setVerifiedTodayAmount] = useState(0);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const items: PaymentApprovalItem[] = [];

      // 1. Fetch from payment_approvals collection
      const snap = await getDocs(collection(db, "payment_approvals")).catch(() => null);
      if (snap && !snap.empty) {
        snap.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as any) });
        });
      }

      // 2. Fetch from requests collection where category is payment_issue
      const requests = await requestService.getAllRequests().catch(() => []);
      for (const req of requests) {
        if (req.category === "payment_issue" && !items.some((i) => i.id === req.id)) {
          items.push({
            id: req.id,
            student: req.studentName || "Student",
            student_id: req.studentId || req.userId,
            grade: req.department || req.year || "N/A",
            amount: Number(req.amount) || 0,
            method: "Online Transfer",
            date: req.paymentDate || req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Recent",
            ref: req.paymentReference || req.id,
            status: req.status === "Approved" ? "Approved" : req.status === "Rejected" ? "Rejected" : "Pending",
          });
        }
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const approvedToday = items.filter(
        (a) => a.status === "Approved" && (a.date.includes(todayStr) || a.date.includes("Today"))
      );
      setVerifiedTodayCount(approvedToday.length);
      setVerifiedTodayAmount(approvedToday.reduce((acc, a) => acc + (a.amount || 0), 0));

      setApprovals(items);
    } catch (err) {
      console.error("Error loading approvals:", err);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, studentName: string) => {
    try {
      const item = approvals.find((a) => a.id === id);
      if (item?.departmentId && item?.feeId) {
        await feesService.collectFeePayment({
          departmentId: item.departmentId,
          feeId: item.feeId,
          amount: item.amount,
          method: item.method || "Online",
          referenceNote: `Approved online payment: ${item.ref}`,
        });
      }

      // Try updating in payment_approvals or requests
      try {
        await updateDoc(doc(db, "payment_approvals", id), {
          status: "Approved",
          approvedAt: new Date().toISOString(),
        });
      } catch {
        await requestService.updateRequestStatus(id, { status: "Approved" }).catch(() => {});
      }

      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Approved" } : a))
      );
      setVerifiedTodayCount((prev) => prev + 1);
      setVerifiedTodayAmount((prev) => prev + (item?.amount || 0));
      onShowToast(`Payment ${id} for ${studentName} approved and official receipt dispatched!`, "success");
    } catch (err: any) {
      console.error("Failed to approve payment:", err);
      onShowToast(err.message || "Failed to approve payment", "error");
    }
  };

  const handleReject = async (id: string, studentName: string) => {
    try {
      try {
        await updateDoc(doc(db, "payment_approvals", id), {
          status: "Rejected",
          rejectedAt: new Date().toISOString(),
        });
      } catch {
        await requestService.updateRequestStatus(id, { status: "Rejected" }).catch(() => {});
      }

      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a))
      );
      onShowToast(`Payment ${id} for ${studentName} was rejected/flagged for review.`, "info");
    } catch (err: any) {
      console.error("Failed to reject payment:", err);
      onShowToast(err.message || "Failed to reject payment", "error");
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === "Pending");
  const filtered = pendingApprovals.filter(
    (a) =>
      a.student.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Verification</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingApprovals.length} Transactions</h3>
          <p className="text-xs text-slate-400 mt-1">Direct parent online submissions</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Queue Value</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">
            ₹{pendingApprovals.reduce((a, b) => a + (b.amount || 0), 0).toLocaleString()}.00
          </h3>
          <p className="text-xs text-slate-400 mt-1">Pending ledger balance credit</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Verified Today</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            ₹{verifiedTodayAmount.toLocaleString()}.00
          </h3>
          <p className="text-xs text-slate-400 mt-1">{verifiedTodayCount} approved transactions</p>
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Loading payment approvals queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No pending payment approvals found. All transactions are reconciled.
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
