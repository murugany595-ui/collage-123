import React, { useState, useEffect } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  Users,
  IndianRupee,
  Send,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";

export interface GenerateMonthlyFeesPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  onNavigate?: (tab: string) => void;
}

export const GenerateMonthlyFeesPage: React.FC<GenerateMonthlyFeesPageProps> = ({
  onShowToast = () => {},
  onNavigate = () => {},
}) => {
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [billingMonth, setBillingMonth] = useState("August 2026");
  const [targetClass, setTargetClass] = useState("ALL");
  const [dueDate, setDueDate] = useState("2026-08-30");

  const [feeItems, setFeeItems] = useState([
    { id: "tuition", label: "Tuition & Academic Term Fee", amount: 45000 },
    { id: "exam", label: "University Examination Fee", amount: 2500 },
    { id: "lab", label: "Library & Laboratory Consumables", amount: 8000 },
    { id: "amenities", label: "Campus Amenities & Development", amount: 6000 },
  ]);

  const [selectedFees, setSelectedFees] = useState<Record<string, boolean>>({
    tuition: true,
    exam: true,
    lab: true,
    amenities: true,
  });

  const [loading, setLoading] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  useEffect(() => {
    loadFeeCategories();
  }, []);

  const loadFeeCategories = async () => {
    try {
      const res = await api.fees.getCategories();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((c: any) => ({
          id: c.id,
          label: c.name,
          amount: Number(c.amount) || 0,
        }));
        setFeeItems(mapped);
        const selMap: Record<string, boolean> = {};
        mapped.forEach((m: any) => {
          selMap[m.id] = true;
        });
        setSelectedFees(selMap);
      }
    } catch {
      // Use defaults
    }
  };

  const totalPerStudent = feeItems.reduce((acc, item) => {
    return selectedFees[item.id as keyof typeof selectedFees] ? acc + item.amount : acc;
  }, 0);

  const studentCount = targetClass === "ALL" ? 2647 : 420;
  const projectedTotal = totalPerStudent * studentCount;

  const handleToggle = (id: keyof typeof selectedFees) => {
    setSelectedFees((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGeneratedSuccess(true);
      onShowToast(
        `Successfully generated ${studentCount} invoices totaling ₹${projectedTotal.toLocaleString()} for ${billingMonth}!`,
        "success"
      );
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Generate Monthly Invoices</h1>
            <p className="text-xs text-slate-400">
              Configure and batch-generate student fee bills with automated parent notifications
            </p>
          </div>
        </div>
      </div>

      {generatedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-900 text-base">Invoices Generated Successfully!</h3>
              <p className="text-xs text-emerald-700">
                {studentCount} fee invoices for <strong>{billingMonth}</strong> have been created and queued for parent settlement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate("fees")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              View Invoices in Fee Ledger →
            </button>
            <button
              onClick={() => setGeneratedSuccess(false)}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              Generate Another Batch
            </button>
          </div>
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters & Categories */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100">
            Billing Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Session</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="2025-2026">2025-2026 (Current)</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department & Batch</label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="ALL">All Enrolled College Batches (2,647 Students)</option>
                <option value="B.Tech CSE">B.Tech Computer Science - Sem 5 (64 Students)</option>
                <option value="B.Tech ECE">B.Tech Electronics & Comm - Sem 3 (58 Students)</option>
                <option value="B.Tech MECH">B.Tech Mechanical - Sem 7 (52 Students)</option>
                <option value="MBA">MBA Finance - Sem 1 (48 Students)</option>
                <option value="B.Sc DS">B.Sc Data Science - Sem 1 (50 Students)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Month</label>
              <select
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="August 2026">August 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
              Included Fee Heads / Categories
            </h4>
            <div className="space-y-2.5">
              {feeItems.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    selectedFees[item.id as keyof typeof selectedFees]
                      ? "border-blue-500 bg-blue-50/50 text-slate-900"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFees[item.id as keyof typeof selectedFees]}
                      onChange={() => handleToggle(item.id as keyof typeof selectedFees)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">₹{item.amount.toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary & Dispatch Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Projected Generation Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Selected Billing Month:</span>
                <span className="font-bold text-slate-800">{billingMonth}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Target Student Population:</span>
                <span className="font-bold text-slate-800">{studentCount.toLocaleString()} Students</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Billed Per Student:</span>
                <span className="font-bold text-blue-600">₹{totalPerStudent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-black text-slate-900 bg-blue-50/70 p-3 rounded-xl">
                <span>Total Projected Invoices:</span>
                <span className="text-blue-700">₹{projectedTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Automated Parent Notifications</span>
              </div>
              <p>Email invoices & SMS reminders will be dispatched immediately upon generation.</p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || totalPerStudent === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                "Processing Batch Generation..."
              ) : (
                <>
                  <CalendarPlus className="w-4 h-4" />
                  <span>Generate Invoices for {studentCount} Students</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
