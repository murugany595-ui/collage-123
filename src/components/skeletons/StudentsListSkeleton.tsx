import React from "react";

export interface StudentsTableSkeletonRowsProps {
  count?: number;
}

export const StudentsTableSkeletonRows: React.FC<StudentsTableSkeletonRowsProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <tr key={idx} className="border-b border-violet-100/40">
          {/* Student name & avatar */}
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-violet-200/70 animate-pulse shrink-0" />
              <div className="space-y-1.5 min-w-[120px]">
                <div
                  className="h-3.5 rounded-md bg-slate-200 animate-pulse"
                  style={{ width: `${80 + (idx % 3) * 20}px` }}
                />
                <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
          </td>

          {/* Student ID */}
          <td className="px-6 py-4">
            <div className="h-3.5 w-20 rounded bg-slate-200 animate-pulse font-mono" />
          </td>

          {/* Department / Grade */}
          <td className="px-6 py-4">
            <div className="h-6 w-24 rounded-xl bg-violet-100/70 animate-pulse" />
          </td>

          {/* Parent / Guardian */}
          <td className="px-6 py-4">
            <div className="space-y-1">
              <div
                className="h-3.5 rounded bg-slate-200 animate-pulse"
                style={{ width: `${70 + (idx % 2) * 25}px` }}
              />
              <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
            </div>
          </td>

          {/* Fee Status */}
          <td className="px-6 py-4">
            <div className="h-5 w-24 rounded-full bg-violet-100/70 animate-pulse" />
          </td>

          {/* Account Status */}
          <td className="px-6 py-4">
            <div className="h-5 w-16 rounded-full bg-emerald-100/70 animate-pulse" />
          </td>

          {/* Actions */}
          <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <div className="w-7 h-7 rounded-xl bg-slate-100 animate-pulse" />
              <div className="w-7 h-7 rounded-xl bg-slate-100 animate-pulse" />
              <div className="w-7 h-7 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

export const StudentsListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading student records...">
      {/* Top Header & Search Controls Skeleton */}
      <div className="glass-card p-6 rounded-3xl border border-white/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shimmer-container">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Bar Skeleton */}
          <div className="h-10 min-w-[240px] flex-1 rounded-2xl bg-slate-100/90 border border-violet-100/60 animate-pulse" />
          {/* Filter Dropdown 1 Skeleton */}
          <div className="h-10 w-36 sm:w-44 rounded-2xl bg-slate-100/90 border border-violet-100/60 animate-pulse" />
          {/* Filter Dropdown 2 Skeleton */}
          <div className="h-10 w-32 rounded-2xl bg-slate-100/90 border border-violet-100/60 animate-pulse" />
        </div>

        {/* Action Button Skeleton */}
        <div className="h-10 w-32 rounded-2xl bg-violet-200/80 animate-pulse self-start lg:self-auto" />
      </div>

      {/* Students Directory Glass Table Skeleton */}
      <div className="glass-card rounded-3xl border border-white/80 shadow-xs overflow-hidden shimmer-container">
        <div className="p-5 border-b border-violet-100/60 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4.5 w-36 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-3 w-48 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-6 w-28 rounded-full bg-violet-100/80 animate-pulse" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-violet-100/60 bg-violet-50/30">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Student ID</th>
                <th className="px-6 py-3.5">Department / Grade</th>
                <th className="px-6 py-3.5">Parent / Guardian</th>
                <th className="px-6 py-3.5">Fee Status</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/40">
              <StudentsTableSkeletonRows count={7} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
