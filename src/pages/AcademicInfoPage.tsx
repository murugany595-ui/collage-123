import React, { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Users,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export interface AcademicInfoPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const AcademicInfoPage: React.FC<AcademicInfoPageProps> = ({ onShowToast = () => {} }) => {
  const [classes, setClasses] = useState([
    { id: "CLS-CSE5A", grade: "B.Tech CSE", section: "Sem 5 - Sec A", teacher: "Prof. Alan Turing", students: 64, capacity: 70, room: "Lab Block C-301" },
    { id: "CLS-CSE5B", grade: "B.Tech CSE", section: "Sem 5 - Sec B", teacher: "Dr. Marcus Reed", students: 60, capacity: 70, room: "Lab Block C-302" },
    { id: "CLS-ECE3A", grade: "B.Tech ECE", section: "Sem 3 - Sec A", teacher: "Dr. Elena Rostova", students: 58, capacity: 65, room: "Turing Hall 201" },
    { id: "CLS-MECH7A", grade: "B.Tech MECH", section: "Sem 7 - Sec A", teacher: "Prof. Robert Garcia", students: 52, capacity: 60, room: "Newton Workshop 105" },
    { id: "CLS-MBA1A", grade: "MBA Finance", section: "Sem 1 - Sec A", teacher: "Ms. Sarah Jenkins", students: 48, capacity: 55, room: "Business Wing 101" },
    { id: "CLS-BSC1A", grade: "B.Sc Data Science", section: "Sem 1 - Sec A", teacher: "Mr. David Kim", students: 50, capacity: 60, room: "Lecture Hall 4" },
  ]);

  const subjects = [
    { code: "CS-501", name: "Distributed Systems & Cloud Computing", faculty: "Prof. Alan Turing", classes: "B.Tech CSE Sem 5", credits: 4 },
    { code: "CS-502", name: "Database Internals & Big Data Analytics", faculty: "Dr. Marcus Reed", classes: "B.Tech CSE Sem 5", credits: 4 },
    { code: "EC-301", name: "Signals, Systems & Digital Processing", faculty: "Dr. Elena Rostova", classes: "B.Tech ECE Sem 3", credits: 4 },
    { code: "MBA-102", name: "Corporate Financial Analysis & Valuation", faculty: "Ms. Sarah Jenkins", classes: "MBA Sem 1", credits: 3 },
    { code: "DS-101", name: "Statistical Machine Learning & Python", faculty: "Mr. David Kim", classes: "B.Sc DS Sem 1", credits: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Departments</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">6 Departments</h3>
          <p className="text-xs text-slate-400 mt-1">Undergrad & Postgrad Programs</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Batches</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">32 Semesters</h3>
          <p className="text-xs text-slate-400 mt-1">Total Campus Capacity: 2,800</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Degree Courses</span>
          <h3 className="text-2xl font-black text-purple-600 mt-1">48 Modules</h3>
          <p className="text-xs text-slate-400 mt-1">Engineering, Science & Management</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Academic Session</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">2025-2026</h3>
          <p className="text-xs text-slate-400 mt-1">Active Autumn Semester</p>
        </div>
      </div>

      {/* Class & Section Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Department Batches & Classrooms</h3>
            <p className="text-xs text-slate-400">Head of Departments, lecture halls, and enrollment capacity</p>
          </div>
          <button
            onClick={() => onShowToast("Department batch configuration modal opened", "info")}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            + Add New Batch
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Department / Semester</th>
                <th className="px-6 py-4">Professor / Faculty Advisor</th>
                <th className="px-6 py-4">Student Enrollment</th>
                <th className="px-6 py-4">Batch Capacity</th>
                <th className="px-6 py-4">Lecture Hall / Lab</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
                        {cls.grade} • {cls.section}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{cls.teacher}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{cls.students} Enrolled</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${(cls.students / cls.capacity) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {Math.round((cls.students / cls.capacity) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{cls.room}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subjects & Faculty Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Course & Subject Catalog</h3>
            <p className="text-xs text-slate-400">Department faculty assignments and credit curriculum</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Faculty Head</th>
                <th className="px-6 py-4">Applicable Classes</th>
                <th className="px-6 py-4">Credit Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub.code} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-mono font-bold text-blue-700">{sub.code}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{sub.name}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{sub.faculty}</td>
                  <td className="px-6 py-4 text-slate-500">{sub.classes}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{sub.credits} Credits</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
