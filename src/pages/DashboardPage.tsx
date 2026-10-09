import React, { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  IndianRupee,
  CreditCard,
  Clock,
  Sparkles,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Tag,
  PieChart as PieChartIcon,
  BarChart3,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  ChevronRight,
  Building2,
  Receipt,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ExpenseItem } from "../types";
import {
  calculateExpensePrediction,
  ExpensePredictionResult,
} from "../services/expensePredictionService";
import { expenseService, AdminExpense } from "../services/firebase/expenseService";
import { staffService, Staff } from "../services/firebase/staffService";
import { AddExpenseModal } from "../components/expenses/AddExpenseModal";
import { ExpenseDetailsModal } from "../components/expenses/ExpenseDetailsModal";
import { MonthlyExpenseReportModal } from "../components/expenses/MonthlyExpenseReportModal";
import { DashboardSkeleton } from "../components/skeletons";

export interface DashboardPageProps {
  onNavigate?: (tab: string, studentId?: string) => void;
  onCollectFee?: (invoice: any) => void;
  onViewReceipt?: (receipt: any) => void;
}

// Visual colors for category charts
const CATEGORY_COLORS = [
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#64748B", // Slate
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate = () => {},
  onCollectFee = () => {},
  onViewReceipt = () => {},
}) => {
  const { user } = useAuth();

  // Core Data States from Firebase
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Month & Category Filters for Dashboard Analytics
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState<string>("2026-09");
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState<string>("All");

  // Filters for Recent Expenses Table
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState<boolean>(false);

  // 1. Initial Load & Real-Time Firestore Subscription
  useEffect(() => {
    let unsubscribeExpenses: (() => void) | null = null;
    let unsubscribeStaff: (() => void) | null = null;

    const initData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        // Initial fetch
        const [initialExpenses, initialStaffs] = await Promise.all([
          expenseService.getAdminExpenses(),
          staffService.getAllStaff().catch(() => []),
        ]);
        setExpenses(initialExpenses);
        setStaffs(initialStaffs);

        // Real-time listener on expenses: automatically recalculates analytics on add, edit, or delete
        unsubscribeExpenses = expenseService.subscribeAdminExpenses(
          (liveList) => {
            setExpenses(liveList);
            setLoadError(null);
          },
          (err) => {
            console.error("Live adminExpenses sync error:", err);
            setLoadError(err?.message || "Failed to sync real-time expense records from Firestore.");
          }
        );

        // Real-time listener on staffs: updates staff count and salary commitments
        unsubscribeStaff = staffService.subscribeStaff((liveStaffs) => {
          setStaffs(liveStaffs);
        });
      } catch (err: any) {
        console.error("Could not load initial admin data from Firestore:", err);
        setLoadError(err?.message || "Failed to load expense records from Firestore. Please check database permissions or network.");
      } finally {
        setLoading(false);
      }
    };

    initData();

    return () => {
      if (unsubscribeExpenses) unsubscribeExpenses();
      if (unsubscribeStaff) unsubscribeStaff();
    };
  }, []);

  // 2. Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const refreshed = await expenseService.getAdminExpenses();
      setExpenses(refreshed);
      showNotice("Ledger synchronized with Firebase Firestore.", "success");
    } catch (err: any) {
      const msg = err?.message || "Network or permission error while reading Firestore.";
      setLoadError(msg);
      showNotice("Failed to sync expenses: " + msg, "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const showNotice = (message: string, type: "success" | "error" = "success") => {
    setActionNotice({ message, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  // 3. Compute Analytics & Next Month Expense Prediction Dynamically from Live Data
  const analytics: ExpensePredictionResult = useMemo(() => {
    return calculateExpensePrediction(expenses);
  }, [expenses]);

  // Extract structured metrics
  const {
    hasEnoughData,
    dataStatus,
    algorithmUsed,
    totalExpenses,
    totalVoucherCount,
    currentMonthName,
    currentMonthExpense,
    previousMonthName,
    previousMonthExpense,
    expenseGrowthPercentage,
    growthDirection,
    nextMonthName,
    predictedNextMonthExpense,
    differenceAmount,
    percentageChange,
    trendDirection,
    trendText,
    explanation,
    confidenceLevel,
    confidenceBadge,
    highestCategory,
    monthlyHistory = [],
    categoryBreakdown = [],
    monthlyTrendChartData = [],
    actualVsPredictedChartData = [],
    insights = [],
    summaryNote,
  } = analytics;

  // 4. Modal Handlers
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsAddExpenseOpen(true);
  };

  const handleEdit = (exp: AdminExpense) => {
    setEditingExpense(exp as any);
    setIsAddExpenseOpen(true);
  };

  const handleView = (exp: AdminExpense) => {
    setSelectedExpense(exp as any);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete expense voucher "${title}"? This will immediately recalculate all predictive models.`)) {
      return;
    }

    try {
      await api.expenses.delete(id);
      showNotice(`Expense "${title}" removed from Firebase. Analytics recalculated.`, "success");
    } catch (err: any) {
      showNotice(`Failed to delete expense: ${err?.message || "Permission error"}`, "error");
    }
  };

  const handleModalSubmit = async (data: any) => {
    try {
      if (editingExpense) {
        await api.expenses.update(editingExpense.id, data);
        showNotice("Expense voucher updated in Firebase.", "success");
      } else {
        await api.expenses.create(data);
        showNotice("New expense voucher logged. Prediction models updated.", "success");
      }
      setIsAddExpenseOpen(false);
      setEditingExpense(null);
    } catch (err: any) {
      alert("Failed to save expense: " + (err?.message || "Validation error"));
    }
  };

  // 5. Filter Recent Expenses Table
  const filteredRecentExpenses = useMemo(() => {
    let list = [...expenses];
    if (selectedCategoryFilter !== "All") {
      list = list.filter((e) => e.category === selectedCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.paid_to?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.reference_no?.toLowerCase().includes(q) ||
          e.id?.toLowerCase().includes(q)
      );
    }
    // Sort descending by date
    return list.sort((a, b) => {
      const dateA = a.date || a.createdAt || "";
      const dateB = b.date || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });
  }, [expenses, selectedCategoryFilter, searchQuery]);

  // Extract unique categories present in the actual data for the filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Extract all distinct months present in the data for the month filter dropdown
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const m = e.month || (e.date ? e.date.slice(0, 7) : null);
      if (m && /^\d{4}-\d{2}$/.test(m)) set.add(m);
    });
    if (set.size === 0) set.add("2026-09");
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Selected Month Analytics for Requirement 3
  const selectedMonthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const m = e.month || (e.date ? e.date.slice(0, 7) : "");
      const matchesMonth = selectedDashboardMonth === "All" || m === selectedDashboardMonth;
      const matchesCat = selectedDashboardCategory === "All" || e.category === selectedDashboardCategory;
      return matchesMonth && matchesCat;
    });
  }, [expenses, selectedDashboardMonth, selectedDashboardCategory]);

  const selectedMonthTotal = useMemo(() => {
    return selectedMonthExpenses.reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);
  }, [selectedMonthExpenses]);

  const selectedMonthSalaryTotal = useMemo(() => {
    return expenses
      .filter((e) => {
        const m = e.month || (e.date ? e.date.slice(0, 7) : "");
        const matchesMonth = selectedDashboardMonth === "All" || m === selectedDashboardMonth;
        return matchesMonth && e.category === "Staff Salary";
      })
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);
  }, [expenses, selectedDashboardMonth]);

  const selectedMonthElectricity = useMemo(() => {
    return expenses
      .filter((e) => {
        const m = e.month || (e.date ? e.date.slice(0, 7) : "");
        const matchesMonth = selectedDashboardMonth === "All" || m === selectedDashboardMonth;
        return matchesMonth && (e.category === "Electricity" || e.category === "Electricity Bill");
      })
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);
  }, [expenses, selectedDashboardMonth]);

  const selectedMonthWaterUtility = useMemo(() => {
    return expenses
      .filter((e) => {
        const m = e.month || (e.date ? e.date.slice(0, 7) : "");
        const matchesMonth = selectedDashboardMonth === "All" || m === selectedDashboardMonth;
        return matchesMonth && (e.category === "Water & Utilities" || e.category === "Water and Utilities" || e.category?.toLowerCase().includes("water"));
      })
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);
  }, [expenses, selectedDashboardMonth]);

  const selectedMonthMaintenance = useMemo(() => {
    return expenses
      .filter((e) => {
        const m = e.month || (e.date ? e.date.slice(0, 7) : "");
        const matchesMonth = selectedDashboardMonth === "All" || m === selectedDashboardMonth;
        return matchesMonth && e.category === "Maintenance";
      })
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);
  }, [expenses, selectedDashboardMonth]);

  const selectedMonthStationery = useMemo(() => {
    return expenses
      .filter((e) => {
        const m = e.month || (e.date ? e.date.slice(0, 7) : "");
        const matchesMonth = selectedDashboardMonth === "All" || m === selectedDashboardMonth;
        return matchesMonth && e.category === "Stationery";
      })
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);
  }, [expenses, selectedDashboardMonth]);

  const selectedMonthInternetIt = useMemo(() => {
    return expenses
      .filter((e) => {
        const m = e.month || (e.date ? e.date.slice(0, 7) : "");
        const matchesMonth = selectedDashboardMonth === "All" || m === selectedDashboardMonth;
        return matchesMonth && (e.category === "Internet & IT" || e.category === "Internet and IT");
      })
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);
  }, [expenses, selectedDashboardMonth]);

  const liveStaffCount = staffs.length;
  const liveTotalSalaryCommitment = staffs.reduce((sum, s) => sum + Number(s.monthly_salary || s.salary || 0), 0);

  // Month-over-month change for selected month
  const selectedMonthMoM = useMemo(() => {
    if (selectedDashboardMonth === "All") return null;
    const currentTot = expenses
      .filter((e) => (e.month || e.date?.slice(0, 7)) === selectedDashboardMonth)
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);

    const [yStr, mStr] = selectedDashboardMonth.split("-");
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    const prevKey = `${y}-${String(m).padStart(2, "0")}`;
    const prevTot = expenses
      .filter((e) => (e.month || e.date?.slice(0, 7)) === prevKey)
      .reduce((sum, e) => sum + Number(e.amount_inr || e.amount || 0), 0);

    if (prevTot === 0) return null;
    const diff = currentTot - prevTot;
    const pct = Number(((diff / prevTot) * 100).toFixed(1));
    return { prevKey, prevTot, diff, pct, direction: diff >= 0 ? "increase" : "decrease" };
  }, [expenses, selectedDashboardMonth]);

  // Highest expense category in selected month
  const selectedMonthHighestCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses
      .filter((e) => selectedDashboardMonth === "All" || (e.month || e.date?.slice(0, 7)) === selectedDashboardMonth)
      .forEach((e) => {
        const cat = e.category || "Other Expenses";
        catMap[cat] = (catMap[cat] || 0) + Number(e.amount_inr || e.amount || 0);
      });
    let topCat = "";
    let topAmt = 0;
    Object.entries(catMap).forEach(([c, a]) => {
      if (a > topAmt) {
        topAmt = a;
        topCat = c;
      }
    });
    return topCat ? { category: topCat, amount: topAmt } : null;
  }, [expenses, selectedDashboardMonth]);

  if (loading && expenses.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-7 animate-fade-in pb-12">
      {/* Action Notice Toast */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md transition-all ${
            actionNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Query Error Alert Banner */}
      {loadError && (
        <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-900">Firestore Query Warning</p>
              <p className="text-xs text-rose-700 mt-0.5">{loadError}</p>
            </div>
          </div>
          <button
            onClick={() => handleManualRefresh()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          EXECUTIVE HEADER: FINANCE DATA ANALYTICS & EXPENSE PREDICTION SYSTEM
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-indigo-100/70 bg-gradient-to-r from-white via-indigo-50/15 to-slate-50/40 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 liquid-specular">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <Scale className="w-5 h-5" />
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Finance Analytics Intelligence
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Firestore Sync</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            College Finance Data Analytics & Expense Prediction
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 max-w-3xl">
            Real-time expenditure intelligence, algorithmic trend projection, and budget analytics powered by Cloud Firestore.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/90 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Refresh Ledger and re-calculate predictive model"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          <button
            onClick={() => onNavigate("financial-analytics")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100/60 text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Open institutional fee collection trends & pending dues analytics"
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>Financial Analytics</span>
          </button>

          <button
            onClick={() => onNavigate("expenses")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Open comprehensive expense management ledger"
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Expense Management</span>
          </button>

          <button
            onClick={() => setIsMonthlyReportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Monthly Ledger</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 hover:from-indigo-700 hover:to-indigo-600 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          # 1. EXPENSE ANALYTICS OVERVIEW – FIRST
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              1. Expense Analytics Overview
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {totalVoucherCount} Vouchers Recorded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Expenses */}
          <div className="glass-card glass-card-hover liquid-specular p-5 rounded-3xl border border-slate-200/80 bg-white/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="w-8 h-8 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 flex items-center gap-0.5 tabular-nums">
                <IndianRupee className="w-5 h-5 text-slate-600" />
                {totalExpenses.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500 font-medium">All-time recorded outflow</span>
                <span className="text-slate-400 font-bold">{totalVoucherCount} vouchers</span>
              </div>
            </div>
          </div>

          {/* Card 2: Current Month Expense */}
          <div className="glass-card glass-card-hover liquid-specular p-5 rounded-3xl border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/20 to-sky-50/30 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Current Month
              </span>
              <div className="w-8 h-8 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 flex items-center gap-0.5 tabular-nums">
                <IndianRupee className="w-5 h-5 text-blue-600" />
                {currentMonthExpense.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-100/60 text-[11px]">
                <span className="text-blue-700 font-semibold truncate" title={currentMonthName}>
                  {currentMonthName}
                </span>
                <span className="text-slate-400 font-bold">Active</span>
              </div>
            </div>
          </div>

          {/* Card 3: Previous Month Expense */}
          <div className="glass-card glass-card-hover liquid-specular p-5 rounded-3xl border border-slate-200/80 bg-white/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Previous Month
              </span>
              <div className="w-8 h-8 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 flex items-center gap-0.5 tabular-nums">
                <IndianRupee className="w-5 h-5 text-slate-500" />
                {previousMonthExpense.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500 font-medium truncate" title={previousMonthName}>
                  {previousMonthName}
                </span>
                <span className="text-slate-400 font-bold">Baseline</span>
              </div>
            </div>
          </div>

          {/* Card 4: Expense Growth % */}
          <div className="glass-card glass-card-hover liquid-specular p-5 rounded-3xl border border-slate-200/80 bg-white/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Expense Growth %
              </span>
              <div
                className={`w-8 h-8 rounded-2xl flex items-center justify-center font-bold ${
                  growthDirection === "increase"
                    ? "bg-rose-100 text-rose-700"
                    : growthDirection === "decrease"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {growthDirection === "increase" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : growthDirection === "decrease" ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Scale className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <p
                className={`text-2xl font-black flex items-center gap-1 ${
                  growthDirection === "increase"
                    ? "text-rose-600"
                    : growthDirection === "decrease"
                    ? "text-emerald-600"
                    : "text-slate-700"
                }`}
              >
                {previousMonthExpense > 0 ? (
                  <>
                    <span>{expenseGrowthPercentage > 0 ? "+" : ""}{expenseGrowthPercentage}%</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-slate-400">Baseline Set</span>
                )}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500 font-medium">MoM Variance</span>
                <span
                  className={`font-extrabold ${
                    growthDirection === "increase"
                      ? "text-rose-600"
                      : growthDirection === "decrease"
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  {growthDirection === "increase" ? "↑ Expanding" : growthDirection === "decrease" ? "↓ Contracting" : "Steady"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: PREDICTED NEXT MONTH EXPENSE (VISUALLY HIGHLIGHTED - MAIN PROJECT FEATURE) */}
          <div className="relative p-5 rounded-3xl border-2 border-violet-400/90 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-xl shadow-violet-500/25 flex flex-col justify-between overflow-hidden sm:col-span-2 lg:col-span-1">
            {/* Subtle background glow element */}
            <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Next Month Projection
                </span>
                <div className="w-8 h-8 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-semibold text-violet-200 block truncate" title={nextMonthName}>
                  Forecast: {nextMonthName}
                </span>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5 flex items-center gap-0.5">
                  <IndianRupee className="w-5 h-5 text-amber-300" />
                  {hasEnoughData ? predictedNextMonthExpense.toLocaleString("en-IN") : "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px]">
              <span className="text-violet-100 font-semibold flex items-center gap-1">
                {trendText === "Increasing" ? "↑" : trendText === "Decreasing" ? "↓" : "→"} {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black tracking-wider uppercase text-amber-200 border border-white/20">
                {trendText}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            # 1.B MONTHLY EXPENSE BREAKDOWN & INSTITUTIONAL PAYROLL (LIVE FIREBASE)
            ========================================================================= */}
        <div className="mt-5 p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  Selected Month Category Breakdown & Payroll Ledgers
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Institutional expense distribution across staff salary, electricity, utilities, and operations from live Firebase data.
              </p>
            </div>

            {/* Filters: Month and Category */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-400">Month:</span>
                <select
                  value={selectedDashboardMonth}
                  onChange={(e) => setSelectedDashboardMonth(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-hidden cursor-pointer"
                >
                  <option value="All" className="bg-slate-900 text-white">All Months</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-400">Category:</span>
                <select
                  value={selectedDashboardCategory}
                  onChange={(e) => setSelectedDashboardCategory(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-hidden cursor-pointer"
                >
                  <option value="All" className="bg-slate-900 text-white">All Categories</option>
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grid of Institutional Category Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-5">
            {/* Total Selected Month */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total ({selectedDashboardMonth})
              </span>
              <p className="text-lg font-black text-white mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                {selectedMonthTotal.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                {selectedMonthExpenses.length} Vouchers
              </span>
            </div>

            {/* Staff Salary */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Staff Salary
              </span>
              <p className="text-lg font-black text-indigo-300 mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-indigo-400" />
                {selectedMonthSalaryTotal.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                {liveStaffCount} Staff Members
              </span>
            </div>

            {/* Electricity */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Electricity
              </span>
              <p className="text-lg font-black text-amber-300 mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                {selectedMonthElectricity.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                EB Consumer Bills
              </span>
            </div>

            {/* Water & Utilities */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Water & Utilities
              </span>
              <p className="text-lg font-black text-sky-300 mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-sky-400" />
                {selectedMonthWaterUtility.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Campus Utility Supply
              </span>
            </div>

            {/* Maintenance */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Maintenance
              </span>
              <p className="text-lg font-black text-pink-300 mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-pink-400" />
                {selectedMonthMaintenance.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Facility & Repairs
              </span>
            </div>

            {/* Stationery */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Stationery
              </span>
              <p className="text-lg font-black text-emerald-300 mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                {selectedMonthStationery.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Academic Office Supplies
              </span>
            </div>

            {/* Internet & IT */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Internet & IT
              </span>
              <p className="text-lg font-black text-cyan-300 mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-cyan-400" />
                {selectedMonthInternetIt.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Broadband & IT Assets
              </span>
            </div>

            {/* Total Staff Count */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Staff Count
              </span>
              <p className="text-lg font-black text-white mt-1">
                {liveStaffCount}
              </p>
              <span className="text-[10px] text-indigo-300 font-semibold mt-1">
                staffs Collection
              </span>
            </div>

            {/* Total Monthly Salary Commitment */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Monthly Salary
              </span>
              <p className="text-lg font-black text-white mt-1 flex items-center">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                {liveTotalSalaryCommitment.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Payroll Commitment
              </span>
            </div>

            {/* Highest Expense Category */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Highest Category
              </span>
              <p className="text-sm font-extrabold text-amber-300 mt-1 truncate">
                {selectedMonthHighestCategory?.category || "None"}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                ₹{selectedMonthHighestCategory?.amount.toLocaleString("en-IN") || "0"}
              </span>
            </div>

            {/* Month-over-Month Change */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between sm:col-span-2 lg:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Month-over-Month Change ({selectedDashboardMonth})
              </span>
              {selectedMonthMoM ? (
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-base font-black flex items-center gap-1 ${
                      selectedMonthMoM.direction === "increase" ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {selectedMonthMoM.direction === "increase" ? "↑" : "↓"} {Math.abs(selectedMonthMoM.pct)}%
                  </span>
                  <span className="text-[11px] text-slate-400">
                    vs {selectedMonthMoM.prevKey} (₹{selectedMonthMoM.prevTot.toLocaleString("en-IN")})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 mt-1">Baseline or All Months selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          # 4. NEXT MONTH EXPENSE PREDICTION – MAIN FEATURE HERO PANEL
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-violet-200/90 bg-gradient-to-br from-white via-violet-50/30 to-purple-50/20 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-violet-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-500/20">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Next Month Expense Prediction (Data-Driven Forecast)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-1">
              Statistical model evaluating historical monthly expenditure series, month-over-month trajectory, and operational cost centers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-600" />
              <span>Model: {algorithmUsed}</span>
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                confidenceLevel === "high"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : confidenceLevel === "limited"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{confidenceBadge}</span>
            </span>
          </div>
        </div>

        {/* Prediction Main Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Main Prediction Metric */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-violet-200 uppercase tracking-wider block">
                Target Period: {nextMonthName}
              </span>
              <h3 className="text-xs font-medium text-white/80 mt-1">
                Predicted Next Month Expense
              </h3>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2 flex items-center gap-1 tracking-tight">
                <IndianRupee className="w-7 h-7 text-amber-300" />
                {hasEnoughData ? predictedNextMonthExpense.toLocaleString("en-IN") : "Insufficient Data"}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
              <div>
                <span className="text-violet-200 block text-[11px]">Expected Change</span>
                <span className="font-extrabold text-white text-sm">
                  {trendText === "Increasing" ? "↑" : trendText === "Decreasing" ? "↓" : "→"} {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-violet-200 block text-[11px]">Trend Direction</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-black text-xs">
                  {trendText}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Calculated Explanation & Interpretation */}
          <div className="p-6 rounded-3xl bg-white border border-violet-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-violet-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Analytical Interpretation</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                "{explanation}"
              </p>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                {summaryNote}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Variance vs Current:</span>
              <span className={`font-bold ${differenceAmount >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {differenceAmount >= 0 ? "+" : ""}₹{differenceAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Forecasting Model Variables */}
          <div className="p-6 rounded-3xl bg-white border border-violet-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Model Parameters</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Reference Month</span>
                  <span className="text-slate-900 font-bold">{currentMonthName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Current Month Outflow</span>
                  <span className="text-slate-900 font-bold">₹{currentMonthExpense.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Recorded Monthly Cycles</span>
                  <span className="text-slate-900 font-bold">{monthlyHistory.length} Cycles</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Confidence Level</span>
                  <span className={`font-extrabold uppercase ${confidenceLevel === "high" ? "text-emerald-600" : "text-amber-600"}`}>
                    {confidenceLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Notice Banner */}
            {!hasEnoughData && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{dataStatus === "empty" ? "No expense data available yet." : "More historical data is required for reliable prediction."}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          # 3. MONTHLY EXPENSE TREND (LARGE PROFESSIONAL LINE CHART)
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                3. Monthly Expense Trend
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Actual monthly expenses dynamically aggregated from Firebase records.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-violet-700 px-3 py-1 bg-violet-50 rounded-xl border border-violet-100">
              Actual Outflows
            </span>
            <span className="text-xs font-semibold text-slate-400 px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-100">
              {monthlyTrendChartData.length} Monthly Cycles
            </span>
          </div>
        </div>

        {monthlyTrendChartData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Database className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No expense data available yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add your first expense voucher to view historical monthly trends.</p>
          </div>
        ) : monthlyTrendChartData.length < 2 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-amber-50/50 rounded-2xl border border-amber-200">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-sm font-bold text-amber-800">Not enough historical data for reliable prediction</p>
            <p className="text-xs text-amber-600 mt-1 max-w-sm">
              Only 1 monthly cycle is currently logged (₹{monthlyTrendChartData[0]?.amount.toLocaleString("en-IN")}). Add vouchers across subsequent months to establish trend curves.
            </p>
          </div>
        ) : (
          <div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="fullMonthName"
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#CBD5E1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + "L" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                            <p className="font-extrabold text-amber-300 text-sm">{data.fullMonthName}</p>
                            <p className="font-bold text-base text-white">
                              Actual Expense: ₹{Number(data.amount).toLocaleString("en-IN")}
                            </p>
                            <p className="text-[11px] text-slate-300">
                              Logged Vouchers: {data.voucherCount} records
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    name="Actual Monthly Expense"
                    dataKey="amount"
                    stroke="#8B5CF6"
                    strokeWidth={3.5}
                    dot={{ fill: "#8B5CF6", stroke: "#FFFFFF", strokeWidth: 2.5, r: 6 }}
                    activeDot={{ r: 8, stroke: "#6D28D9", strokeWidth: 2, fill: "#FFFFFF" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Milestone Strip: January → Actual, February → Actual... */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-100">
              {monthlyTrendChartData.map((item) => (
                <div
                  key={item.monthKey}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-violet-300 transition-colors"
                >
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                    {item.fullMonthName}
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Receipt className="w-3 h-3 text-slate-400" />
                    {item.voucherCount} vouchers
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          # 4. CATEGORY-WISE EXPENSE ANALYSIS (PROFESSIONAL BAR / DONUT CHARTS)
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                4. Category-wise Expense Analysis
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Breakdown of institutional expenditures across verified operational cost categories.
            </p>
          </div>

          {highestCategory && highestCategory.amount > 0 && (
            <div className="px-4 py-2 rounded-2xl bg-violet-50 border border-violet-200 text-violet-800 text-xs font-extrabold flex items-center gap-2 self-start sm:self-auto shadow-xs">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Highest Category: {highestCategory.category} (₹{highestCategory.amount.toLocaleString("en-IN")})</span>
            </div>
          )}
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <PieChartIcon className="w-8 h-8 text-slate-300 mb-1.5" />
            <p className="text-sm font-bold text-slate-600">No expense categories to analyze yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Chart */}
            <div className="lg:col-span-5 h-72 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ExpenseCategoryStat;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-extrabold text-amber-300">{data.category}</p>
                            <p className="font-bold text-sm">
                              Amount: ₹{data.amount.toLocaleString("en-IN")}
                            </p>
                            <p className="text-slate-300">
                              Share: {data.percentage}% of total expenses
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              Vouchers: {data.voucherCount} logged
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <span className="text-[11px] font-semibold text-slate-400 -mt-2">
                Proportional Expenditure Distribution
              </span>
            </div>

            {/* Category Detail Breakdown List with Progress Indicators */}
            <div className="lg:col-span-7 space-y-3.5">
              {categoryBreakdown.map((cat, idx) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                return (
                  <div
                    key={cat.category}
                    className={`p-4 rounded-2xl border transition-all ${
                      cat.isHighest
                        ? "bg-violet-50/40 border-violet-200/90 shadow-xs"
                        : "bg-slate-50/50 border-slate-200/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {cat.category}
                        </span>
                        {cat.isHighest && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-violet-600 text-white">
                            ★ Highest Category
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{cat.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 ml-1.5">
                          ({cat.percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                      <span>{cat.voucherCount} recorded vouchers</span>
                      <span>{cat.percentage}% of total outflow</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          # 5. ACTUAL VS PREDICTED ANALYTICS (DEDICATED COMPARISON CHART)
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                5. Actual vs Predicted Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Comparative projection evaluating historical expenditure against next-month machine forecast.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold self-start sm:self-auto">
            <span className="flex items-center gap-1.5 text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-100">
              <span className="w-3 h-1 bg-violet-600 rounded-full inline-block" /> Actual Expenses
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" /> Predicted Next Month
            </span>
          </div>
        </div>

        {actualVsPredictedChartData.length < 2 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Database className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">Not enough historical data for reliable prediction</p>
            <p className="text-xs text-slate-400 mt-1">
              A minimum of two distinct monthly cycles is required to generate the comparison curve.
            </p>
          </div>
        ) : (
          <div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={actualVsPredictedChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#CBD5E1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + "L" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                            <p className="font-extrabold text-white text-sm">{data.month}</p>
                            {data.actual !== null && (
                              <p className="text-violet-300 font-semibold">
                                Actual Expense: ₹{Number(data.actual).toLocaleString("en-IN")}
                              </p>
                            )}
                            {data.predicted !== null && (
                              <p className="text-amber-300 font-bold">
                                {data.isPrediction ? "★ Predicted Next Month:" : "Forecast Connection:"} ₹{Number(data.predicted).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    name="Actual Expense"
                    dataKey="actual"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: "#8B5CF6", stroke: "#FFFFFF", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    name="Predicted Outflow"
                    dataKey="predicted"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: "#F59E0B", stroke: "#FFFFFF", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Variance Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Reference Active Outflow ({currentMonthName})
                </span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  ₹{currentMonthExpense.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-400">Baseline month for comparison</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Predicted Outflow ({nextMonthName})
                </span>
                <span className="text-lg font-black text-amber-900 mt-1 block">
                  ₹{predictedNextMonthExpense.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">
                  {trendText === "Increasing" ? "↑" : trendText === "Decreasing" ? "↓" : "→"} {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`} variance
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-200/80">
                <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider block">
                  Forecast Model
                </span>
                <span className="text-sm font-black text-violet-900 mt-1 block">
                  {algorithmUsed}
                </span>
                <span className="text-[10px] text-violet-700 font-semibold">
                  {confidenceBadge}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          # 6. AI / DATA INSIGHTS
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              6. Automated Expense Insights
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Derived Strictly from Firestore Datasets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                item.type === "positive"
                  ? "bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 border-emerald-100"
                  : item.type === "warning"
                  ? "bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 border-amber-100"
                  : item.type === "info"
                  ? "bg-gradient-to-br from-white via-violet-50/20 to-purple-50/30 border-violet-100"
                  : "bg-gradient-to-br from-white via-blue-50/20 to-sky-50/30 border-blue-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.type === "positive"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.type === "warning"
                        ? "bg-amber-100 text-amber-800"
                        : item.type === "info"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.metric || "Insight"}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold ${
                      item.type === "positive"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.type === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : item.type === "info"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.type === "positive" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : item.type === "warning" ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-black text-slate-900 tracking-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100/60 text-[10px] font-bold text-slate-400">
                Verified from Live Ledger
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          # 7. RECENT EXPENSES / EXPENSE MANAGEMENT (SECONDARY SECTION)
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-700" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Institutional Expense Vouchers
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Secondary ledger records. Updating or removing any record immediately synchronizes the predictive models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search voucher, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-hidden bg-white"
              />
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:border-violet-500 outline-hidden bg-white font-medium text-slate-700 appearance-none cursor-pointer"
              >
                <option value="All">All Categories ({expenses.length})</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        {filteredRecentExpenses.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No matching expense vouchers found.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or add a new institutional expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecentExpenses.slice(0, 15).map((exp) => (
                  <tr key={exp.id} className="hover:bg-violet-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                      {exp.date || exp.createdAt?.slice(0, 10) || "—"}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-[200px] truncate" title={exp.title}>
                      {exp.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-[160px] truncate" title={exp.paid_to}>
                      {exp.paid_to || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      ₹{Number(exp.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.payment_status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : exp.payment_status === "Pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {exp.payment_status || "Paid"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleView(exp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View Voucher Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(exp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Voucher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.title)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredRecentExpenses.length > 15 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => onNavigate("expenses")}
              className="text-xs font-bold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1"
            >
              <span>View all {filteredRecentExpenses.length} vouchers in Expense Management</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* 1. Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleModalSubmit}
        editingExpense={editingExpense}
      />

      {/* 2. Expense Details Modal */}
      <ExpenseDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onEdit={(exp) => {
          setIsDetailsOpen(false);
          handleEdit(exp as any);
        }}
      />

      {/* 3. Monthly Expense Report Modal */}
      <MonthlyExpenseReportModal
        isOpen={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
      />
    </div>
  );
};
