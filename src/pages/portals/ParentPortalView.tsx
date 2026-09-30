import React, { useState, useEffect } from "react";
import {
  Users2,
  Calendar,
  CreditCard,
  Award,
  Bell,
  CheckCircle2,
  AlertCircle,
  Download,
  Phone,
  Mail,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studentService, Student } from "../../services/firebase/studentService";
import { feesService } from "../../services/firebase/feesService";

export interface ParentPortalViewProps {
  onCollectFee?: (invoice: any) => void;
  onViewReceipt?: (receipt: any) => void;
  onShowToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  onCollectFee = () => {},
  onViewReceipt = () => {},
  onShowToast = () => {},
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [associatedStudents, setAssociatedStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadParentWardData();
  }, [user?.email, user?.uid]);

  const loadParentWardData = async () => {
    try {
      setLoading(true);
      const all = await studentService.getAllStudents().catch(() => []);

      const parentEmail = (user?.email || "").toLowerCase().trim();
      const parentName = (user?.name || "").toLowerCase().trim();
      const parentStudentId = user?.studentId || "";
      const parentWardName = (user?.wardName || "").toLowerCase().trim();

      // Filter ONLY students associated with this parent
      let wards = all.filter((s) => {
        const sParentEmail = (s.parentEmail || s.guardianEmail || "").toLowerCase().trim();
        const sParentName = (s.parentName || s.guardian || "").toLowerCase().trim();
        const sName = (s.name || "").toLowerCase().trim();
        const sId = s.id || "";

        return (
          (parentEmail && sParentEmail === parentEmail) ||
          (parentStudentId && sId === parentStudentId) ||
          (parentWardName && sName === parentWardName) ||
          (parentName && sParentName && sParentName.includes(parentName))
        );
      });

      setAssociatedStudents(wards);
      const activeWard = wards[0] || null;
      setSelectedStudent(activeWard);

      // Load invoices for this ward
      if (activeWard) {
        const deptFees = await feesService.getFeesByDepartment(activeWard.department).catch(() => []);
        const wardFees = deptFees.filter(
          (f) =>
            f.studentId === activeWard.id ||
            f.studentName?.toLowerCase() === activeWard.name.toLowerCase()
        );
        setInvoices(wardFees);
      } else {
        setInvoices([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWard = async (ward: Student) => {
    setSelectedStudent(ward);
    const deptFees = await feesService.getFeesByDepartment(ward.department).catch(() => []);
    const wardFees = deptFees.filter(
      (f) =>
        f.studentId === ward.id ||
        f.studentName?.toLowerCase() === ward.name.toLowerCase()
    );
    setInvoices(wardFees);
  };

  const currentWard = selectedStudent || associatedStudents[0] || null;

  const outstandingFee = useMemo(() => {
    return invoices
      .filter((inv) => inv.paymentStatus !== "Paid" && inv.status !== "Paid")
      .reduce((sum, inv) => sum + (Number(inv.balance || (inv.amount - (inv.paidAmount || 0)) || inv.amount) || 0), 0);
  }, [invoices]);

  const earliestDue = useMemo(() => {
    const pendingList = invoices.filter((inv) => inv.paymentStatus !== "Paid" && inv.status !== "Paid" && inv.dueDate);
    if (pendingList.length > 0) {
      pendingList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return pendingList[0].dueDate;
    }
    return "No pending due";
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Parent Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-xs">
            Parent / Guardian Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Welcome, {user?.name || "Parent / Guardian"}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Access academic progress, attendance records, and settle college fee billings associated with your account.
          </p>
        </div>

        {/* Associated Children Switcher */}
        {associatedStudents.length > 1 && (
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-xs">
            {associatedStudents.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelectWard(child)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  currentWard?.id === child.id
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-blue-100 hover:bg-white/10"
                }`}
              >
                {child.name} ({child.grade || child.department?.toUpperCase()})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading associated student records...</p>
        </div>
      ) : !currentWard ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-2">
          <p className="text-base font-bold text-slate-700">No Associated Student Ward</p>
          <p className="text-xs font-medium text-slate-400 max-w-md mx-auto">
            No registered student records are currently linked to this parent account. Please contact the college administration to link your student ward.
          </p>
        </div>
      ) : (
        <>
          {/* Child Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Associated Ward</span>
              <h3 className="text-lg font-black text-slate-900 mt-1">{currentWard.name}</h3>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">
                {currentWard.grade || currentWard.department?.toUpperCase() || "Student"} • Roll {currentWard.registerNumber || currentWard.rollNo || currentWard.id}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Invoices</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{invoices.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Generated fee schedules</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Settled Invoices</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {invoices.filter((i) => i.paymentStatus === "Paid" || i.status === "Paid").length}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cleared receipts</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Outstanding Fee</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                ₹{outstandingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{earliestDue}</p>
            </div>
          </div>

          {/* Fee Invoices & Payment Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Fee Invoices & Statements for {currentWard.name}
                </h3>
                <p className="text-xs text-slate-400">Direct online payment with card, UPI or NetBanking</p>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No fee invoices generated yet for this student ward.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoices.map((inv, idx) => {
                  const isPaid = inv.paymentStatus === "Paid" || inv.status === "Paid";
                  const invId = inv.id || `INV-${idx + 1}`;
                  const title = inv.feeType || inv.title || "Tuition Fee";
                  const amount = inv.amount || 0;
                  const dueDate = inv.dueDate || inv.due || "N/A";

                  return (
                    <div key={invId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-700">{invId}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isPaid ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{title}</h4>
                        <p className="text-xs text-slate-400">Due Date: {dueDate}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-slate-900">₹{amount.toFixed(2)}</span>
                        {isPaid ? (
                          <button
                            onClick={() =>
                              onViewReceipt({
                                id: invId,
                                student_name: currentWard.name,
                                grade: currentWard.grade || "B.Tech",
                                amount: amount,
                                date: dueDate,
                                fee_type: title,
                              })
                            }
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onCollectFee({
                                student: currentWard.name,
                                grade: currentWard.grade || "B.Tech",
                                amount: amount,
                                id: invId,
                              })
                            }
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                          >
                            Pay Invoice Online →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default ParentPortalView;
