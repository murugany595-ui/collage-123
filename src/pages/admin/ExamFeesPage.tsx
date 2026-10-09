import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Receipt,
  FileText,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  Building,
  Calendar,
  Layers,
} from "lucide-react";
import { api } from "../../services/api";
import { ExamFeeItem, ExamFeeSummary } from "../../types";

interface ExamFeesPageProps {
  onShowToast?: (type: "success" | "error" | "info", title: string, message: string) => void;
}

export const ExamFeesPage: React.FC<ExamFeesPageProps> = ({ onShowToast }) => {
  const [examFees, setExamFees] = useState<ExamFeeItem[]>([]);
  const [summary, setSummary] = useState<ExamFeeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState("All");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamFeeItem | null>(null);
  const [payingItem, setPayingItem] = useState<ExamFeeItem | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<ExamFeeItem | null>(null);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    student_name: "",
    student_id: "",
    roll: "",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    semester: "Semester 5",
    exam_name: "End Semester Theory & Practical Examinations - Nov/Dec 2026",
    amount: "2400",
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    status: "Pending",
    remarks: "",
  });

  // Form states for Record Payment
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "UPI",
    reference_no: "",
    remarks: "Exam clearance fee settled",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.examFees.getAll({
          q: searchQuery || undefined,
          exam_name: selectedExam !== "All" ? selectedExam : undefined,
          department: selectedDepartment !== "All" ? selectedDepartment : undefined,
          semester: selectedSemester !== "All" ? selectedSemester : undefined,
          status: selectedStatus !== "All" ? selectedStatus : undefined,
        }),
        api.examFees.getSummary(),
      ]);

      if (listRes && listRes.success) {
        setExamFees(listRes.data || []);
      }
      if (sumRes && sumRes.success) {
        setSummary(sumRes.data || null);
      }
    } catch (err: any) {
      console.error("Failed to load exam fees data:", err);
      if (onShowToast) {
        onShowToast("error", "Error", "Failed to load exam fee records.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExam, selectedDepartment, selectedSemester, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      student_name: "",
      student_id: "",
      roll: "",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      semester: "Semester 5",
      exam_name: "End Semester Theory & Practical Examinations - Nov/Dec 2026",
      amount: "2400",
      due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      status: "Pending",
      remarks: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: ExamFeeItem) => {
    setEditingItem(item);
    setFormData({
      student_name: item.student_name,
      student_id: item.student_id,
      roll: item.roll,
      department: item.department,
      year: item.year,
      semester: item.semester,
      exam_name: item.exam_name,
      amount: String(item.amount),
      due_date: item.due_date,
      status: item.status,
      remarks: item.remarks || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveExamFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await api.examFees.update(editingItem.id, {
          ...formData,
          amount: Number(formData.amount),
        });
        if (res && res.success) {
          if (onShowToast) onShowToast("success", "Updated", "Exam fee record updated successfully.");
          setIsAddModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.examFees.create({
          ...formData,
          amount: Number(formData.amount),
        });
        if (res && res.success) {
          if (onShowToast) onShowToast("success", "Created", "Exam fee requirement registered successfully.");
          setIsAddModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      if (onShowToast) onShowToast("error", "Failed", err.message || "Failed to save exam fee record.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exam fee record?")) return;
    try {
      const res = await api.examFees.delete(id);
      if (res && res.success) {
        if (onShowToast) onShowToast("success", "Deleted", "Exam fee record deleted successfully.");
        loadData();
      }
    } catch (err: any) {
      if (onShowToast) onShowToast("error", "Error", "Failed to delete exam fee record.");
    }
  };

  const handleOpenPay = (item: ExamFeeItem) => {
    setPayingItem(item);
    setPaymentData({
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "UPI",
      reference_no: `UPI-EXM-${Date.now().toString().slice(-6)}`,
      remarks: `Exam fee cleared for ${item.exam_name}`,
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;
    try {
      const res = await api.examFees.recordPayment(payingItem.id, paymentData);
      if (res && res.success) {
        if (onShowToast) {
          onShowToast("success", "Payment Recorded", `Receipt ${res.data.receipt_id || "generated"} created successfully.`);
        }
        setPayingItem(null);
        setViewingReceipt(res.data);
        loadData();
      }
    } catch (err: any) {
      if (onShowToast) onShowToast("error", "Error", "Failed to record payment.");
    }
  };

  const handleExportCSV = () => {
    if (!examFees.length) return;
    const headers = ["ID", "Student Name", "Roll", "Dept", "Year", "Semester", "Exam Name", "Amount", "Due Date", "Status", "Payment Date", "Method", "Ref No", "Receipt ID"];
    const rows = examFees.map((e) => [
      e.id,
      `"${e.student_name}"`,
      `"${e.roll}"`,
      `"${e.department}"`,
      `"${e.year}"`,
      `"${e.semester}"`,
      `"${e.exam_name}"`,
      e.amount,
      e.due_date,
      e.status,
      e.payment_date || "-",
      e.payment_method || "-",
      `"${e.reference_no || "-"}"`,
      e.receipt_id || "-",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_fees_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-violet-100/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Exam Fee Management
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1.5 ml-1">
            Create exam fee requirements, track student payments, and generate official exam clearance receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-600 hover:text-violet-600 hover:bg-violet-50/50 transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-violet-600" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Exam Fee
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Exam Fees */}
        <div className="glass-card p-4 rounded-3xl border border-violet-100/60 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Exam Fees</p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4 text-violet-600" />
            {(summary?.totalExamFees || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] font-semibold text-violet-600 mt-1 block">
            {summary?.totalCount || 0} Total Records
          </span>
        </div>

        {/* Collected Exam Fees */}
        <div className="glass-card p-4 rounded-3xl border border-emerald-100/70 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Collected Fees</p>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-1 flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            {(summary?.collectedExamFees || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] font-semibold text-emerald-600 mt-1 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Paid & Cleared
          </span>
        </div>

        {/* Pending Exam Fees */}
        <div className="glass-card p-4 rounded-3xl border border-amber-100/70 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Fees</p>
          <p className="text-lg sm:text-xl font-extrabold text-amber-700 mt-1 flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4 text-amber-600" />
            {(summary?.pendingExamFees || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] font-semibold text-amber-600 mt-1 block flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting Payment
          </span>
        </div>

        {/* Overdue Exam Fees */}
        <div className="glass-card p-4 rounded-3xl border border-rose-100/70 bg-rose-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue Fees</p>
          <p className="text-lg sm:text-xl font-extrabold text-rose-700 mt-1 flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4 text-rose-600" />
            {(summary?.overdueExamFees || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] font-semibold text-rose-600 mt-1 block flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Past Due Date
          </span>
        </div>

        {/* Students Paid */}
        <div className="glass-card p-4 rounded-3xl border border-purple-100/60 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid Students</p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {summary?.countPaid || 0}
          </p>
          <span className="text-[10px] font-semibold text-purple-600 mt-1 block">
            Hall Tickets Ready
          </span>
        </div>

        {/* Students Pending */}
        <div className="glass-card p-4 rounded-3xl border border-purple-100/60 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Students</p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {summary?.countPending || 0}
          </p>
          <span className="text-[10px] font-semibold text-amber-600 mt-1 block">
            Needs Reminder
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-3xl border border-violet-100/60 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, roll number, ID, exam name, receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-white/90 border border-slate-200/80 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all text-slate-800"
            />
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Exam Filter */}
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-2xl bg-white/90 border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
            >
              <option value="All">All Exams</option>
              <option value="End Semester Theory & Practical Examinations - Nov/Dec 2026">End Semester Exams 2026</option>
              <option value="Mid-Term Autonomous Assessment 2026">Mid-Term Assessment</option>
              <option value="First Trimester University Examinations 2026">First Trimester Exams</option>
              <option value="Foundation Programming & Statistics Examination">Foundation Exam</option>
              <option value="Final Year Project Defense & Theory Examination">Project Defense</option>
            </select>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-2xl bg-white/90 border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
            >
              <option value="All">All Departments</option>
              <option value="Artificial Intelligence & Data Science">AI&DS</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Mechanical Engineering">MECH</option>
              <option value="Data Science & AI">Data Science</option>
              <option value="MBA Finance & Management">MBA</option>
            </select>

            {/* Semester Filter */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-2xl bg-white/90 border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
            >
              <option value="All">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 3">Semester 3</option>
              <option value="Semester 5">Semester 5</option>
              <option value="Semester 7">Semester 7</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-2xl bg-white/90 border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="glass-card rounded-3xl border border-violet-100/60 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Exam Fee Ledger ({examFees.length} Records)
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">Student Details</th>
                <th className="py-3.5 px-4 font-bold">Class & Semester</th>
                <th className="py-3.5 px-4 font-bold">Exam Name</th>
                <th className="py-3.5 px-4 font-bold text-right">Amount</th>
                <th className="py-3.5 px-4 font-bold">Due Date</th>
                <th className="py-3.5 px-4 font-bold">Payment Status</th>
                <th className="py-3.5 px-4 font-bold">Payment Info</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {examFees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No exam fee records found matching criteria.
                  </td>
                </tr>
              ) : (
                examFees.map((item) => {
                  const isPaid = item.status === "Paid";
                  const isOverdue = item.status === "Overdue";

                  return (
                    <tr key={item.id} className="hover:bg-violet-50/30 transition-colors group">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                            {item.student_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                              {item.student_name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              Roll: {item.roll} | ID: {item.student_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class / Dept */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-700">{item.department}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {item.year} - {item.semester}
                        </p>
                      </td>

                      {/* Exam Name */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {item.exam_name}
                        </p>
                        {item.remarks && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-1">
                            {item.remarks}
                          </p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-600">
                          {item.due_date}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : isOverdue
                              ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isOverdue ? (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          {item.status}
                        </span>
                      </td>

                      {/* Payment Info */}
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <div>
                            <p className="text-slate-800 font-bold text-[11px]">
                              {item.payment_date} via {item.payment_method}
                            </p>
                            <p className="text-[10px] text-violet-600 font-semibold">
                              Receipt: {item.receipt_id || "Cleared"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenPay(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </button>
                          )}

                          {isPaid && (
                            <button
                              onClick={() => setViewingReceipt(item)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 transition-colors"
                              title="View Official Receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Exam Fee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-violet-100 text-violet-700">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? "Edit Exam Fee Record" : "Add Exam Fee Requirement"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamFee} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                    placeholder="e.g. Liam Chen"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Roll Number / Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roll}
                    onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                    placeholder="e.g. CSE-502"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  >
                    <option value="Artificial Intelligence & Data Science">AI&DS (Artificial Intelligence & Data Science)</option>
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">MECH</option>
                    <option value="Data Science & AI">Data Science</option>
                    <option value="MBA Finance & Management">MBA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Exam Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.exam_name}
                  onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  placeholder="e.g. End Semester Theory & Practical Examinations - Nov/Dec 2026"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Remarks / Papers Breakdown
                </label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  placeholder="e.g. 6 Theory Papers + 2 Practical Labs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700"
                >
                  {editingItem ? "Update Record" : "Save Exam Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-700">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Exam Fee Payment</h3>
                  <p className="text-xs text-slate-500">{payingItem.student_name} ({payingItem.roll})</p>
                </div>
              </div>
              <button
                onClick={() => setPayingItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-violet-50/60 border border-violet-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Exam:</span>
                <span className="font-bold text-slate-800 text-right">{payingItem.exam_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Amount Due:</span>
                <span className="font-extrabold text-violet-700 text-base">₹{Number(payingItem.amount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash Desk</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking / Wire</option>
                    <option value="DD">Demand Draft (DD)</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Transaction / Ref Number
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.reference_no}
                  onChange={(e) => setPaymentData({ ...paymentData, reference_no: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                  placeholder="e.g. UPI-TXN-992104"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirm & Clear Exam Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Exam Clearance Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Printable Receipt Card */}
            <div id="exam-receipt-print" className="p-6 border-2 border-dashed border-violet-200 rounded-3xl bg-violet-50/20 space-y-4">
              <div className="text-center border-b border-violet-100 pb-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white font-extrabold shadow-md mb-2">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  EXAMINATION CLEARANCE RECEIPT
                </h2>
                <p className="text-[11px] font-semibold text-violet-600">
                  Autonomous College Examinations & Assessment Controller
                </p>
              </div>

              <div className="flex justify-between text-xs font-medium text-slate-500 border-b border-slate-100 pb-2">
                <span>Receipt #: <strong className="text-slate-800">{viewingReceipt.receipt_id || "EXR-9001"}</strong></span>
                <span>Date: <strong className="text-slate-800">{viewingReceipt.payment_date || new Date().toISOString().slice(0, 10)}</strong></span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-800">{viewingReceipt.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Roll / ID:</span>
                  <span className="font-bold text-slate-800">{viewingReceipt.roll} ({viewingReceipt.student_id})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="font-bold text-slate-800">{viewingReceipt.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Year / Semester:</span>
                  <span className="font-bold text-slate-800">{viewingReceipt.year} - {viewingReceipt.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Exam Name:</span>
                  <span className="font-bold text-slate-800 text-right max-w-[240px]">{viewingReceipt.exam_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Mode / Ref:</span>
                  <span className="font-bold text-slate-800">{viewingReceipt.payment_method || "UPI"} ({viewingReceipt.reference_no || "EXM-SETTLED"})</span>
                </div>
              </div>

              <div className="pt-3 border-t border-violet-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Exam Fee Paid:</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  ₹{Number(viewingReceipt.amount).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                OFFICIALLY CLEARED FOR HALL TICKET & EXAMINATIONS
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-2">
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
