import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading dashboard...">
      {/* Header Banner Skeleton */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-violet-100/70 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shimmer-container">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-200/70 animate-pulse" />
            <div className="h-7 w-64 sm:w-80 rounded-xl bg-slate-200 animate-pulse" />
          </div>
          <div className="h-4 w-72 sm:w-96 rounded-lg bg-slate-100 animate-pulse ml-1" />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 rounded-2xl bg-slate-100 border border-slate-200/60 animate-pulse" />
          <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200/60 animate-pulse" />
          <div className="h-9 w-32 rounded-2xl bg-violet-200/80 animate-pulse" />
        </div>
      </div>

      {/* 9 Financial Summary Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Fees Collected */}
        <div className="glass-card p-5 rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 rounded-md bg-emerald-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-emerald-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-40 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-emerald-100/60">
            <div className="h-3 w-28 rounded bg-emerald-100/80 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 2: Pending Fees */}
        <div className="glass-card p-5 rounded-3xl border border-amber-100/80 bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-md bg-amber-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-amber-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-36 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-amber-100/60">
            <div className="h-3 w-32 rounded bg-amber-100/80 animate-pulse" />
            <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 3: Exam Fees Collected */}
        <div className="glass-card p-5 rounded-3xl border border-violet-100/80 bg-gradient-to-br from-white via-violet-50/20 to-purple-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 rounded-md bg-violet-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-violet-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-36 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-violet-100/60">
            <div className="h-3 w-24 rounded bg-violet-100/80 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 4: Pending Exam Fees */}
        <div className="glass-card p-5 rounded-3xl border border-rose-100/80 bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 rounded-md bg-rose-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-rose-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-36 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-rose-100/60">
            <div className="h-3 w-28 rounded bg-rose-100/80 animate-pulse" />
            <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 5: Total Expenses */}
        <div className="glass-card p-5 rounded-3xl border border-pink-100/80 bg-gradient-to-br from-white via-pink-50/20 to-purple-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-md bg-pink-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-pink-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-40 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-pink-100/60">
            <div className="h-3 w-28 rounded bg-pink-100/80 animate-pulse" />
            <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 6: This Month Expenses */}
        <div className="glass-card p-5 rounded-3xl border border-purple-100/80 bg-gradient-to-br from-white via-purple-50/20 to-violet-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 rounded-md bg-purple-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-purple-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-36 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-purple-100/60">
            <div className="h-3 w-32 rounded bg-purple-100/80 animate-pulse" />
            <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 7: Staff Salary */}
        <div className="glass-card p-5 rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-md bg-indigo-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-indigo-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-36 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-indigo-100/60">
            <div className="h-3 w-28 rounded bg-indigo-100/80 animate-pulse" />
            <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 8: Electricity Bill */}
        <div className="glass-card p-5 rounded-3xl border border-amber-100/80 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 shadow-xs flex flex-col justify-between h-[142px] shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-md bg-amber-200/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-amber-100/80 animate-pulse" />
          </div>
          <div className="h-8 w-32 rounded-xl bg-slate-200 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-amber-100/60">
            <div className="h-3 w-32 rounded bg-amber-100/80 animate-pulse" />
            <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Card 9: Remaining Balance Hero Card */}
        <div className="glass-card p-5 rounded-3xl border-2 border-violet-400/80 bg-gradient-to-br from-violet-600 to-purple-700 shadow-md flex flex-col justify-between h-[142px] text-white shimmer-container">
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 rounded-md bg-violet-300/80 animate-pulse" />
            <div className="w-8 h-8 rounded-2xl bg-white/20 animate-pulse" />
          </div>
          <div className="h-8 w-44 rounded-xl bg-white/40 animate-pulse my-1.5" />
          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            <div className="h-3 w-32 rounded bg-violet-200/70 animate-pulse" />
            <div className="h-3 w-12 rounded bg-white/40 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Expense Prediction Banner Skeleton */}
      <div className="glass-card p-6 rounded-3xl border border-violet-900/30 bg-gradient-to-r from-violet-950 via-indigo-950 to-purple-950 text-white shimmer-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-700/60 animate-pulse" />
              <div className="h-3.5 w-52 rounded-md bg-violet-700/50 animate-pulse" />
              <div className="h-5 w-24 rounded-md bg-violet-800/80 animate-pulse" />
            </div>
            <div className="h-6 w-80 max-w-full rounded-xl bg-violet-400/40 animate-pulse" />
            <div className="h-3.5 w-96 max-w-full rounded-md bg-violet-600/30 animate-pulse" />
          </div>
          <div className="h-10 w-48 rounded-2xl bg-white/20 animate-pulse shrink-0" />
        </div>
      </div>

      {/* Quick Actions Navigation Grid Skeleton */}
      <div className="glass-card p-5 rounded-3xl border border-violet-100/60 shadow-xs space-y-3 shimmer-container">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-violet-300 animate-pulse" />
          <div className="h-3.5 w-48 rounded bg-slate-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center gap-2 h-[72px]"
            >
              <div className="w-5 h-5 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-2.5 w-14 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card Skeleton */}
        <div className="glass-card p-6 rounded-3xl border border-violet-100/60 shadow-xs lg:col-span-2 space-y-4 shimmer-container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="h-5 w-64 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-3.5 w-48 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="h-8 w-44 rounded-2xl bg-slate-100 animate-pulse" />
          </div>

          {/* Simulated chart wave bars */}
          <div className="h-72 w-full pt-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200/80 p-4 flex flex-col justify-between">
            <div className="flex justify-end gap-4">
              <div className="h-3 w-24 rounded bg-violet-200/70 animate-pulse" />
              <div className="h-3 w-24 rounded bg-pink-200/70 animate-pulse" />
            </div>

            <div className="flex items-end justify-between gap-2 h-44 px-2">
              {[45, 60, 52, 75, 58, 85, 70, 90].map((h, idx) => (
                <div key={idx} className="flex-1 flex items-end justify-center gap-1.5 h-full">
                  <div
                    className="w-1/2 bg-violet-300/40 rounded-t-lg animate-pulse"
                    style={{ height: `${h}%` }}
                  />
                  <div
                    className="w-1/2 bg-pink-300/30 rounded-t-lg animate-pulse"
                    style={{ height: `${Math.max(25, h - 20)}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between px-2 pt-2 border-t border-slate-200/60">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((m) => (
                <div key={m} className="h-2.5 w-6 rounded bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Expense Category Breakdown Skeleton */}
        <div className="glass-card p-6 rounded-3xl border border-violet-100/60 shadow-xs space-y-4 shimmer-container">
          <div className="space-y-1.5">
            <div className="h-5 w-48 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-3.5 w-40 rounded bg-slate-100 animate-pulse" />
          </div>

          {/* Donut graphic placeholder */}
          <div className="h-52 w-full flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-12 border-violet-100 border-t-purple-300 border-r-pink-200 border-b-blue-200 animate-pulse flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50" />
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-slate-200 animate-pulse" />
                </div>
                <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
