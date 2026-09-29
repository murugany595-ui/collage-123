import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Send,
  Printer,
  GraduationCap,
  CalendarCheck,
  Receipt,
  Scale,
  CreditCard,
  CheckCircle2,
  Clock,
  Zap,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { api } from "../services/api";

export interface ReportsPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  onCollectFee?: (invoice: any) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  onShowToast = () => {},
  onCollectFee = () => {},
}) => {
  const [activeReportTab, setActiveReportTab] = useState<"statement" | "fees" | "exams" | "expenses" | "attendance">("statement");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("Academic Year 2025-2026");

  const [financialData, setFinancialData] = useState<any>(null);
  const [examSummary, setExamSummary] = useState<any>(null);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [finRes, examRes, expRes, attRes] = await Promise.allSettled([
        api.expenses.getFinancialOverview(),
        api.examFees.getSummary(),
        api.expenses.getSummary(),
        api.attendance.getSummary(),
      ]);

      if (finRes.status === "fulfilled" && finRes.value?.success) setFinancialData(finRes.value.data);
      if (examRes.status === "fulfilled" && examRes.value?.success) setExamSummary(examRes.value.data);
      if (expRes.status === "fulfilled" && expRes.value?.success) setExpenseSummary(expRes.value.data);
      if (attRes.status === "fulfilled" && attRes.value?.success) setAttendanceSummary(attRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const totalFees = financialData?.totalFeesCollected || 5125.0;
  const examFees = examSummary?.collectedExamFees || 10000.0;
  const totalExpenses = financialData?.totalExpenses || 47650.0;
  const netBalance = totalFees + examFees - totalExpenses;

  // Monthly breakdown
  const monthlyData = [
    { month: "Jan", fees: 45000, exams: 8000, expenses: 28000 },
    { month: "Feb", fees: 48000, exams: 9500, expenses: 29500 },
    { month: "Mar", fees: 52000, exams: 12000, expenses: 31000 },
    { month: "Apr", fees: 54000, exams: 11000, expenses: 30000 },
    { month: "May", fees: 49000, exams: 7000, expenses: 32000 },
    { month: "Jun", fees: 58000, exams: 10000, expenses: 34000 },
    { month: "Jul", fees: 62000, exams: 14000, expenses: 35500 },
    { month: "Aug", fees: 65000, exams: 10000, expenses: 36800 },
  ];

  // Department fee collection
  const deptFeeData = [
    { dept: "Computer Science", collected: 18500, pending: 2400 },
    { dept: "Electronics (ECE)", collected: 14200, pending: 3100 },
    { dept: "Mechanical Eng", collected: 11800, pending: 1900 },
    { dept: "Data Science & AI", collected: 16400, pending: 2800 },
    { dept: "MBA Management", collected: 19200, pending: 1500 },
  ];

  // Expense categories
  const expenseCatData = [
    { name: "Staff Salary", amount: 34500, pct: "72.4%" },
    { name: "Electricity Bills", amount: 3750, pct: "7.9%" },
    { name: "Water & Maintenance", amount: 2800, pct: "5.9%" },
    { name: "Internet / Wi-Fi", amount: 2400, pct: "5.0%" },
    { name: "Laboratory & Chemicals", amount: 2200, pct: "4.6%" },
    { name: "Stationary & Office", amount: 1200, pct: "2.5%" },
    { name: "Security & Housekeeping", amount: 800, pct: "1.7%" },
  ];

  const handleExportCSV = () => {
    let csvData = "";
    if (activeReportTab === "statement") {
      csvData = "Metric,Amount (INR)\nTotal Student Fees Collected," + totalFees + "\nTotal Exam Fees Collected," + examFees + "\nTotal Institutional Expenses," + totalExpenses + "\nNet Operating Balance," + netBalance;
    } else if (activeReportTab === "expenses") {
      csvData = "Expense Category,Amount (INR),Share\n" + expenseCatData.map(e => `"${e.name}",${e.amount},${e.pct}`).join("\n");
    } else {
      csvData = "Department,Collected (INR),Pending (INR)\n" + deptFeeData.map(d => `"${d.dept}",${d.collected},${d.pending}`).join("\n");
    }

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `college_${activeReportTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Exported ${activeReportTab.toUpperCase()} report to CSV.`, "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-violet-100/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institutional Reports & Balance Sheet
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1.5 ml-1">
            Official financial statements, revenue vs expense reconciliation, exam fee audits, and attendance metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={loadReportData}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-600 hover:text-violet-600 hover:bg-violet-50/50 transition-colors shadow-xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-violet-600" : ""}`} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Module Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-3xl bg-slate-100/80 border border-slate-200/80">
        <button
          onClick={() => setActiveReportTab("statement")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeReportTab === "statement"
              ? "bg-white text-violet-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale className="w-4 h-4" />
          Financial Statement
        </button>

        <button
          onClick={() => setActiveReportTab("fees")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeReportTab === "fees"
              ? "bg-white text-violet-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Tuition Fees Report
        </button>

        <button
          onClick={() => setActiveReportTab("exams")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeReportTab === "exams"
              ? "bg-white text-violet-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Exam Fees Audit
        </button>

        <button
          onClick={() => setActiveReportTab("expenses")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeReportTab === "expenses"
              ? "bg-white text-violet-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Institutional Expenses
        </button>

        <button
          onClick={() => setActiveReportTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeReportTab === "attendance"
              ? "bg-white text-violet-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Attendance Metrics
        </button>
      </div>

      {/* Content for Financial Statement */}
      {activeReportTab === "statement" && (
        <div className="space-y-6">
          {/* 4 Summary Balance Sheet Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-emerald-100/80 bg-emerald-50/20">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                1. Total Tuition Fees Collected
              </p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1 flex items-center gap-0.5">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                {totalFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                Primary Revenue Inflow
              </span>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-violet-100/80 bg-violet-50/20">
              <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">
                2. Exam Fees Collected
              </p>
              <p className="text-2xl font-extrabold text-violet-800 mt-1 flex items-center gap-0.5">
                <IndianRupee className="w-5 h-5 text-violet-600" />
                {examFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-violet-600 font-semibold mt-1 block">
                Examination Cell Clearance
              </span>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-pink-100/80 bg-pink-50/20">
              <p className="text-[11px] font-bold text-pink-700 uppercase tracking-wider">
                3. Total Institutional Expenses
              </p>
              <p className="text-2xl font-extrabold text-pink-800 mt-1 flex items-center gap-0.5">
                <IndianRupee className="w-5 h-5 text-pink-600" />
                {totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-pink-600 font-semibold mt-1 block">
                Payroll, EB, Maintenance, Labs
              </span>
            </div>

            <div className="glass-card p-5 rounded-3xl border-2 border-violet-300 bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-md">
              <p className="text-[11px] font-bold text-violet-200 uppercase tracking-wider">
                4. Net Operating Balance
              </p>
              <p className="text-2xl font-extrabold text-white mt-1 flex items-center gap-0.5">
                <IndianRupee className="w-5 h-5 text-white" />
                {netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-violet-100 font-medium mt-1 block">
                Fees + Exam Fees − Expenses
              </span>
            </div>
          </div>

          {/* Balance Statement Breakdown Table */}
          <div className="glass-card rounded-3xl border border-violet-100/60 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                Institutional Financial Balance Sheet (Audit Summary)
              </h2>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl">
                Audited Term 2025-2026
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-bold">Accounting Category</th>
                  <th className="py-3.5 px-6 font-bold">Type</th>
                  <th className="py-3.5 px-6 font-bold text-right">Amount (₹)</th>
                  <th className="py-3.5 px-6 font-bold">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-violet-50/20">
                  <td className="py-3.5 px-6 font-bold text-slate-800">Student Tuition & Regular Fees</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-700">Revenue Inflow</td>
                  <td className="py-3.5 px-6 font-extrabold text-slate-900 text-right">₹{totalFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-6"><span className="text-emerald-700 font-bold">Reconciled</span></td>
                </tr>
                <tr className="hover:bg-violet-50/20">
                  <td className="py-3.5 px-6 font-bold text-slate-800">Autonomous University Exam Fees</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-700">Revenue Inflow</td>
                  <td className="py-3.5 px-6 font-extrabold text-slate-900 text-right">₹{examFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-6"><span className="text-emerald-700 font-bold">Cleared</span></td>
                </tr>
                <tr className="hover:bg-violet-50/20">
                  <td className="py-3.5 px-6 font-bold text-slate-800">Faculty & Staff Salaries (Payroll)</td>
                  <td className="py-3.5 px-6 font-bold text-rose-700">Expenditure</td>
                  <td className="py-3.5 px-6 font-extrabold text-slate-900 text-right">₹34,500.00</td>
                  <td className="py-3.5 px-6"><span className="text-slate-600 font-bold">Paid via Bank</span></td>
                </tr>
                <tr className="hover:bg-violet-50/20">
                  <td className="py-3.5 px-6 font-bold text-slate-800">Campus Electricity (EB) Bills</td>
                  <td className="py-3.5 px-6 font-bold text-rose-700">Expenditure</td>
                  <td className="py-3.5 px-6 font-extrabold text-slate-900 text-right">₹3,750.00</td>
                  <td className="py-3.5 px-6"><span className="text-slate-600 font-bold">Paid to TNEB</span></td>
                </tr>
                <tr className="hover:bg-violet-50/20">
                  <td className="py-3.5 px-6 font-bold text-slate-800">Other Departmental & Maintenance Expenses</td>
                  <td className="py-3.5 px-6 font-bold text-rose-700">Expenditure</td>
                  <td className="py-3.5 px-6 font-extrabold text-slate-900 text-right">₹9,400.00</td>
                  <td className="py-3.5 px-6"><span className="text-slate-600 font-bold">Logged</span></td>
                </tr>
                <tr className="bg-violet-50/40 font-bold border-t-2 border-violet-200">
                  <td className="py-4 px-6 text-sm text-violet-900">NET INSTITUTIONAL OPERATING SURPLUS / BALANCE</td>
                  <td className="py-4 px-6 text-violet-700">Formula Result</td>
                  <td className="py-4 px-6 text-base font-extrabold text-violet-900 text-right">₹{netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-6 text-violet-700 font-extrabold">Final Verified</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content for Tuition Fees Report */}
      {activeReportTab === "fees" && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-violet-100/60 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Department-wise Tuition Fee Collections</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptFeeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="dept" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "10px", fontSize: "11px", fontWeight: 700 }} />
                  <Bar name="Collected Fees" dataKey="collected" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  <Bar name="Pending Fees" dataKey="pending" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Content for Exam Fees Audit */}
      {activeReportTab === "exams" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-violet-100">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Exam Requirements</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{(examSummary?.totalExamFees || 14600).toLocaleString("en-IN")}</p>
              <span className="text-xs font-semibold text-violet-600 mt-1 block">8 Registered Students</span>
            </div>
            <div className="glass-card p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20">
              <p className="text-xs font-bold text-emerald-700 uppercase">Exam Fees Collected</p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">₹{(examSummary?.collectedExamFees || 10000).toLocaleString("en-IN")}</p>
              <span className="text-xs font-semibold text-emerald-600 mt-1 block">Hall Tickets Released</span>
            </div>
            <div className="glass-card p-5 rounded-3xl border border-rose-100 bg-rose-50/20">
              <p className="text-xs font-bold text-rose-700 uppercase">Pending Exam Fees</p>
              <p className="text-2xl font-extrabold text-rose-800 mt-1">₹{(examSummary?.pendingExamFees || 4600).toLocaleString("en-IN")}</p>
              <span className="text-xs font-semibold text-rose-600 mt-1 block">Requires Clearance</span>
            </div>
          </div>
        </div>
      )}

      {/* Content for Institutional Expenses */}
      {activeReportTab === "expenses" && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl border border-violet-100/60 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                13 Institutional Expense Categories Breakdown
              </h2>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-bold">Category</th>
                  <th className="py-3.5 px-6 font-bold text-right">Amount (₹)</th>
                  <th className="py-3.5 px-6 font-bold text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseCatData.map((e, idx) => (
                  <tr key={idx} className="hover:bg-violet-50/20">
                    <td className="py-3.5 px-6 font-bold text-slate-800">{e.name}</td>
                    <td className="py-3.5 px-6 font-extrabold text-slate-900 text-right">₹{e.amount.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-6 font-bold text-violet-700 text-right">{e.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content for Attendance Metrics */}
      {activeReportTab === "attendance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-violet-100">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Working Days</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{attendanceSummary?.totalWorkingDays || 12} Days</p>
              <span className="text-xs font-semibold text-violet-600 mt-1 block">Current Term</span>
            </div>
            <div className="glass-card p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20">
              <p className="text-xs font-bold text-emerald-700 uppercase">Average Attendance</p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">{attendanceSummary?.attendancePercentage || 92.4}%</p>
              <span className="text-xs font-semibold text-emerald-600 mt-1 block">(Present / Working Days) × 100</span>
            </div>
            <div className="glass-card p-5 rounded-3xl border border-purple-100">
              <p className="text-xs font-bold text-purple-700 uppercase">Students Above 75% Cutoff</p>
              <p className="text-2xl font-extrabold text-purple-800 mt-1">96.8%</p>
              <span className="text-xs font-semibold text-purple-600 mt-1 block">Eligible for Exams</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
