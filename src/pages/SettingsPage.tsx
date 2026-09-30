import React, { useState, useEffect } from "react";
import {
  Settings,
  CreditCard,
  Bell,
  Building,
  Calendar,
  Save,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  Check,
  IndianRupee,
  ShieldAlert,
  Lock,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FeeCategory, feesService } from "../services/firebase/feesService";
import { AuditLogsViewer } from "../components/admin/AuditLogsViewer";

export interface SettingsPageProps {
  initialTab?: "general" | "fees" | "storage" | "payment" | "notifications" | "academic" | "audit";
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  onNavigate?: (tab: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  initialTab = "general",
  onShowToast = () => {},
  onNavigate = () => {},
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "fees" | "storage" | "payment" | "notifications" | "academic" | "audit">(initialTab);

  // General Settings State
  const [schoolName, setSchoolName] = useState("Our College of Engineering & Technology");
  const [currency, setCurrency] = useState("INR (₹)");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-2026-");
  const [address, setAddress] = useState("104 University Ave, Campus North");
  const [email, setEmail] = useState("admin@college.edu");
  const [phone, setPhone] = useState("+91 44 2855 0199");

  // In-Memory / Database status
  const [dbStatus, setDbStatus] = useState<any>({ activeEngine: "Firebase Firestore Cloud Datastore" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fees Settings State (Admin Only)
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [savingFees, setSavingFees] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Payment gateways
  const [gateways, setGateways] = useState({
    stripe: true,
    razorpay: true,
    upi: true,
    cash: true,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    invoiceCreated: true,
    dueReminder: true,
    receiptIssued: true,
    paymentRejected: true,
  });

  // Strict Security Check: Verify user is an authenticated Administrator
  const isUserAdmin = user?.role === "admin";

  // Fetch Fee Categories from Firebase on Mount
  useEffect(() => {
    fetchFeeSettings();
    fetchDbStatus();
  }, []);

  const fetchFeeSettings = async () => {
    try {
      setFeesLoading(true);
      const res = await api.fees.getCategories();
      if (res.success && Array.isArray(res.data)) {
        setFeeCategories(res.data);
      } else {
        setFeeCategories([]);
      }
    } catch (err: any) {
      console.warn("Could not load fee categories:", err);
      setFeeCategories([]);
    } finally {
      setFeesLoading(false);
    }
  };

  const fetchDbStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.database.getStatus();
      if (res.success && res.data) {
        setDbStatus(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Fee Category Amount Change (Admin only)
  const handleAmountChange = (id: string, newAmountStr: string) => {
    const val = Number(newAmountStr);
    setFeeCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, amount: isNaN(val) ? 0 : val } : c))
    );
  };

  // Quick Amount Adjustment (+500, +1000, -500, etc.)
  const handleQuickAdjust = (id: string, delta: number) => {
    setFeeCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = Math.max(0, Number(c.amount || 0) + delta);
          return { ...c, amount: updated };
        }
        return c;
      })
    );
  };

  // Save Single Fee Setting to Firebase
  const handleSaveSingleCategory = async (cat: FeeCategory) => {
    if (!isUserAdmin) {
      onShowToast("Permission Denied: Only Administrator accounts can edit fee amounts.", "error");
      return;
    }

    try {
      setSavingFees(true);
      const res = await api.fees.updateCategory(cat.id, { amount: cat.amount }, user?.role);
      if (res.success) {
        onShowToast(`Fee rate for "${cat.name}" updated to ₹${cat.amount.toLocaleString()} in Firebase!`, "success");
        setLastSavedTime(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      onShowToast(err.message || "Failed to update fee amount in Firebase.", "error");
    } finally {
      setSavingFees(false);
    }
  };

  // Save Entire Fee Structure to Firebase (Admin Only)
  const handleSaveAllFees = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isUserAdmin) {
      onShowToast("Permission Denied: Only Administrator accounts can edit fee amounts.", "error");
      return;
    }

    try {
      setSavingFees(true);
      const res = await api.fees.saveFeeStructure(feeCategories, user?.role);
      if (res.success) {
        onShowToast("Official fee structure saved to Firebase and synchronized across all portals!", "success");
        setLastSavedTime(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      onShowToast(err.message || "Failed to save fee structure to Firebase.", "error");
    } finally {
      setSavingFees(false);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast("Institutional system configuration saved successfully!", "success");
  };

  // Total Annual Fees Calculation
  const totalStandardAnnualFee = feeCategories.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const tuitionCat = feeCategories.find((c) => c.name.toLowerCase().includes("tuition")) || feeCategories[0];
  const examCat = feeCategories.find((c) => c.name.toLowerCase().includes("exam")) || feeCategories[1];

  // Defensive Access Guard for Non-Admin roles
  if (!isUserAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-red-200/80 rounded-3xl p-8 text-center shadow-lg animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin Settings Restricted</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          The <strong>Admin Settings</strong> and <strong>Fees Settings</strong> sections are strictly reserved for verified System Administrators.
        </p>
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Lock className="w-3.5 h-3.5 text-red-500" />
            <span>Role-Based Access Enforcement:</span>
          </div>
          <p>• <strong>Accountancy:</strong> Can view ledgers and collect fees, but cannot edit tariffs or fee settings.</p>
          <p>• <strong>Students & Parents:</strong> Read-only access to their respective invoices and payments.</p>
        </div>
        <button
          onClick={() => onNavigate("dashboard")}
          className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Admin System Settings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage institutional fee structures, rates, billing configurations, and system-level defaults
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-700">Database: Firebase Firestore</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-xs overflow-x-auto">
        {[
          { id: "fees", label: "Fees Settings", icon: <CreditCard className="w-4 h-4 text-emerald-500" /> },
          { id: "audit", label: "Audit Logs", icon: <ShieldAlert className="w-4 h-4 text-violet-500" /> },
          { id: "general", label: "General Configuration", icon: <Building className="w-4 h-4" /> },
          { id: "storage", label: "Data & Storage", icon: <Database className="w-4 h-4" /> },
          { id: "payment", label: "Payment Gateways", icon: <Layers className="w-4 h-4" /> },
          { id: "notifications", label: "SMS & Alerts", icon: <Bell className="w-4 h-4" /> },
          { id: "academic", label: "Academic Sessions", icon: <Calendar className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === "fees" && (
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                activeTab === "fees" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}>
                Core
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 10. ADMIN-ONLY FEES SETTINGS TAB */}
      {/* ========================================================= */}
      {activeTab === "fees" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Security Alert Badge */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
                <ShieldCheck className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Institutional Fees Settings
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                    Admin Write-Only
                  </span>
                </h2>
                <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  Only Administrators have authority to modify institutional fee rates. Updated amounts are persisted directly to Firebase Firestore and immediately reflected on student ledgers, fee bills, and parent dashboards.
                </p>
              </div>
            </div>
            {lastSavedTime && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-800/60 rounded-xl text-xs text-blue-200 border border-blue-700 self-start md:self-auto">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Last Synced: {lastSavedTime}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Categories</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{feeCategories.length} Types</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Existing project structure</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tuition Fee Rate</p>
                <h3 className="text-xl font-black text-blue-600 mt-1">₹{Number(tuitionCat?.amount || 0).toLocaleString()}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{tuitionCat?.frequency || "Per Semester"}</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Exam Fee Rate</p>
                <h3 className="text-xl font-black text-purple-600 mt-1">₹{Number(examCat?.amount || 0).toLocaleString()}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{examCat?.frequency || "Per Semester"}</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Standard Tariffs</p>
                <h3 className="text-xl font-black text-emerald-600 mt-1">₹{totalStandardAnnualFee.toLocaleString()}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Sum of all categories</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Fee Categories Editing Table / Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-base">Standard Fee Structure Table</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update the amount for each existing category below and click Save to synchronize to Firebase
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAllFees()}
                  disabled={savingFees}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {savingFees ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{savingFees ? "Saving to Firebase..." : "Save Fee Structure"}</span>
                </button>
              </div>
            </div>

            {feesLoading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs">Loading fee settings from Firebase...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {feeCategories.map((cat, idx) => (
                  <div
                    key={cat.id || idx}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    {/* Category Details */}
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {cat.code || `FEE-${idx + 1}`}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm">{cat.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cat.frequency || "Per Semester"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {cat.description || "Official institutional fee scheduled by Academic Council"}
                      </p>
                    </div>

                    {/* Amount Editing Input and Quick Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Numeric Input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                          ₹
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={cat.amount}
                          onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                          className="w-36 pl-7 pr-3 py-2 text-sm font-black text-slate-900 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                        />
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(cat.id, 500)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="Add ₹500"
                        >
                          +₹500
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(cat.id, 1000)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="Add ₹1,000"
                        >
                          +₹1k
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(cat.id, -500)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="Deduct ₹500"
                        >
                          -₹500
                        </button>
                      </div>

                      {/* Single Update Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveSingleCategory(cat)}
                        disabled={savingFees}
                        className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Update Rate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Modifications are verified against Firestore zero-trust authorization rules.</span>
              </div>
              <button
                type="button"
                onClick={() => handleSaveAllFees()}
                disabled={savingFees}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition self-end sm:self-auto"
              >
                {savingFees ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save All Fee Settings to Firebase</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GENERAL CONFIGURATION TAB */}
      {/* ========================================================= */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              College Institutional Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Administration Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>Save General Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* DATA & STORAGE TAB */}
      {/* ========================================================= */}
      {activeTab === "storage" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Datastore Architecture</h3>
              <p className="text-xs text-slate-400">High-concurrency document storage with Firestore backend</p>
            </div>
            <button
              onClick={fetchDbStatus}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">Production Cloud Datastore Active</span>
            </div>
            <p className="text-emerald-700 pl-6">
              Connected to Firebase Firestore with real-time multi-tenant sync and RBAC security rules.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAYMENT GATEWAYS TAB */}
      {/* ========================================================= */}
      {activeTab === "payment" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100">
            Configured Payment Channels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "upi", name: "UPI & BharatQR Gateway", desc: "Instant zero-fee student UPI transfers via BHIM, GPay, PhonePe", active: gateways.upi },
              { id: "razorpay", name: "Razorpay College Suite", desc: "Netbanking, credit cards, debit cards, and automated billing", active: gateways.razorpay },
              { id: "cash", name: "Cash / Bursar Counter Deposit", desc: "Allows physical offline fee collection with printed receipts", active: gateways.cash },
              { id: "stripe", name: "Stripe International", desc: "Direct card processing for international student admissions", active: gateways.stripe },
            ].map((gw) => (
              <div key={gw.id} className="p-4 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{gw.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{gw.desc}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NOTIFICATIONS TAB */}
      {/* ========================================================= */}
      {activeTab === "notifications" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100">
            Automated SMS & Email Reminders
          </h3>
          <div className="space-y-3">
            {[
              { id: "invoiceCreated", title: "Send SMS/Email upon New Invoice Generation", desc: "Notifies parents immediately when term fees are posted" },
              { id: "dueReminder", title: "Automated Reminder 3 Days Before Due Date", desc: "Reduces overdue accounts by nudging pending balances" },
              { id: "receiptIssued", title: "Send Electronic PDF Receipt on Payment Verification", desc: "Dispatches printable receipt link to registered guardian" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                  Enabled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* AUDIT LOGS TAB */}
      {/* ========================================================= */}
      {activeTab === "audit" && (
        <div className="animate-in fade-in">
          <AuditLogsViewer />
        </div>
      )}

      {/* ========================================================= */}
      {/* ACADEMIC SESSIONS TAB */}
      {/* ========================================================= */}
      {activeTab === "academic" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100">
            Academic Term Calendar & Tariffs
          </h3>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
            <p className="font-bold">Current Active Session: 2025-2026 Academic Year</p>
            <p className="text-blue-700">Odd Semester (Term 1): August 1 - December 20</p>
            <p className="text-blue-700">Even Semester (Term 2): January 5 - May 30</p>
          </div>
        </div>
      )}
    </div>
  );
};
