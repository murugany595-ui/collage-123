import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  LayoutDashboard,
  FileText,
  Calendar,
  Plus,
  RefreshCw,
  TrendingDown,
  Scale,
  DollarSign,
  PieChart,
} from "lucide-react";
import { api } from "../../services/api";
import {
  ExpenseItem,
  ExpenseSummary,
  FinancialOverviewData,
} from "../../types";
import { ExpenseOverview } from "../../components/expenses/ExpenseOverview";
import { ExpenseTable } from "../../components/expenses/ExpenseTable";
import { AddExpenseModal } from "../../components/expenses/AddExpenseModal";
import { ExpenseDetailsModal } from "../../components/expenses/ExpenseDetailsModal";
import { MonthlyExpenseReportModal } from "../../components/expenses/MonthlyExpenseReportModal";
import { ExpensePredictionSection } from "../../components/expenses/ExpensePredictionSection";
import { Sparkles } from "lucide-react";

interface ExpenseManagementPageProps {
  onShowToast?: (type: "success" | "error" | "info", title: string, message: string) => void;
}

export const ExpenseManagementPage: React.FC<ExpenseManagementPageProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "prediction" | "expenses">("overview");

  // Data States
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [financialOverview, setFinancialOverview] = useState<FinancialOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters for All Expenses
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

  // Fetch all core expense data
  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [expRes, sumRes, finRes] = await Promise.all([
        api.expenses.getAll(),
        api.expenses.getSummary(),
        api.expenses.getFinancialOverview(),
      ]);

      if (expRes && expRes.success) setExpenses(expRes.data || []);
      if (sumRes && sumRes.success) setSummary(sumRes.data || null);
      if (finRes && finRes.success) setFinancialOverview(finRes.data || null);
    } catch (err: any) {
      console.error("Failed to load expense data:", err);
      const msg = err?.message || "Could not synchronize expense ledger with backend.";
      setLoadError(msg);
      if (onShowToast) {
        onShowToast("error", "Data Error", msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CRUD Handlers for Expenses
  const handleSaveExpense = async (payload: any) => {
    try {
      if (editingExpense) {
        const res = await api.expenses.update(editingExpense.id, payload);
        if (res && res.success) {
          if (onShowToast) onShowToast("success", "Expense Updated", `Voucher ${editingExpense.id} updated successfully.`);
          loadData();
          return true;
        }
      } else {
        const res = await api.expenses.create(payload);
        if (res && res.success) {
          if (onShowToast) onShowToast("success", "Expense Recorded", `New expense voucher logged successfully.`);
          loadData();
          return true;
        }
      }
    } catch (err: any) {
      if (onShowToast) onShowToast("error", "Operation Failed", err.message || "Failed to record expense.");
      throw err;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await api.expenses.delete(id);
      if (res && res.success) {
        if (onShowToast) onShowToast("success", "Expense Deleted", `Voucher ${id} has been removed.`);
        loadData();
      }
    } catch (err: any) {
      if (onShowToast) onShowToast("error", "Delete Failed", err.message || "Failed to remove expense.");
    }
  };

  // Filtered Expenses List for the Table
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const filteredExpenses = safeExpenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      e.title?.toLowerCase().includes(q) ||
      e.paid_to?.toLowerCase().includes(q) ||
      e.id?.toLowerCase().includes(q) ||
      e.reference_no?.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || e.payment_status === selectedStatus;
    const matchesFromDate = !fromDate || e.date >= fromDate;
    const matchesToDate = !toDate || e.date <= toDate;

    return matchesSearch && matchesCategory && matchesStatus && matchesFromDate && matchesToDate;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Page Navigation */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200/60 shadow-2xs">
              Institutional Finance Wing
            </span>
            <span className="text-xs text-slate-400 font-semibold">Admin & Accountant Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Expense Management System
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive audit, expense analytics, budget forecasting, and automated financial balance ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="open-monthly-audit-btn"
            onClick={() => setIsMonthlyReportOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white border border-violet-100 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all hover:scale-102"
          >
            <Calendar className="w-4 h-4 text-violet-600" />
            Monthly Audit Statement
          </button>
          <button
            id="open-add-expense-btn"
            onClick={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            className="px-4.5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 flex items-center gap-2 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Query Error Alert Banner */}
      {loadError && (
        <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <TrendingDown className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-900">Firestore Query Warning</p>
              <p className="text-xs text-rose-700 mt-0.5">{loadError}</p>
            </div>
          </div>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="glass-card p-2 rounded-3xl border border-white/80 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`py-2.5 px-4 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === "overview"
              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
              : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/70"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview & Financial Balance
        </button>

        <button
          onClick={() => setActiveSubTab("prediction")}
          className={`py-2.5 px-4 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === "prediction"
              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
              : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/70"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Monthly Expense Prediction
        </button>

        <button
          onClick={() => setActiveSubTab("expenses")}
          className={`py-2.5 px-4 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === "expenses"
              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
              : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/70"
          }`}
        >
          <FileText className="w-4 h-4" />
          All Expenses Ledger ({(expenses || []).length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === "overview" && (
        <ExpenseOverview
          summary={summary}
          financialOverview={financialOverview}
          expenses={expenses}
          onNavigateTab={(tab) => setActiveSubTab(tab as any)}
          onOpenAddExpense={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}
          onOpenMonthlyReport={() => setIsMonthlyReportOpen(true)}
        />
      )}

      {activeSubTab === "prediction" && (
        <ExpensePredictionSection
          expenses={expenses}
          isLoading={isLoading}
          onRefresh={loadData}
          onOpenAddExpense={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}
        />
      )}

      {activeSubTab === "expenses" && (
        <ExpenseTable
          expenses={filteredExpenses}
          isLoading={isLoading}
          onRefresh={loadData}
          onViewDetails={(exp) => {
            setSelectedExpense(exp);
            setIsDetailsOpen(true);
          }}
          onEdit={(exp) => {
            setEditingExpense(exp);
            setIsAddExpenseOpen(true);
          }}
          onDelete={handleDeleteExpense}
          onAddNew={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
        />
      )}

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
        editingExpense={editingExpense}
      />

      {/* Details / Voucher Modal */}
      <ExpenseDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onEdit={(exp) => {
          setEditingExpense(exp);
          setIsAddExpenseOpen(true);
        }}
      />

      {/* Monthly Expense Report Statement Modal */}
      <MonthlyExpenseReportModal
        isOpen={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
      />
    </div>
  );
};
