import React from "react";
import {
  User,
  ShieldCheck,
  Building,
  Calendar,
  Phone,
  Mail,
  Users,
  Lock,
  Layers,
  Sparkles,
  Info,
  Hash,
} from "lucide-react";
import { Student } from "../../services/firebase/studentService";

export interface StudentProfileSectionProps {
  student: Student | null;
  loading: boolean;
}

export const StudentProfileSection: React.FC<StudentProfileSectionProps> = ({
  student,
  loading,
}) => {
  if (loading && !student) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-white/80 shadow-xs space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-32 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const sName = student?.name || "Student Name";
  const sReg = student?.registerNumber || student?.rollNo || student?.id || "REG-UNKNOWN";
  const sDept = (student?.department || "CSE").toUpperCase();
  const sYear = student?.year || "3rd Year";
  const sSection = student?.section || "Section A";
  const sDob = student?.dateOfBirth || student?.dob || "2005-05-14";
  const pName = student?.parentName || student?.guardian || "Parent / Guardian";
  const pPhone = student?.parentPhone || student?.guardianPhone || "+91 98401 23456";
  const sPhone = student?.phone || "Not provided";
  const sEmail = student?.email || `${sReg.toLowerCase()}@brightwood.edu`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Official Identity Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-violet-100/70 shadow-xs bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {sName.slice(0, 2).toUpperCase()}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {sName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active Student
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                <Hash className="w-3 h-3 text-slate-400" />
                Reg: {sReg}
              </span>
              <span>•</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {sDept} Department
              </span>
              <span>•</span>
              <span>{sYear}</span>
            </div>
          </div>
        </div>

        {/* Read-Only Notice Badge */}
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 max-w-sm shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Official Institutional Record (Read-Only)</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
            Student profile records are verified in Firebase. Only College Administration can modify student registration details.
          </p>
        </div>
      </div>

      {/* 9 General Student Profile Information Fields */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              General Student Information
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Firebase Department Master Record
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Student Name */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3 text-slate-400" />
              1. Student Name
            </span>
            <p className="text-base font-extrabold text-slate-900">{sName}</p>
          </div>

          {/* 2. Register Number */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-slate-400" />
              2. Register Number
            </span>
            <p className="text-base font-extrabold text-slate-900 font-mono tracking-tight text-blue-700">
              {sReg}
            </p>
          </div>

          {/* 3. Department */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3 h-3 text-slate-400" />
              3. Department
            </span>
            <p className="text-base font-extrabold text-slate-900">{sDept}</p>
          </div>

          {/* 4. Year */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              4. Year
            </span>
            <p className="text-base font-extrabold text-slate-900">{sYear}</p>
          </div>

          {/* 5. Section */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-400" />
              5. Section
            </span>
            <p className="text-base font-extrabold text-slate-900">{sSection}</p>
          </div>

          {/* 6. Date of Birth */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              6. Date of Birth
            </span>
            <p className="text-base font-extrabold text-slate-900">{sDob}</p>
          </div>

          {/* 7. Parent Name */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3 text-slate-400" />
              7. Parent Name
            </span>
            <p className="text-base font-extrabold text-slate-900">{pName}</p>
          </div>

          {/* 8. Parent Contact Number */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400" />
              8. Parent Contact Number
            </span>
            <p className="text-base font-extrabold text-slate-900 font-mono">{pPhone}</p>
          </div>

          {/* 9. Student Contact Number (if available) */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400" />
              9. Student Contact Number
            </span>
            <p className="text-base font-extrabold text-slate-900 font-mono">
              {sPhone || "Not provided"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
