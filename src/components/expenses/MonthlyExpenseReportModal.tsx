import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  Calendar,
  IndianRupee,
  Building2,
  PieChart,
  Scale,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { EXPENSE_CATEGORIES } from "../../types";
import { api } from "../../services/api";

interface MonthlyExpenseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyExpenseReportModal: React.FC<MonthlyExpenseReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReport(selectedMonth);
    }
  }, [isOpen, selectedMonth]);

  const loadReport = async (month: string) => {
    setIsLoading(true);
    try {
      const res = await api.expenses.getMonthlyReport(month);
      if (res && res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error("Failed to load monthly report", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const feesCollected = reportData?.financialSummary?.feesCollected || 0;
  const totalExpenses = reportData?.financialSummary?.totalExpenses || 0;
  const netBalance = reportData?.financialSummary?.netBalance || 0;
  const isSurplus不易 = netBalance >= 0;

  const categoryBreakdown = reportData?.categoryBreakdown || [];

  const handleExportCSV = () => {
    const headers = ["Category", "Total Amount (INR)", "Vouchers Logged", "Share (%)"];
    const rows不易 = categoryBreakdown.map((c: any) => [
      `"${c.category}"`,
      c.amount,
      c.count,
      `"${c.percentage}%"`,
    ]);
    const summaryRow = [
      `"TOTAL EXPENSES"`,
      totalExpenses,
      reportData?.totalExpensesCount || 0,
      `"100%"`,
    ];
    const netRow = [
      `"NET FINANCIAL BALANCE (Fees - Expenses)"`,
      netBalance,
      "-",
      "-",
    ];

    const csv = "data:text/csv;charset=utf-8," + [
      `"COLLEGE MONTHLY EXPENSE AUDIT REPORT - ${selectedMonth}"`,
      headers.join(","),
      ...rows不易.map((r: any) => r.join(",")),
      summaryRow.join(","),
      netRow.join(","),
    ].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Monthly_Expense_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="monthly-expense-report-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Monthly College Expense & Financial Audit
              </h2>
              <p className="text-xs text-slate-300">Audited institutional ledger & operating balance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Month Selector Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Audit Period:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-hidden"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Academic Fiscal Year 2026–2027
            </span>
          </div>

          {/* Institutional Header (Printable) */}
          <div className="text-center border-b border-slate-200 pb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-blue-700" />
              <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Our College of Engineering & Technology
              </h1>
            </div>
            <p className="text-xs text-slate-500">Autonomous • Approved by AICTE • Affiliated to Anna University</p>
            <p className="text-xs font-bold text-blue-700 mt-1 uppercase">
              Financial & Operating Statement for Month of {selectedMonth}
            </p>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium">Compiling institutional monthly audit...</p>
            </div>
          ) : (
            <>
              {/* Financial Balance Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Total Fees Collected
                  </span>
                  <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
                    ₹{feesCollected.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400">Total verified tuition & fees</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Total Expenses Outflow
                  </span>
                  <span className="text-xl font-extrabold text-rose-400 mt-0.5 block">
                    ₹{totalExpenses.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400">{reportData?.totalExpensesCount || 0} vouchers paid</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Net Operating Balance
                  </span>
                  <span className={`text-xl font-extrabold mt-0.5 block ${isSurplus不易 ? "text-blue-300" : "text-amber-400"}`}>
                    {isSurplus不易 ? "+" : "-"}₹{Math.abs(netBalance).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400">Fees − Total Expenses</span>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  Category-Wise Expenditure Breakdown
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Expense Category</th>
                        <th className="py-2.5 px-3 text-center">Vouchers</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-3 text-right">Share of Outflow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            No expenses recorded for the month of {selectedMonth}
                          </td>
                        </tr>
                      ) : (
                        categoryBreakdown.map((cat: any) => (
                          <tr key={cat.category} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {cat.category}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                              {cat.count}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              ₹{Number(cat.amount).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                                {cat.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                      {/* Total Row */}
                      <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                        <td className="py-3 px-3 uppercase">Total Institutional Expenditure</td>
                        <td className="py-3 px-3 text-center font-mono">{reportData?.totalExpensesCount || 0}</td>
                        <td className="py-3 px-3 text-right text-sm">₹{totalExpenses.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3 text-right">100.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sign-off Blocks */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-500">Finance & Accounts Officer</p>
                  <p className="text-[11px] font-semibold text-slate-800">Verified by Clerk</p>
                </div>

                <div>
                  <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-500">Internal Audit Committee</p>
                  <p className="text-[11px] font-semibold text-slate-800">Bursar / CA</p>
                </div>

                <div>
                  <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-500">Principal / Executive Trustee</p>
                  <p className="text-[11px] font-semibold text-slate-800">Final Approval</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
