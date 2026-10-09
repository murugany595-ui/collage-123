import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  GraduationCap,
  Sparkles,
  CreditCard,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";
import { StudentsListSkeleton, StudentsTableSkeletonRows } from "../components/skeletons";

export interface StudentsListPageProps {
  onNavigate?: (tab: string, studentId?: string) => void;
  onSelectStudent?: (student: any) => void;
  onCollectFee?: (invoice: any) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const StudentsListPage: React.FC<StudentsListPageProps> = ({
  onNavigate = () => {},
  onSelectStudent = () => {},
  onCollectFee = () => {},
  onShowToast = () => {},
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchStudents();
  }, [searchQuery]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getStudents(searchQuery);
      if (res.success) {
        setStudents(res.data || []);
      }
    } catch (err) {
      console.warn("Error fetching students from Firebase:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete student record for ${name}?`)) {
      try {
        await api.admin.deleteStudent(id);
        fetchStudents();
        onShowToast(`Student record for ${name} removed`, "info");
      } catch (err: any) {
        alert(err.message || "Failed to delete student");
      }
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesGrade =
      gradeFilter === "ALL" ||
      s.grade === gradeFilter ||
      (gradeFilter === "B.Tech AI&DS" &&
        (s.department === "aids" || s.grade?.includes("AI&DS") || s.grade?.includes("Data Science")));
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesGrade && matchesStatus;
  });

  if (loading && students.length === 0 && !searchQuery) {
    return <StudentsListSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Search Controls */}
      <div className="glass-card p-6 rounded-3xl border border-white/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-violet-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by student name, roll, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-violet-100/80 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white/70 shadow-2xs font-medium text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Department / Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs rounded-2xl border border-violet-100/80 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 bg-white/80 font-semibold text-slate-700 shadow-2xs"
          >
            <option value="ALL">All Departments</option>
            <option value="B.Tech AI&DS">B.Tech AI & Data Science (AI&DS)</option>
            <option value="B.Tech CSE">B.Tech Computer Science</option>
            <option value="B.Tech ECE">B.Tech Electronics</option>
            <option value="B.Tech MECH">B.Tech Mechanical</option>
            <option value="MBA">MBA Finance</option>
            <option value="B.Sc DS">B.Sc Data Science</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs rounded-2xl border border-violet-100/80 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 bg-white/80 font-semibold text-slate-700 shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => fetchStudents()}
            title="Refresh student list"
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/80 hover:bg-white text-slate-700 rounded-2xl text-xs font-semibold border border-violet-100 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-violet-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("add-student")}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all hover:scale-102 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Students Directory Glass Table */}
      <div className="glass-card rounded-3xl border border-white/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-violet-100/60 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Enrolled Students</h3>
            <p className="text-xs text-slate-400">Total {filteredStudents.length} student records found</p>
          </div>
          <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
            Active Registry
          </span>
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
              {loading ? (
                <StudentsTableSkeletonRows count={6} />
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const statusColors: Record<string, string> = {
                    Active: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                    Inactive: "bg-slate-100 text-slate-600 border-slate-200",
                    Suspended: "bg-rose-50 text-rose-700 border-rose-200/60",
                  };

                  return (
                    <tr key={s.id} className="hover:bg-violet-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                onSelectStudent(s);
                                onNavigate("student-details", s.id);
                              }}
                              className="font-bold text-slate-900 hover:text-violet-700 text-left block"
                            >
                              {s.name}
                            </button>
                            <span className="text-[10px] text-slate-400">Roll: {s.roll}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-700">{s.id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-xl border border-violet-100 font-bold text-[11px]">
                          {s.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{s.guardian || "Guardian"}</p>
                        <p className="text-[10px] text-slate-400">Parent/Guardian</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60">
                          <CreditCard className="w-3 h-3" /> Up to Date
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[s.status] || statusColors.Active
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              onSelectStudent(s);
                              onNavigate("student-details", s.id);
                            }}
                            title="View Profile"
                            className="p-2 text-slate-500 hover:text-violet-700 hover:bg-violet-100/60 rounded-xl transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const sId = s.id || s.studentId || s.registerNumber || s.rollNo || s.roll;
                              onSelectStudent(s);
                              onNavigate("edit-student", sId);
                            }}
                            title="Edit Student Details"
                            className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-100/60 rounded-xl transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            title="Delete Record"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-violet-100/60 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {filteredStudents.length} of {filteredStudents.length} students</span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-violet-100 text-slate-400 hover:bg-violet-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3.5 py-1 rounded-xl bg-violet-600 text-white font-bold shadow-2xs">1</span>
            <button className="p-2 rounded-xl border border-violet-100 text-slate-400 hover:bg-violet-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
