import React, { useMemo, useState } from "react";
import {
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  Scale,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  CartesianGrid,
} from "recharts";
import { ExpenseItem, ExpenseSummary, FinancialOverviewData } from "../../types";
import { calculateExpensePrediction } from "../../services/expensePredictionService";

interface ExpenseOverviewProps {
  summary: ExpenseSummary | null;
  financialOverview: FinancialOverviewData | null;
  expenses?: ExpenseItem[];
  onNavigateTab?: (tab: string) => void;
  onOpenAddExpense?: () => void;
  onOpenMonthlyReport?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Staff Salary": "#2563EB",
  "Electricity Bill": "#F59E0B",
  "Water Bill": "#06B6D4",
  "Internet / Wi-Fi Bill": "#8B5CF6",
  "Maintenance & Repairs": "#EC4899",
  "Computer / Hardware Expenses": "#3B82F6",
  "Stationery Expenses": "#10B981",
  "Transport Expenses": "#F97316",
  "Cleaning Expenses": "#64748B",
  "Software / Subscription Expenses": "#6366F1",
  "Event & Function Expenses": "#14B8A6",
  "Examination Expenses": "#84CC16",
  "Other Expenses": "#94A3B8",
};

export const ExpenseOverview: React.FC<ExpenseOverviewProps> = ({
  summary,
  financialOverview,
  expenses = [],
  onNavigateTab,
  onOpenAddExpense,
  onOpenMonthlyReport,
}) => {
  const totalFees = financialOverview?.totalFeesCollected || 0;
  const totalExpenses = summary?.totalExpenses || financialOverview?.totalExpenses || 0;
  const netBalance = totalFees - totalExpenses;
  const isSurplus = netBalance >= 0;

  // Calculate prediction dynamically from live Firebase expenses
  const prediction = useMemo(() => {
    return calculateExpensePrediction(expenses || []);
  }, [expenses]);

  const [chartMode, setChartMode] = useState<"prediction" | "cashflow">("prediction");

  // Prepare Pie Chart Data from categoryTotals
  const pieData = Object.entries(summary?.categoryTotals || summary?.byCategory || {}).map(([name, value]) => ({
    name,
    value: Number(value),
    color: CATEGORY_COLORS[name] || "#64748B",
  })).filter((d) => d.value > 0);

  // Prepare Trend Data for comparison
  const trendData = financialOverview?.monthlyTrends || [];

  return (
    <div className="space-y-6">
      {/* 1. Master Financial Reconciliation Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-5 h-5 text-blue-400" />
                <span className="text-xs uppercase font-bold tracking-wider text-blue-300">
                  College Financial Position
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Net Operating Balance:{" "}
                <span className={isSurplus ? "text-emerald-400" : "text-rose-400"}>
                  {isSurplus ? "+" : "-"}₹{Math.abs(netBalance).toLocaleString("en-IN")}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Formula: Total Fees Collected (₹{totalFees.toLocaleString("en-IN")}) − Total Institutional Expenses (₹{totalExpenses.toLocaleString("en-IN")})
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onOpenMonthlyReport && (
                <button
                  onClick={onOpenMonthlyReport}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600/60 flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Monthly Report
                </button>
              )}
              {onOpenAddExpense && (
                <button
                  onClick={onOpenAddExpense}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <IndianRupee className="w-4 h-4" />
                  Add Expense
                </button>
              )}
            </div>
          </div>

          {/* Quick 3-Pillar Financial Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Total Fees Collected</p>
                <p className="text-xl font-extrabold text-white">₹{totalFees.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Verified Tuition & Dues</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Total College Expenses</p>
                <p className="text-xl font-extrabold text-white">₹{totalExpenses.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-rose-400 font-medium mt-0.5">Operating & Payroll Outflow</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSurplus ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Institutional Net Reserve</p>
                <p className="text-xl font-extrabold text-white">₹{netBalance.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-blue-300 font-medium mt-0.5">{isSurplus ? "Healthy Operating Surplus" : "Deficit Alert"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Expense Category Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Institutional Expenses */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("expenses")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-violet-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-violet-600 transition-colors">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            ₹{totalExpenses.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-violet-600 mt-1 font-medium group-hover:underline flex items-center gap-1">
            View All Vouchers ({summary?.totalCount || (expenses || []).length || 0}) →
          </p>
        </div>

        {/* Card 2: This Month Outflow */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month Outflow</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            ₹{Number(summary?.thisMonthExpenses || 0).toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
            Active monthly operating cycle
          </p>
        </div>

        {/* Card 3: Settled & Paid Outflow */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settled & Paid</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            ₹{Math.max(0, totalExpenses - Number(summary?.pendingExpenses || 0)).toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Disbursed & verified vouchers</p>
        </div>

        {/* Card 4: Pending Clearance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Clearance</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            ₹{Number(summary?.pendingExpenses || 0).toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-rose-600 mt-1 font-medium">Unpaid invoices & commitments</p>
        </div>
      </div>

      {/* 2.5 Next Month Expense Prediction Card */}
      {prediction.hasEnoughData ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-950 text-white shadow-lg border border-violet-800/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-400/20 text-violet-300 border border-violet-400/30">
                  <Sparkles className="w-4 h-4 text-violet-300" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300">
                  Forecast for {prediction.nextMonthName}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-violet-800/80 text-violet-200 border border-violet-700">
                  {prediction.algorithmUsed}
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Next Month Expense Prediction: ₹{prediction.predictedNextMonthExpense.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-violet-200 max-w-2xl leading-relaxed">
                Current month: <strong>₹{(prediction?.currentMonthExpense || 0).toLocaleString("en-IN")}</strong> ({prediction?.currentMonthName || "Current Month"}).
                Difference: <strong className={(prediction?.differenceAmount || 0) >= 0 ? "text-rose-300" : "text-emerald-300"}>{(prediction?.differenceAmount || 0) >= 0 ? "+" : "-"}₹{Math.abs(prediction?.differenceAmount || 0).toLocaleString("en-IN")}</strong> ({(prediction?.percentageChange || 0) >= 0 ? "+" : ""}{prediction?.percentageChange || 0}%).
                Computed strictly from {(prediction?.monthlyHistory || []).length} historical months in Firebase.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab("prediction")}
              className="px-5 py-2.5 rounded-2xl bg-white text-violet-950 hover:bg-violet-50 text-xs font-black shadow-md flex items-center gap-1.5 shrink-0 transition hover:scale-102"
            >
              <span>Explore Monthly Prediction</span>
              <ArrowRight className="w-4 h-4 text-violet-700" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 border border-amber-200 text-amber-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Not enough historical data for reliable prediction.
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Monthly expense prediction requires records across at least 2 distinct monthly cycles in Firebase. As soon as vouchers are posted, predictions generate automatically.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab("prediction")}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition"
          >
            Prediction Analysis →
          </button>
        </div>
      )}

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {chartMode === "prediction"
                    ? "Historical Monthly Expenses + Next Month Prediction"
                    : "Monthly Revenue (Fees) vs Expenses Trend"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {chartMode === "prediction"
                  ? "Actual Firebase monthly outlays & dynamic statistical forecast"
                  : "2026 Academic year cashflow reconciliation (₹)"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setChartMode("prediction")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    chartMode === "prediction"
                      ? "bg-white text-violet-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Prediction
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("cashflow")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    chartMode === "cashflow"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cashflow
                </button>
              </div>
            </div>
          </div>

          {chartMode === "prediction" ? (
            (prediction?.chartData || []).length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={prediction?.chartData || []} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} fontSize={11} />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                      fontSize={11}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        val != null ? `₹${Number(val).toLocaleString("en-IN")}` : "N/A",
                        name === "historical" ? "Actual Historical Expense" : "Next Month Predicted Expense",
                      ]}
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        color: "#FFF",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="historical" name="historical" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar
                      dataKey="predicted"
                      name="predicted"
                      fill="#C084FC"
                      stroke="#7C3AED"
                      strokeDasharray="4 4"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                    <Line
                      type="monotone"
                      dataKey="historical"
                      stroke="#4C1D95"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#4C1D95" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#9333EA"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: "#A855F7" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <p>No historical monthly expenses logged in Firestore.</p>
              </div>
            )
          ) : (trendData || []).length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                    fontSize={11}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#FFF",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="income" name="Fees Inflow" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" name="Expenses Outflow" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Calendar className="w-8 h-8 text-slate-300 mb-2" />
              <p>No monthly cashflow trends recorded in Firestore.</p>
            </div>
          )}
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              Category Breakdown
            </h3>
            <p className="text-xs text-slate-500">Distribution across approved expense heads</p>
          </div>

          {(pieData || []).length > 0 ? (
            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#FFF",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-xs font-semibold text-slate-400 block">Total</span>
                <span className="text-sm font-black text-slate-900">
                  ₹{(totalExpenses / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
              <PieIcon className="w-8 h-8 text-slate-300 mb-2" />
              <p>No categorized expenses recorded yet.</p>
            </div>
          )}

          {/* Mini Legend List */}
          <div className="mt-auto pt-3 border-t border-slate-100 max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin text-xs">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate font-medium">{item.name}</span>
                </div>
                <span className="font-bold shrink-0">₹{item.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
