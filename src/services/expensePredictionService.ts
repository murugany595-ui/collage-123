import { ExpenseItem } from "../types";

export interface MonthlyExpenseRecord {
  monthKey: string; // e.g. "2026-06"
  monthName: string; // e.g. "June 2026"
  shortMonth: string; // e.g. "Jun 2026"
  year: number;
  monthIndex: number; // 0-11
  totalAmount: number;
  voucherCount: number;
  categoryTotals: Record<string, number>;
}

export interface ExpensePredictionResult {
  hasEnoughData: boolean;
  message?: string;
  algorithmUsed: "Weighted Moving Average + Trend" | "Moving Average" | "None";
  currentMonthKey: string;
  currentMonthName: string;
  currentMonthExpense: number;
  nextMonthKey: string;
  nextMonthName: string;
  predictedNextMonthExpense: number;
  differenceAmount: number;
  percentageChange: number;
  trendDirection: "increase" | "decrease" | "neutral";
  monthlyHistory: MonthlyExpenseRecord[];
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  chartData: Array<{
    month: string;
    monthKey: string;
    historical: number | null;
    predicted: number | null;
    isPrediction: boolean;
  }>;
  summaryNote: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Extracts and standardizes a 'YYYY-MM' key from various expense item date formats.
 */
export function extractMonthKey(expense: any): string | null {
  const candidate =
    expense.date ||
    expense.salary_month ||
    expense.billing_month ||
    expense.payment_date ||
    expense.created_at ||
    expense.createdAt;

  if (!candidate || typeof candidate !== "string") return null;

  const trimmed = candidate.trim();

  // Pattern: "YYYY-MM" or "YYYY-MM-DD" or ISO timestamp
  const isoMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = String(parseInt(isoMatch[2], 10)).padStart(2, "0");
    return `${year}-${month}`;
  }

  // Pattern: "Month YYYY" e.g. "August 2026" or "Aug 2026"
  const textMatch = trimmed.match(/([a-zA-Z]+)[,\s]+(\d{4})/);
  if (textMatch) {
    const rawMonth = textMatch[1].toLowerCase();
    const year = textMatch[2];
    const foundIdx = MONTH_NAMES.findIndex(
      (m, idx) =>
        m.toLowerCase() === rawMonth || SHORT_MONTHS[idx].toLowerCase() === rawMonth
    );
    if (foundIdx !== -1) {
      return `${year}-${String(foundIdx + 1).padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Given a month key "YYYY-MM", returns the subsequent month key "YYYY-MM"
 */
export function getNextMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatMonthName(monthKey: string, short = false): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;

  if (monthIdx >= 0 && monthIdx < 12) {
    const name = short ? SHORT_MONTHS[monthIdx] : MONTH_NAMES[monthIdx];
    return `${name} ${year}`;
  }
  return monthKey;
}

/**
 * Analyzes historical expenses stored in Firebase and computes the statistical prediction
 * for the next month using Weighted Moving Average (WMA) and linear trend projection.
 */
export function calculateExpensePrediction(
  expenses: ExpenseItem[] | any[]
): ExpensePredictionResult {
  // 1. Group actual valid expense records by monthKey
  const monthMap: Record<string, { total: number; count: number; categories: Record<string, number> }> = {};
  const globalCategoryMap: Record<string, number> = {};

  for (const exp of expenses) {
    const amount = Number(exp.amount || 0);
    if (isNaN(amount) || amount <= 0) continue;

    // Filter out cancelled expenses if flagged
    if (exp.payment_status && String(exp.payment_status).toLowerCase() === "cancelled") {
      continue;
    }

    const key = extractMonthKey(exp);
    if (!key) continue;

    if (!monthMap[key]) {
      monthMap[key] = { total: 0, count: 0, categories: {} };
    }

    monthMap[key].total += amount;
    monthMap[key].count += 1;

    const catName = exp.category || "Other Expenses";
    monthMap[key].categories[catName] = (monthMap[key].categories[catName] || 0) + amount;
    globalCategoryMap[catName] = (globalCategoryMap[catName] || 0) + amount;
  }

  // 2. Sort months chronologically
  const sortedKeys = Object.keys(monthMap).sort();

  const monthlyHistory: MonthlyExpenseRecord[] = sortedKeys.map((key) => {
    const [yStr, mStr] = key.split("-");
    const year = parseInt(yStr, 10);
    const monthIndex = parseInt(mStr, 10) - 1;
    return {
      monthKey: key,
      monthName: formatMonthName(key, false),
      shortMonth: formatMonthName(key, true),
      year,
      monthIndex,
      totalAmount: Math.round(monthMap[key].total),
      voucherCount: monthMap[key].count,
      categoryTotals: monthMap[key].categories,
    };
  });

  // Category breakdown across all records
  const totalAllTimeExpenses = Object.values(globalCategoryMap).reduce((acc, v) => acc + v, 0);
  const categoryBreakdown = Object.entries(globalCategoryMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: totalAllTimeExpenses > 0 ? Number(((amount / totalAllTimeExpenses) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Determine current active reference month
  const now = new Date();
  const currentCalendarKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  // Latest recorded month in dataset
  const latestMonthKey = sortedKeys.length > 0 ? sortedKeys[sortedKeys.length - 1] : currentCalendarKey;
  const currentMonthKey = sortedKeys.includes(currentCalendarKey) ? currentCalendarKey : latestMonthKey;
  const currentMonthData = monthlyHistory.find((m) => m.monthKey === currentMonthKey) || monthlyHistory[monthlyHistory.length - 1];
  const currentMonthExpense = currentMonthData ? currentMonthData.totalAmount : 0;
  const currentMonthName = formatMonthName(currentMonthKey, false);

  const nextMonthKey = getNextMonthKey(currentMonthKey);
  const nextMonthName = formatMonthName(nextMonthKey, false);

  // 3. Strict Check: Do we have enough historical monthly data for reliable prediction?
  // We require at least 2 distinct recorded monthly cycles to establish a historical trend.
  if (sortedKeys.length < 2) {
    const chartData = monthlyHistory.map((m) => ({
      month: m.shortMonth,
      monthKey: m.monthKey,
      historical: m.totalAmount,
      predicted: null,
      isPrediction: false,
    }));

    return {
      hasEnoughData: false,
      message: "Not enough historical data for reliable prediction.",
      algorithmUsed: "None",
      currentMonthKey,
      currentMonthName,
      currentMonthExpense,
      nextMonthKey,
      nextMonthName,
      predictedNextMonthExpense: 0,
      differenceAmount: 0,
      percentageChange: 0,
      trendDirection: "neutral",
      monthlyHistory,
      categoryBreakdown,
      chartData,
      summaryNote:
        "Prediction requires historical expenses from at least 2 consecutive monthly cycles stored in Firebase to forecast next month's outflow accurately.",
    };
  }

  // 4. Statistical Estimation Logic
  // We use the most recent 3 to 6 months of data
  const recentWindow = monthlyHistory.slice(-Math.min(sortedKeys.length, 6));
  const seriesValues = recentWindow.map((m) => m.totalAmount);
  const k = seriesValues.length;

  // A) Weighted Moving Average (WMA)
  // Higher weights to more recent months: weight_i = i for i in 1..k
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < k; i++) {
    const weight = i + 1;
    weightedSum += seriesValues[i] * weight;
    weightTotal += weight;
  }
  const wma = weightedSum / weightTotal;

  // B) Linear Trend Slope Calculation
  // Calculate average month-over-month change (slope)
  let totalDelta = 0;
  for (let i = 1; i < k; i++) {
    totalDelta += seriesValues[i] - seriesValues[i - 1];
  }
  const avgDelta = totalDelta / (k - 1);
  const trendPrediction = seriesValues[k - 1] + avgDelta;

  // C) Balanced Ensemble Prediction (65% WMA + 35% Trend Slope)
  const rawPredicted = 0.65 * wma + 0.35 * trendPrediction;
  // Ensure non-negative prediction
  const predictedNextMonthExpense = Math.max(0, Math.round(rawPredicted));

  // Compute variance & percentage change relative to current/latest month
  const differenceAmount = Math.round(predictedNextMonthExpense - currentMonthExpense);
  const percentageChange =
    currentMonthExpense > 0
      ? Number(((differenceAmount / currentMonthExpense) * 100).toFixed(1))
      : 0;

  const trendDirection: "increase" | "decrease" | "neutral" =
    differenceAmount > 0 ? "increase" : differenceAmount < 0 ? "decrease" : "neutral";

  // 5. Construct Visual Chart Series (Historical Months + Forecast Node)
  const chartData: Array<{
    month: string;
    monthKey: string;
    historical: number | null;
    predicted: number | null;
    isPrediction: boolean;
  }> = monthlyHistory.map((m) => ({
    month: m.shortMonth,
    monthKey: m.monthKey,
    historical: m.totalAmount,
    predicted: null,
    isPrediction: false,
  }));

  // Bridge point at the latest historical month so the forecast line connects smoothly
  if (chartData.length > 0) {
    chartData[chartData.length - 1].predicted = chartData[chartData.length - 1].historical;
  }

  // Next month predicted entry
  chartData.push({
    month: `${formatMonthName(nextMonthKey, true)} (Pred)`,
    monthKey: nextMonthKey,
    historical: null,
    predicted: predictedNextMonthExpense,
    isPrediction: true,
  });

  const algorithmUsed = k >= 3 ? "Weighted Moving Average + Trend" : "Moving Average";

  const summaryNote = `Predicted based on ${sortedKeys.length} historical months stored in Firebase using a ${algorithmUsed} model (${
    percentageChange >= 0 ? "+" : ""
  }${percentageChange}% change expected).`;

  return {
    hasEnoughData: true,
    algorithmUsed,
    currentMonthKey,
    currentMonthName,
    currentMonthExpense,
    nextMonthKey,
    nextMonthName,
    predictedNextMonthExpense,
    differenceAmount,
    percentageChange,
    trendDirection,
    monthlyHistory,
    categoryBreakdown,
    chartData,
    summaryNote,
  };
}
