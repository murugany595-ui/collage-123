import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  AlertTriangle,
  IndianRupee,
  Layers,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  Database,
  BarChart3,
  HelpCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
} from "recharts";
import { ExpenseItem } from "../../types";
import { calculateExpensePrediction } from "../../services/expensePredictionService";

interface ExpensePredictionSectionProps {
  expenses: ExpenseItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenAddExpense?: () => void;
}

export const ExpensePredictionSection: React.FC<ExpensePredictionSectionProps> = ({
  expenses,
  isLoading = false,
  onRefresh,
  onOpenAddExpense,
}) => {
  // Compute prediction strictly from live historical expenses in Firebase
  const prediction = useMemo(() => {
    return calculateExpensePrediction(expenses || []);
  }, [expenses]);

  const {
    hasEnoughData,
    message,
    algorithmUsed,
    currentMonthKey,
    currentMonthName,
    currentMonthExpense,
    nextMonthName,
    predictedNextMonthExpense,
    differenceAmount,
    percentageChange,
    trendDirection,
    monthlyHistory,
    categoryBreakdown,
    chartData,
    summaryNote,
  } = prediction;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Bar with Realtime Status */}
      <div className="glass-card p-6 rounded-3xl border border-violet-100/70 bg-gradient-to-r from-white via-violet-50/20 to-purple-50/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200">
              Machine Predictive Analysis
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              Live Firebase Records ({expenses.length} vouchers logged)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Monthly Expense Prediction & Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Statistical forecasting derived exclusively from actual historical monthly expenditures stored in Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition shadow-xs flex items-center gap-1 text-xs font-bold"
              title="Refresh ledger and re-run prediction"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-violet-600" : ""}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          )}
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 flex items-center gap-1.5 transition hover:scale-102"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense Voucher</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. NEXT MONTH PREDICTION CARD */}
      {hasEnoughData ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 translate-y-12 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-400/30">
                    <Sparkles className="w-4 h-4 text-violet-300" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    Forecast for {nextMonthName}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Next Month Expense Prediction
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {summaryNote} Automatically re-computes as new vouchers are posted.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Algorithm: {algorithmUsed}
                </span>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Predicted Next Month Total Expense */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-violet-500/30 shadow-inner space-y-1">
                <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">
                  Predicted Total Expense
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs text-violet-400 font-bold">₹</span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {predictedNextMonthExpense.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Estimated budget for {nextMonthName}
                </p>
              </div>

              {/* Metric 2: Current Month Expense */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Month Expense
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs text-slate-400 font-bold">₹</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-200 tracking-tight">
                    {currentMonthExpense.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Actual logged in {currentMonthName}
                </p>
              </div>

              {/* Metric 3: Variance / Difference from Current Month */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Variance vs Current Month
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {differenceAmount >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-rose-400" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                  )}
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      differenceAmount >= 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {differenceAmount >= 0 ? "+" : "-"}₹
                    {Math.abs(differenceAmount).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {differenceAmount >= 0 ? "Higher outflow forecasted" : "Reduced expenditure expected"}
                </p>
              </div>

              {/* Metric 4: Expected Increase/Decrease Percentage */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Forecasted Rate of Change
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-lg font-black ${
                      percentageChange >= 0
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {percentageChange >= 0 ? "+" : ""}
                    {percentageChange}%
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {trendDirection === "increase" ? "Projected Surge" : "Savings Trend"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Based on historical weighted trajectory
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Insufficient Data Guard */
        <div className="p-8 rounded-3xl bg-amber-50/70 border border-amber-200/80 text-amber-900 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 border border-amber-200 text-amber-700 rounded-2xl shrink-0">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/60 text-amber-800">
                Data Requirement Alert
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Not enough historical data for reliable prediction.
              </h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Statistical expense prediction strictly models verified historical data stored in Firebase. We require expense vouchers across at least <strong>2 distinct monthly cycles</strong> (e.g. June, July, August) to calculate weighted moving averages and trend slopes without generating fabricated projections.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Current database records: <strong>{monthlyHistory.length}</strong> month(s) available.
                </span>
              </div>
            </div>
          </div>

          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 shrink-0 transition"
            >
              Log Past or Current Expense
            </button>
          )}
        </div>
      )}

      {/* 3. EXPENSE PREDICTION CHART: Historical Monthly Expenses + Next Month Prediction */}
      <div className="glass-card p-6 rounded-3xl border border-violet-100/70 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              <h3 className="text-base font-bold text-slate-900">
                Historical Monthly Expenses + Next Month Prediction Chart
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative visualization of actual monthly outlays alongside the mathematical forecast
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-violet-600" />
              <span>Historical Actual</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-purple-500 bg-purple-100" />
              <span>Next Month Prediction</span>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 25, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  fontSize={11}
                  fontWeight={600}
                />
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
                    borderRadius: "14px",
                    color: "#FFF",
                    fontSize: "12px",
                  }}
                />
                {/* Historical Bars */}
                <Bar
                  dataKey="historical"
                  name="historical"
                  fill="#7C3AED"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={45}
                />
                {/* Prediction Bar */}
                <Bar
                  dataKey="predicted"
                  name="predicted"
                  fill="#C084FC"
                  stroke="#7C3AED"
                  strokeDasharray="4 4"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={45}
                />
                {/* Connecting Trend Line */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#4C1D95"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#4C1D95" }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#9333EA"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 5, fill: "#A855F7" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
            <Calendar className="w-8 h-8 text-slate-300" />
            <p>No monthly expense vouchers recorded in Firestore yet.</p>
          </div>
        )}
      </div>

      {/* 4. MONTHLY EXPENSE ANALYSIS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Previous Months' Total Expenses & Trend */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-violet-100/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                Monthly Expense Analysis Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Audited monthly total expenses recorded chronologically in Firebase
              </p>
            </div>
            <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-xl border border-violet-100">
              {monthlyHistory.length} Monthly Cycle(s)
            </span>
          </div>

          {monthlyHistory.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {monthlyHistory.map((m, idx) => {
                const prev = idx > 0 ? monthlyHistory[idx - 1].totalAmount : null;
                const diff = prev !== null ? m.totalAmount - prev : null;
                const pct = prev !== null && prev > 0 ? Number(((diff! / prev) * 100).toFixed(1)) : null;

                return (
                  <div
                    key={m.monthKey}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {m.monthName}
                        </span>
                        {m.monthKey === currentMonthKey && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                            Current Month
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {m.voucherCount} expense voucher(s) logged in this cycle
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      {diff !== null && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 ${
                            diff > 0
                              ? "bg-rose-50 text-rose-700"
                              : diff < 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {pct}%
                        </span>
                      )}
                      <div>
                        <p className="text-base font-black text-slate-900">
                          ₹{m.totalAmount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Outflow</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Next Month Predicted Entry in Ledger */}
              {hasEnoughData && (
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-violet-50/60 px-3 rounded-2xl border border-violet-200/70 mt-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span className="font-black text-sm text-violet-950">
                        {nextMonthName} (Predicted Target)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-200 text-violet-800">
                        Forecast
                      </span>
                    </div>
                    <p className="text-[11px] text-violet-700">
                      Calculated via {algorithmUsed}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        differenceAmount >= 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {percentageChange >= 0 ? "+" : ""}
                      {percentageChange}% vs current
                    </span>
                    <div>
                      <p className="text-lg font-black text-violet-900">
                        ₹{predictedNextMonthExpense.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-violet-600 font-bold uppercase">Estimated Budget</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No historical records available to display.
            </div>
          )}
        </div>

        {/* Right Column: Expense Breakdown by Existing Categories */}
        <div className="glass-card p-6 rounded-3xl border border-violet-100/70 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                Category Breakdown
              </h3>
              <p className="text-xs text-slate-500">Distribution across actual project categories</p>
            </div>

            {categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 truncate max-w-[180px]">{cat.category}</span>
                      <span className="text-slate-900 font-bold">
                        ₹{cat.amount.toLocaleString("en-IN")}{" "}
                        <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-600 to-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No categorical expense entries found.
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1 mt-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Audit Verification</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every staff salary disbursement and utility bill recorded in Central Finance updates the underlying historical data and recalibrates this prediction automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
