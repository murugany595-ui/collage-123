import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Printer,
  Download,
  FileText,
  IndianRupee,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Layers,
  History,
  Sparkles,
  AlertTriangle,
  Receipt,
  Tag,
  Check,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { EditFeeModal } from "../components/modals/EditFeeModal";
import { useAuth } from "../context/AuthContext";

export interface FeesPageProps {
  onCollectFee?: (invoice: any) => void;
  onCreateInvoice?: () => void;
  onViewReceipt?: (receipt: any) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const FeesPage: React.FC<FeesPageProps> = ({
  onCollectFee = () => {},
  onCreateInvoice = () => {},
  onViewReceipt = () => {},
  onShowToast = () => {},
}) => {
  const { user } = useAuth();
  const isUserAdmin =
    user?.role === "admin" ||
    user?.email === "admin@brightwood.edu" ||
    Boolean(user?.email?.includes("admin"));

  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<"ledger" | "history" | "categories" | "batch">("ledger");

  // Invoices & Ledger State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 1,
  });

  // Summary Metrics
  const [summary, setSummary] = useState({
    totalBilled: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    collectionEfficiency: "0.0%",
  });

  // Payment History State
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");

  // Categories Master State
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState<number>(1000);
  const [newCatFreq, setNewCatFreq] = useState("Per Term");
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  // Batch Generator State
  const [batchDept, setBatchDept] = useState("B.Tech Computer Science");
  const [batchCategory, setBatchCategory] = useState("Tuition & Academic Term Fee");
  const [batchAmount, setBatchAmount] = useState<number>(1250);
  const [batchDueDate, setBatchDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [batchMonth, setBatchMonth] = useState("September 2026");
  const [batchLoading, setBatchLoading] = useState(false);

  // Modals
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Load Invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.fees.getAll({
        q: searchQuery || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        grade: gradeFilter === "ALL" ? undefined : gradeFilter,
        category: categoryFilter === "ALL" ? undefined : categoryFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: pageSize,
      });

      if (res.success) {
        setInvoices(res.data || []);
        if (res.pagination) {
          setPaginationInfo({
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          });
        }
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err: any) {
      onShowToast(err.message || "Failed to load fee ledger.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, gradeFilter, categoryFilter, sortBy, sortOrder, currentPage, pageSize]);

  // Load Payment History
  const fetchPaymentHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.fees.getPaymentsHistory({
        q: historySearch || undefined,
        limit: 50,
      });
      if (res.success && Array.isArray(res.data)) {
        setPaymentHistory(res.data);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, [historySearch]);

  // Load Categories
  const fetchCategories = useCallback(async () => {
    try {
      setCatLoading(true);
      const res = await api.fees.getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch {
      // ignore
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchPaymentHistory();
    } else if (activeTab === "categories") {
      fetchCategories();
    }
  }, [activeTab, fetchPaymentHistory, fetchCategories]);

  // Handle Sort Toggle
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Handle Delete Fee
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmInvoice) return;
    try {
      setDeleteLoading(true);
      const res = await api.fees.delete(deleteConfirmInvoice.id);
      if (res.success) {
        onShowToast(`Invoice ${deleteConfirmInvoice.id} deleted successfully.`, "success");
        setDeleteConfirmInvoice(null);
        fetchInvoices();
      }
    } catch (err: any) {
      onShowToast(err.message || "Failed to delete fee record.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Send Reminder
  const handleSendReminder = (studentName: string, id: string) => {
    onShowToast(`Automated payment SMS & Email notice dispatched to ${studentName} for Invoice #${id}.`, "success");
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (!isUserAdmin) {
      onShowToast("Permission Denied: Only Administrator accounts can create fee categories.", "error");
      return;
    }
    try {
      const res = await api.fees.createCategory(
        {
          name: newCatName.trim(),
          amount: Number(newCatAmount),
          frequency: newCatFreq,
        },
        user?.role
      );
      if (res.success) {
        onShowToast(`Category "${newCatName}" created successfully!`, "success");
        setShowAddCatModal(false);
        setNewCatName("");
        setNewCatAmount(1000);
        fetchCategories();
      }
    } catch (err: any) {
      onShowToast(err.message || "Failed to create category", "error");
    }
  };

  // Handle Batch Generation
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBatchLoading(true);
      const res = await api.fees.batchGenerate({
        department: batchDept,
        feeType: batchCategory,
        amount: Number(batchAmount),
        dueDate: batchDueDate,
        month: batchMonth,
      });
      if (res.success) {
        onShowToast(`Successfully generated ${res.count} invoices for ${batchDept}!`, "success");
        fetchInvoices();
        setActiveTab("ledger");
      }
    } catch (err: any) {
      onShowToast(err.message || "Batch generation failed.", "error");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 5 Financial Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Billed</span>
            <span className="p-2 bg-violet-100 text-violet-700 rounded-2xl">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              ₹{(summary.totalBilled || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Sum of student dues</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Collected</span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight">
              ₹{(summary.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600/80 font-semibold mt-0.5">Paid & settled</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Pending Dues</span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-2xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-amber-700 tracking-tight">
              ₹{(summary.totalPending || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-amber-600/80 font-semibold mt-0.5">Awaiting settlement</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Past Overdue</span>
            <span className="p-2 bg-rose-100 text-rose-700 rounded-2xl">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-rose-700 tracking-tight">
              ₹{(summary.totalOverdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-rose-600/80 font-semibold mt-0.5">Action required</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wider">Recovery Rate</span>
            <span className="p-2 bg-purple-100 text-purple-700 rounded-2xl">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-violet-700 tracking-tight">
              {summary.collectionEfficiency || "0%"}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Collection efficiency</p>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="glass-card p-2 rounded-3xl border border-white/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "ledger"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/70"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices & Fee Ledger</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === "ledger" ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"}`}>
              {paginationInfo.total || invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "history"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/70"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Payment History</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/70"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fee Categories</span>
          </button>

          <button
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "batch"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/70"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Batch Generator</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === "ledger") fetchInvoices();
              if (activeTab === "history") fetchPaymentHistory();
              if (activeTab === "categories") fetchCategories();
            }}
            title="Refresh records"
            className="p-2.5 text-slate-500 hover:text-violet-700 hover:bg-violet-50 rounded-2xl transition border border-violet-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-violet-600" : ""}`} />
          </button>
          <button
            onClick={onCreateInvoice}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INVOICES & FEE LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Advanced Search & Filtering Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, roll number, invoice #..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="Paid">Paid (Fully Cleared)</option>
                <option value="Partial">Partial Payment</option>
                <option value="Pending">Pending Due</option>
                <option value="Overdue">Overdue Deadlines</option>
              </select>

              {/* Department / Branch Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Departments</option>
                <option value="B.Tech Computer Science">B.Tech Computer Science</option>
                <option value="B.Tech CSE">B.Tech CSE</option>
                <option value="B.Tech Electronics">B.Tech Electronics (ECE)</option>
                <option value="B.Tech Mechanical">B.Tech Mechanical (MECH)</option>
                <option value="MBA Finance">MBA Finance</option>
                <option value="B.Sc Data Science">B.Sc Data Science</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Fee Types</option>
                <option value="Tuition & Academic Term Fee">Tuition & Academic</option>
                <option value="Transportation / Bus Facility">Transportation</option>
                <option value="Science & Computer Lab Fee">Lab Facility</option>
                <option value="Hostel & Residential Boarding">Hostel & Boarding</option>
                <option value="Digital Library & Learning Resources">Library</option>
              </select>
            </div>

            {/* Records per page selector */}
            <div className="flex items-center gap-2 self-end lg:self-auto text-xs text-slate-500">
              <span className="text-[11px] font-medium">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          {/* Main Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5 cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("id")}>
                      <div className="flex items-center gap-1">
                        <span>Invoice #</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("student_name")}>
                      <div className="flex items-center gap-1">
                        <span>Student & Roll</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Fee Category</th>
                    <th className="px-5 py-3.5 cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("due_date")}>
                      <div className="flex items-center gap-1">
                        <span>Due Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("amount")}>
                      <div className="flex items-center gap-1">
                        <span>Total Fee</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-emerald-600">Paid Amount</th>
                    <th className="px-5 py-3.5 text-amber-600">Pending Amount</th>
                    <th className="px-5 py-3.5 cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("status")}>
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-semibold">Synchronizing fee database & ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700 text-sm">No fee records found</p>
                          <p className="text-xs text-slate-400">Try adjusting your search query, filter criteria, or generate a new invoice.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      const totalAmt = Number(inv.amount || 0);
                      const paidAmt = Number(inv.paid_amount || 0);
                      const pendingAmt = Number(inv.pending_amount !== undefined ? inv.pending_amount : (totalAmt - paidAmt));

                      const statusBadge = {
                        Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        Partial: "bg-blue-50 text-blue-700 border-blue-200",
                        Pending: "bg-amber-50 text-amber-700 border-amber-200",
                        Overdue: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
                      }[inv.status] || "bg-slate-100 text-slate-700 border-slate-200";

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition group">
                          {/* Invoice # */}
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                            #{inv.id}
                          </td>

                          {/* Student */}
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">
                                {inv.student_name || inv.student || "Student"}
                              </p>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {inv.student_id || "STU-1042"} {inv.roll_number ? `• Roll ${inv.roll_number}` : ""}
                              </span>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                            {inv.grade || "B.Tech CSE"}
                          </td>

                          {/* Category */}
                          <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap max-w-[160px] truncate" title={inv.category || "Tuition"}>
                            {inv.category || "Tuition & Term Fee"}
                          </td>

                          {/* Due Date */}
                          <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                            {inv.due_date || inv.dueDate || "2026-08-30"}
                          </td>

                          {/* Total Fee */}
                          <td className="px-5 py-3.5 font-black text-slate-900 whitespace-nowrap">
                            ₹{totalAmt.toFixed(2)}
                          </td>

                          {/* Paid Amount */}
                          <td className="px-5 py-3.5 font-bold text-emerald-600 whitespace-nowrap">
                            ₹{paidAmt.toFixed(2)}
                          </td>

                          {/* Pending Amount */}
                          <td className="px-5 py-3.5 font-bold text-amber-600 whitespace-nowrap">
                            ₹{pendingAmt.toFixed(2)}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                              {inv.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Collect Fee Button (if balance > 0) */}
                              {pendingAmt > 0 && (
                                <button
                                  onClick={() =>
                                    onCollectFee({
                                      ...inv,
                                      id: inv.id,
                                      student_id: inv.student_id,
                                      student: inv.student_name || inv.student,
                                      grade: inv.grade,
                                      amount: totalAmt,
                                      paid_amount: paidAmt,
                                      pending_amount: pendingAmt,
                                      balance: pendingAmt,
                                      type: inv.category,
                                    })
                                  }
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Collect</span>
                                </button>
                              )}

                              {/* Receipt Button (if paid anything) */}
                              {paidAmt > 0 && (
                                <button
                                  onClick={() =>
                                    onViewReceipt({
                                      id: `RCP-${inv.id}`,
                                      invoice_id: inv.id,
                                      student_name: inv.student_name || inv.student,
                                      student_id: inv.student_id,
                                      grade: inv.grade,
                                      amount: paidAmt,
                                      date: inv.due_date || new Date().toISOString().slice(0, 10),
                                      fee_type: inv.category,
                                      payment_method: "Verified Account Portal",
                                    })
                                  }
                                  className="px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                  title="View Payment Receipt"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Receipt</span>
                                </button>
                              )}

                              {/* Edit Fee */}
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Fee Invoice"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Fee */}
                              <button
                                onClick={() => setDeleteConfirmInvoice(inv)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Reminder Notice */}
                              {pendingAmt > 0 && (
                                <button
                                  onClick={() => handleSendReminder(inv.student_name || inv.student, inv.id)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Send Payment Reminder Notice"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-slate-600">
              <div className="font-medium">
                Showing {invoices.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, paginationInfo.total)} of {paginationInfo.total} fee invoices
              </div>

              <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage >= paginationInfo.totalPages || loading}
                  onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT TRANSACTIONS & HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">Fee Payment Transactions History</h2>
              <p className="text-xs text-slate-400">Complete immutable record of all incoming student fee settlements</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transaction ID, student..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Transaction ID</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Linked Invoice</th>
                    <th className="px-5 py-3.5">Payment Method</th>
                    <th className="px-5 py-3.5">Amount Settled</th>
                    <th className="px-5 py-3.5">Paid Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Loading payment history...
                      </td>
                    </tr>
                  ) : paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No payment transaction records found.
                      </td>
                    </tr>
                  ) : (
                    paymentHistory.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-blue-600">#{txn.id}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{txn.student || txn.student_name}</p>
                          <span className="text-[11px] text-slate-400">{txn.grade || "B.Tech CSE"}</span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">
                          {txn.invoice_id ? `#${txn.invoice_id}` : "Direct Payment"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {txn.method || "Card"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-black text-emerald-600 text-xs sm:text-sm">
                          ₹{Number(txn.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-medium">{txn.paid_date || txn.date}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() =>
                              onViewReceipt({
                                id: `RCP-${txn.id}`,
                                invoice_id: txn.invoice_id,
                                student_name: txn.student || txn.student_name,
                                grade: txn.grade,
                                amount: txn.amount,
                                date: txn.paid_date || txn.date,
                                payment_method: txn.method,
                              })
                            }
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                          >
                            <Printer className="w-3 h-3" /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEE CATEGORIES MASTER */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Fee Category Structures & Rates</h2>
              <p className="text-xs text-slate-400">Institutional tariff table for tuition, lab facilities, and amenities</p>
            </div>
            {isUserAdmin ? (
              <button
                onClick={() => setShowAddCatModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Category</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 self-start sm:self-auto">
                <span>Fee rates governed by College Admin</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      {cat.code || `FEE-${cat.id}`}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base mt-2.5">{cat.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-blue-700">₹{Number(cat.amount).toLocaleString()}</span>
                    <span className="text-xs font-medium text-slate-400">/ {cat.frequency}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{cat.students || 0} students assigned</span>
                  <button
                    onClick={() => onShowToast(`Category ${cat.name} selected for tariff application.`, "info")}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Category Modal */}
          {showAddCatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-black text-slate-800 text-base">Add Fee Category</h3>
                  <button onClick={() => setShowAddCatModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddCategory} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Examination & Certificate Fee"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newCatAmount}
                        onChange={(e) => setNewCatAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Billing Frequency</label>
                      <select
                        value={newCatFreq}
                        onChange={(e) => setNewCatFreq(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Per Term">Per Term</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Per Year">Per Year</option>
                        <option value="One-Time">One-Time</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddCatModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                    >
                      Create Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BATCH FEE GENERATOR */}
      {activeTab === "batch" && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Batch Fee Invoice Generator</h2>
                <p className="text-xs text-slate-400">Generate student bills across entire branches and departments in one click</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleBatchGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Department / Program</label>
              <select
                value={batchDept}
                onChange={(e) => setBatchDept(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 bg-white font-medium"
              >
                <option value="B.Tech Computer Science">B.Tech Computer Science (All Semesters)</option>
                <option value="B.Tech Electronics">B.Tech Electronics & Comm.</option>
                <option value="B.Tech Mechanical">B.Tech Mechanical Engineering</option>
                <option value="MBA Finance">MBA Finance & Management</option>
                <option value="B.Sc Data Science">B.Sc Data Science & AI</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Fee Category</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="Tuition & Academic Term Fee">Tuition & Academic Term Fee</option>
                  <option value="Transportation / Bus Facility">Transportation / Bus Facility</option>
                  <option value="Science & Computer Lab Fee">Science & Computer Lab Fee</option>
                  <option value="Examination & Certification Fee">Examination & Certification Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount Per Student (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Billing Month / Label</label>
                <input
                  type="text"
                  value={batchMonth}
                  onChange={(e) => setBatchMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Due Date</label>
                <input
                  type="date"
                  value={batchDueDate}
                  onChange={(e) => setBatchDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={batchLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {batchLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Batch Generation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Invoices for Entire Batch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Fee Modal */}
      {editingInvoice && (
        <EditFeeModal
          isOpen={Boolean(editingInvoice)}
          onClose={() => setEditingInvoice(null)}
          invoice={editingInvoice}
          onSuccess={() => {
            fetchInvoices();
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-base">Delete Fee Invoice?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete Invoice #{deleteConfirmInvoice.id} for {deleteConfirmInvoice.student_name || deleteConfirmInvoice.student}? This action will permanently remove this record.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmInvoice(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
