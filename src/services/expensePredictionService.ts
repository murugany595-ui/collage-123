import { ExpenseItem } from "../types";

export interface MonthlyExpenseRecord {
  monthKey: string; // e.g. "2026-06"
  monthName: string; // e.g. "June 2026"
  shortMonth: string; // e.g. "Jun"
  fullMonth: string; // e.g. "June"
  year: number;
  monthIndex: number; // 0-11
  totalAmount: number;
  voucherCount: number;
  categoryTotals: Record<string, number>;
}

export interface ExpenseCategoryStat {
  category: string;
  amount: number;
  percentage: number;
  voucherCount: number;
  isHighest: boolean;
}

export interface ExpenseInsightItem {
  id: string;
  type: "positive" | "warning" | "neutral" | "info";
  title: string;
  message: string;
  metric?: string;
}

export interface ExpensePredictionResult {
  hasEnoughData: boolean;
  dataStatus: "empty" | "single_month" | "limited" | "sufficient";
  message?: string;
  algorithmUsed: "Weighted Moving Average + Trend" | "Moving Average" | "Baseline Projection" | "None";
  totalExpenses: number;
  totalVoucherCount: number;
  currentMonthKey: string;
  currentMonthName: string;
  currentMonthExpense: number;
  previousMonthKey: string;
  previousMonthName: string;
  previousMonthExpense: number;
  expenseGrowthPercentage: number;
  growthDirection: "increase" | "decrease" | "neutral";
  nextMonthKey: string;
  nextMonthName: string;
  predictedNextMonthExpense: number;
  differenceAmount: number;
  percentageChange: number;
  trendDirection: "increase" | "decrease" | "neutral";
  trendText: "Increasing" | "Decreasing" | "Stable";
  explanation: string;
  confidenceLevel: "none" | "limited" | "moderate" | "high";
  confidenceBadge: string;
  highestCategory: ExpenseCategoryStat | null;
  monthlyHistory: MonthlyExpenseRecord[];
  categoryBreakdown: ExpenseCategoryStat[];
  monthlyTrendChartData: Array<{
    month: string;
    fullMonthName: string;
    monthKey: string;
    amount: number;
    voucherCount: number;
  }>;
  actualVsPredictedChartData: Array<{
    month: string;
    monthKey: string;
    actual: number | null;
    predicted: number | null;
    isPrediction: boolean;
  }>;
  insights: ExpenseInsightItem[];
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
    expense.month ||
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
    const amount = Number(exp.amount_inr !== undefined ? exp.amount_inr : (exp.amount || 0));
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
    const fullMonth = monthIndex >= 0 && monthIndex < 12 ? MONTH_NAMES[monthIndex] : key;
    const shortM = monthIndex >= 0 && monthIndex < 12 ? SHORT_MONTHS[monthIndex] : key;

    return {
      monthKey: key,
      monthName: `${fullMonth} ${year}`,
      shortMonth: `${shortM} ${year}`,
      fullMonth: fullMonth,
      year,
      monthIndex,
      totalAmount: Math.round(monthMap[key].total),
      voucherCount: monthMap[key].count,
      categoryTotals: monthMap[key].categories,
    };
  });

  // Total all-time expenses & voucher count
  const totalExpenses = Math.round(Object.values(globalCategoryMap).reduce((acc, v) => acc + v, 0));
  const totalVoucherCount = Object.values(monthMap).reduce((acc, v) => acc + v.count, 0);

  // Category breakdown across all records
  const categoryCounts: Record<string, number> = {};
  for (const exp of expenses) {
    const cat = exp.category || "Other Expenses";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const rawCategories = Object.entries(globalCategoryMap).sort((a, b) => b[1] - a[1]);
  const highestAmount = rawCategories.length > 0 ? rawCategories[0][1] : 0;

  const categoryBreakdown: ExpenseCategoryStat[] = rawCategories.map(([category, amount], idx) => ({
    category,
    amount: Math.round(amount),
    percentage: totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(1)) : 0,
    voucherCount: categoryCounts[category] || 0,
    isHighest: idx === 0 && amount > 0,
  }));

  const highestCategory: ExpenseCategoryStat | null = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Determine current and previous reference months
  const now = new Date();
  const currentCalendarKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  // If calendar current month has data, use it; otherwise use the latest recorded month
  const currentMonthKey = sortedKeys.includes(currentCalendarKey)
    ? currentCalendarKey
    : sortedKeys.length > 0
    ? sortedKeys[sortedKeys.length - 1]
    : currentCalendarKey;

  const currentMonthData = monthlyHistory.find((m) => m.monthKey === currentMonthKey) || monthlyHistory[monthlyHistory.length - 1];
  const currentMonthExpense = currentMonthData ? currentMonthData.totalAmount : 0;
  const currentMonthName = formatMonthName(currentMonthKey, false);

  // Identify previous month
  const currentMonthIdxInHistory = monthlyHistory.findIndex((m) => m.monthKey === currentMonthKey);
  const previousMonthData = currentMonthIdxInHistory > 0 ? monthlyHistory[currentMonthIdxInHistory - 1] : null;
  const previousMonthExpense = previousMonthData ? previousMonthData.totalAmount : 0;
  const previousMonthKey = previousMonthData ? previousMonthData.monthKey : "";
  const previousMonthName = previousMonthData ? previousMonthData.monthName : "Previous Month";

  // Growth calculation between current month and previous month
  const expenseGrowthPercentage =
    previousMonthExpense > 0
      ? Number((((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100).toFixed(1))
      : 0;

  const growthDirection: "increase" | "decrease" | "neutral" =
    currentMonthExpense > previousMonthExpense
      ? "increase"
      : currentMonthExpense < previousMonthExpense
      ? "decrease"
      : "neutral";

  // Next month keys
  const nextMonthKey = getNextMonthKey(currentMonthKey);
  const nextMonthName = formatMonthName(nextMonthKey, false);

  // Monthly trend chart data (pure historical series)
  const monthlyTrendChartData = monthlyHistory.map((m) => ({
    month: m.shortMonth,
    fullMonthName: m.monthName,
    monthKey: m.monthKey,
    amount: m.totalAmount,
    voucherCount: m.voucherCount,
  }));

  // Handle Situation 1: No expense data in Firebase at all
  if (sortedKeys.length === 0) {
    return {
      hasEnoughData: false,
      dataStatus: "empty",
      message: "No expense data available yet.",
      algorithmUsed: "None",
      totalExpenses: 0,
      totalVoucherCount: 0,
      currentMonthKey,
      currentMonthName,
      currentMonthExpense: 0,
      previousMonthKey: "",
      previousMonthName: "",
      previousMonthExpense: 0,
      expenseGrowthPercentage: 0,
      growthDirection: "neutral",
      nextMonthKey,
      nextMonthName,
      predictedNextMonthExpense: 0,
      differenceAmount: 0,
      percentageChange: 0,
      trendDirection: "neutral",
      trendText: "Stable",
      explanation: "No expense records have been logged in the database yet.",
      confidenceLevel: "none",
      confidenceBadge: "No expense data available yet.",
      highestCategory: null,
      monthlyHistory: [],
      categoryBreakdown: [],
      monthlyTrendChartData: [],
      actualVsPredictedChartData: [],
      insights: [
        {
          id: "no-data",
          type: "info",
          title: "System Ready for Expense Logging",
          message: "No expense vouchers logged yet. Once expenses are added, automated analytics and predictive models will activate immediately.",
        },
      ],
      summaryNote: "No expense records found in Firebase Firestore.",
    };
  }

  // Handle Situation 2: Only one month of data
  if (sortedKeys.length === 1) {
    const singleActualVsPredicted = [
      {
        month: monthlyHistory[0].shortMonth,
        monthKey: monthlyHistory[0].monthKey,
        actual: monthlyHistory[0].totalAmount,
        predicted: null,
        isPrediction: false,
      },
    ];

    const singleMonthInsights: ExpenseInsightItem[] = [];
    if (highestCategory) {
      singleMonthInsights.push({
        id: "cat-highest",
        type: "info",
        title: "Primary Cost Center",
        message: `${highestCategory.category} is currently the primary expense category, accounting for ${highestCategory.percentage}% of logged expenditures.`,
        metric: `₹${highestCategory.amount.toLocaleString("en-IN")}`,
      });
    }
    singleMonthInsights.push({
      id: "data-needed",
      type: "warning",
      title: "Historical Cycles Required",
      message: "More historical monthly cycles are required for reliable automated prediction. At least 2 distinct monthly cycles are needed to establish baseline trends.",
      metric: "1 Month Recorded",
    });

    return {
      hasEnoughData: false,
      dataStatus: "single_month",
      message: "More historical data is required for reliable prediction.",
      algorithmUsed: "Baseline Projection",
      totalExpenses,
      totalVoucherCount,
      currentMonthKey,
      currentMonthName,
      currentMonthExpense,
      previousMonthKey: "",
      previousMonthName: "",
      previousMonthExpense: 0,
      expenseGrowthPercentage: 0,
      growthDirection: "neutral",
      nextMonthKey,
      nextMonthName,
      predictedNextMonthExpense: currentMonthExpense, // Baseline equals single month
      differenceAmount: 0,
      percentageChange: 0,
      trendDirection: "neutral",
      trendText: "Stable",
      explanation: "More historical data is required for reliable prediction. Baseline estimate reflects current month volume.",
      confidenceLevel: "none",
      confidenceBadge: "More historical data is required for reliable prediction.",
      highestCategory,
      monthlyHistory,
      categoryBreakdown,
      monthlyTrendChartData,
      actualVsPredictedChartData: singleActualVsPredicted,
      insights: singleMonthInsights,
      summaryNote: "More historical data is required for reliable prediction. Log additional monthly records to unlock machine trend forecasting.",
    };
  }

  // Handle Situation 3: 2 or more months of data available for predictive modeling
  const isLimited = sortedKeys.length < 4;
  const recentWindow = monthlyHistory.slice(-Math.min(sortedKeys.length, 6));
  const seriesValues = recentWindow.map((m) => m.totalAmount);
  const k = seriesValues.length;

  // A) Weighted Moving Average (WMA)
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < k; i++) {
    const weight = i + 1;
    weightedSum += seriesValues[i] * weight;
    weightTotal += weight;
  }
  const wma = weightedSum / weightTotal;

  // B) Linear Trend Slope Calculation
  let totalDelta = 0;
  for (let i = 1; i < k; i++) {
    totalDelta += seriesValues[i] - seriesValues[i - 1];
  }
  const avgDelta = totalDelta / (k - 1);
  const trendPrediction = seriesValues[k - 1] + avgDelta;

  // C) Balanced Ensemble Forecast
  // When limited (2-3 months): 75% WMA + 25% Trend Slope
  // When mature (4+ months): 60% WMA + 40% Trend Slope
  const wmaWeight = isLimited ? 0.75 : 0.60;
  const trendWeight = 1.0 - wmaWeight;
  const rawPredicted = wmaWeight * wma + trendWeight * trendPrediction;
  const predictedNextMonthExpense = Math.max(0, Math.round(rawPredicted));

  // Variance relative to current active month
  const differenceAmount = Math.round(predictedNextMonthExpense - currentMonthExpense);
  const percentageChange =
    currentMonthExpense > 0
      ? Number(((differenceAmount / currentMonthExpense) * 100).toFixed(1))
      : 0;

  const trendDirection: "increase" | "decrease" | "neutral" =
    differenceAmount > 500 ? "increase" : differenceAmount < -500 ? "decrease" : "neutral";

  const trendText: "Increasing" | "Decreasing" | "Stable" =
    trendDirection === "increase" ? "Increasing" : trendDirection === "decrease" ? "Decreasing" : "Stable";

  // Data-driven explanation
  let explanation = "";
  if (trendDirection === "increase") {
    explanation = `Based on recent monthly expense trends, expenses are expected to increase next month by ₹${differenceAmount.toLocaleString("en-IN")} (+${percentageChange}%).`;
  } else if (trendDirection === "decrease") {
    explanation = `Based on recent expenditure patterns, expenses are projected to decrease next month by ₹${Math.abs(differenceAmount).toLocaleString("en-IN")} (${percentageChange}%).`;
  } else {
    explanation = `Based on consistent historical data, expenses are expected to remain stable next month around ₹${predictedNextMonthExpense.toLocaleString("en-IN")}.`;
  }

  const confidenceLevel = isLimited ? "limited" : "high";
  const confidenceBadge = isLimited
    ? "Prediction is based on limited historical data."
    : `High confidence based on ${sortedKeys.length} historical monthly cycles`;

  const algorithmUsed = isLimited ? "Moving Average" : "Weighted Moving Average + Trend";

  // Build Actual vs Predicted Chart Series
  const actualVsPredictedChartData: Array<{
    month: string;
    monthKey: string;
    actual: number | null;
    predicted: number | null;
    isPrediction: boolean;
  }> = monthlyHistory.map((m) => ({
    month: m.shortMonth,
    monthKey: m.monthKey,
    actual: m.totalAmount,
    predicted: null,
    isPrediction: false,
  }));

  // Bridge point at the latest historical month so the forecast line connects smoothly
  if (actualVsPredictedChartData.length > 0) {
    actualVsPredictedChartData[actualVsPredictedChartData.length - 1].predicted =
      actualVsPredictedChartData[actualVsPredictedChartData.length - 1].actual;
  }

  // Next Month forecast node
  actualVsPredictedChartData.push({
    month: `${formatMonthName(nextMonthKey, true)} (Forecast)`,
    monthKey: nextMonthKey,
    actual: null,
    predicted: predictedNextMonthExpense,
    isPrediction: true,
  });

  // Dynamically generate genuine data insights based on real numbers
  const insights: ExpenseInsightItem[] = [];

  // Insight 1: Highest Expense Category
  if (highestCategory && highestCategory.amount > 0) {
    insights.push({
      id: "highest-cat",
      type: "info",
      title: `${highestCategory.category} is Highest Category`,
      message: `${highestCategory.category} accounts for ₹${highestCategory.amount.toLocaleString("en-IN")} (${highestCategory.percentage}% of total college expenditure).`,
      metric: `${highestCategory.percentage}% share`,
    });
  }

  // Insight 2: Month-over-Month change
  if (previousMonthData && previousMonthExpense > 0) {
    const isUp = currentMonthExpense >= previousMonthExpense;
    const diff = Math.abs(currentMonthExpense - previousMonthExpense);
    insights.push({
      id: "mom-change",
      type: isUp ? "warning" : "positive",
      title: isUp ? "Monthly Expenses Increased" : "Monthly Expenses Decreased",
      message: `Monthly expenses ${isUp ? "increased" : "decreased"} by ₹${diff.toLocaleString("en-IN")} (${Math.abs(expenseGrowthPercentage)}%) compared with the previous month (${previousMonthName}).`,
      metric: `${isUp ? "+" : "-"}${Math.abs(expenseGrowthPercentage)}%`,
    });
  }

  // Insight 3: Category Trend for Staff Salary or Electricity
  const salaryCat = categoryBreakdown.find((c) => c.category.toLowerCase().includes("salary"));
  const ebCat = categoryBreakdown.find((c) => c.category.toLowerCase().includes("electric"));

  if (ebCat && ebCat.amount > 0) {
    insights.push({
      id: "eb-insight",
      type: "neutral",
      title: "Utility Outflows Monitored",
      message: `Electricity and utility payments represent ₹${ebCat.amount.toLocaleString("en-IN")} (${ebCat.percentage}% of total costs across ${ebCat.voucherCount} bills).`,
      metric: `₹${ebCat.amount.toLocaleString("en-IN")}`,
    });
  }

  // Insight 4: Prediction Outlook
  insights.push({
    id: "pred-outlook",
    type: trendDirection === "increase" ? "warning" : "positive",
    title: trendDirection === "increase" ? "Next Month Outflow Expanding" : "Next Month Outflow Stabilizing",
    message: explanation,
    metric: `${trendDirection === "increase" ? "+" : ""}${percentageChange}% expected`,
  });

  // Insight 5: Growth momentum note
  if (sortedKeys.length >= 3) {
    const m1 = seriesValues[k - 3] || 0;
    const m2 = seriesValues[k - 2] || 0;
    const m3 = seriesValues[k - 1] || 0;
    const prevDelta = m2 - m1;
    const currDelta = m3 - m2;

    if (currDelta < prevDelta) {
      insights.push({
        id: "growth-slowed",
        type: "positive",
        title: "Expense Growth Deceleration",
        message: "Expense growth has slowed compared with the previous monthly cycle, indicating stabilizing operational expenditure.",
        metric: "Decelerating",
      });
    } else if (currDelta > prevDelta && currDelta > 0) {
      insights.push({
        id: "growth-accelerated",
        type: "warning",
        title: "Expenditure Velocity Accelerating",
        message: "Month-over-month expenditure velocity is accelerating across college operational accounts.",
        metric: "Accelerating",
      });
    }
  }

  const summaryNote = `Forecast derived from ${sortedKeys.length} historical months in Firestore using a ${algorithmUsed} model (${
    percentageChange >= 0 ? "+" : ""
  }${percentageChange}% change expected).`;

  return {
    hasEnoughData: true,
    dataStatus: isLimited ? "limited" : "sufficient",
    algorithmUsed,
    totalExpenses,
    totalVoucherCount,
    currentMonthKey,
    currentMonthName,
    currentMonthExpense,
    previousMonthKey,
    previousMonthName,
    previousMonthExpense,
    expenseGrowthPercentage,
    growthDirection,
    nextMonthKey,
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
    monthlyHistory,
    categoryBreakdown,
    monthlyTrendChartData,
    actualVsPredictedChartData,
    insights,
    summaryNote,
  };
}
