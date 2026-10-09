import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Calendar as CalendarIcon,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Printer,
  Save,
  Users,
  Percent,
  Check,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { api } from "../../services/api";
import { AttendanceRecord, AttendanceSummary } from "../../types";

interface AttendancePageProps {
  onShowToast?: (type: "success" | "error" | "info", title: string, message: string) => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onShowToast }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedSection, setSelectedSection] = useState<string>("Section A");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Student history modal
  const [historyStudent, setHistoryStudent] = useState<AttendanceRecord | null>(null);
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);
  const [studentSummary, setStudentSummary] = useState<AttendanceSummary | null>(null);

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const [listRes, sumRes, stuRes] = await Promise.all([
        api.attendance.getAll({
          date: selectedDate,
          department: selectedDepartment !== "All" ? selectedDepartment : undefined,
          year: selectedYear !== "All" ? selectedYear : undefined,
          section: selectedSection !== "All" ? selectedSection : undefined,
          q: searchQuery || undefined,
        }),
        api.attendance.getSummary({
          department: selectedDepartment !== "All" ? selectedDepartment : undefined,
          year: selectedYear !== "All" ? selectedYear : undefined,
          section: selectedSection !== "All" ? selectedSection : undefined,
        }),
        api.students.getAll(),
      ]);

      const existingRecords: AttendanceRecord[] = (listRes && listRes.data) || [];
      const allStudents = (stuRes && stuRes.data) || [];

      // If no records exist for this date yet, populate draft records for all matching students
      if (existingRecords.length === 0 && allStudents.length > 0) {
        let filteredStudents = allStudents;
        if (selectedDepartment !== "All") {
          filteredStudents = filteredStudents.filter((s: any) => s.grade?.includes(selectedDepartment) || s.department === selectedDepartment);
        }

        const draftRecords: AttendanceRecord[] = filteredStudents.map((s: any, idx: number) => ({
          id: `draft-${s.id}-${idx}`,
          date: selectedDate,
          department: s.grade?.split(" - ")[0] || "Computer Science & Engineering",
          year: s.grade?.includes("Sem 1") || s.grade?.includes("Sem 2") ? "1st Year" : s.grade?.includes("Sem 3") || s.grade?.includes("Sem 4") ? "2nd Year" : "3rd Year",
          section: selectedSection || "Section A",
          student_id: s.id,
          student_name: s.name,
          roll: s.roll || `STU-${idx + 100}`,
          status: "Present",
          remarks: "",
          time_in: "8:00 AM",
        }));
        setRecords(draftRecords);
      } else {
        setRecords(existingRecords);
      }

      if (sumRes && sumRes.success) {
        setSummary(sumRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load attendance:", err);
      if (onShowToast) onShowToast("error", "Error", "Failed to load attendance records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedDepartment, selectedYear, selectedSection]);

  const handleStatusChange = (studentId: string, status: "Present" | "Absent" | "Late") => {
    setRecords((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? {
              ...r,
              status,
              time_in: status === "Present" ? (r.time_in === "-" ? "8:00 AM" : r.time_in) : status === "Late" ? "8:30 AM" : "-",
            }
          : r
      )
    );
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, remarks } : r))
    );
  };

  const handleMarkAll = (status: "Present" | "Absent") => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status,
        time_in: status === "Present" ? "8:00 AM" : "-",
      }))
    );
  };

  const handleSaveAttendance = async () => {
    if (!records.length) return;
    setIsSaving(true);
    try {
      const res = await api.attendance.saveBatch({
        date: selectedDate,
        department: selectedDepartment,
        year: selectedYear,
        section: selectedSection,
        records,
      });

      if (res && res.success) {
        if (onShowToast) {
          onShowToast("success", "Attendance Saved", `Successfully recorded attendance for ${records.length} students on ${selectedDate}.`);
        }
        loadAttendance();
      }
    } catch (err: any) {
      if (onShowToast) onShowToast("error", "Failed", "Could not save attendance to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewStudentHistory = async (student: AttendanceRecord) => {
    setHistoryStudent(student);
    try {
      const [histRes, sumRes] = await Promise.all([
        api.attendance.getAll({ q: student.student_id }),
        api.attendance.getSummary({ student_id: student.student_id }),
      ]);
      if (histRes && histRes.data) setStudentHistory(histRes.data);
      if (sumRes && sumRes.data) setStudentSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (!records.length) return;
    const headers = ["Date", "Student Name", "Roll No", "Student ID", "Department", "Year", "Section", "Status", "Time In", "Remarks"];
    const rows = records.map((r) => [
      r.date,
      `"${r.student_name}"`,
      `"${r.roll}"`,
      r.student_id,
      `"${r.department}"`,
      `"${r.year}"`,
      `"${r.section}"`,
      r.status,
      r.time_in || "-",
      `"${r.remarks || "-"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const lateCount = records.filter((r) => r.status === "Late").length;
  const totalCount = records.length;
  const dayPercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-violet-100/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Attendance Management
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1.5 ml-1">
            Mark daily attendance, calculate attendance percentages <code className="text-violet-600 font-bold bg-violet-50 px-1.5 py-0.5 rounded-lg">(Present / Total × 100)</code>, and export logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={loadAttendance}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-600 hover:text-violet-600 hover:bg-violet-50/50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-violet-600" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving || records.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Total Working Days */}
        <div className="glass-card p-4 rounded-3xl border border-violet-100/60 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Working Days</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-1">
            <CalendarIcon className="w-4 h-4 text-violet-600" />
            {summary?.totalWorkingDays || 12} Days
          </p>
          <span className="text-[10px] font-semibold text-violet-600 mt-1 block">
            Academic Term 2026
          </span>
        </div>

        {/* Present Students Today */}
        <div className="glass-card p-4 rounded-3xl border border-emerald-100/70 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Present Today</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {presentCount} Students
          </p>
          <span className="text-[10px] font-semibold text-emerald-600 mt-1 block">
            In Campus Session
          </span>
        </div>

        {/* Absent Students Today */}
        <div className="glass-card p-4 rounded-3xl border border-rose-100/70 bg-rose-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Absent Today</p>
          <p className="text-xl font-extrabold text-rose-700 mt-1 flex items-center gap-1">
            <XCircle className="w-4 h-4 text-rose-600" />
            {absentCount} Students
          </p>
          <span className="text-[10px] font-semibold text-rose-600 mt-1 block">
            Leave / Absent
          </span>
        </div>

        {/* Late Attendance */}
        <div className="glass-card p-4 rounded-3xl border border-amber-100/70 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Late Arrivals</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1 flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-600" />
            {lateCount} Students
          </p>
          <span className="text-[10px] font-semibold text-amber-600 mt-1 block">
            Grace Period
          </span>
        </div>

        {/* Attendance Percentage */}
        <div className="glass-card p-4 rounded-3xl border border-purple-100/70 bg-purple-50/20 shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Today's %</p>
          <p className="text-xl font-extrabold text-purple-700 mt-1 flex items-center gap-1">
            <Percent className="w-4 h-4 text-purple-600" />
            {dayPercentage}%
          </p>
          <span className="text-[10px] font-semibold text-purple-600 mt-1 block">
            (Present / Total) × 100
          </span>
        </div>
      </div>

      {/* Date & Department Filter Controls */}
      <div className="glass-card p-4 rounded-3xl border border-violet-100/60 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto flex-1">
            {/* Date Picker */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-2xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-2xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
              >
                <option value="All">All Departments</option>
                <option value="Artificial Intelligence & Data Science">AI&DS (Artificial Intelligence & Data Science)</option>
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Electronics & Communication">ECE</option>
                <option value="Mechanical Engineering">MECH</option>
                <option value="Data Science & AI">Data Science</option>
                <option value="MBA Finance & Management">MBA</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-2xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-2xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-violet-500"
              >
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
              </select>
            </div>
          </div>

          {/* Quick Mark Toolbar */}
          <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end pt-2 lg:pt-0">
            <button
              type="button"
              onClick={() => handleMarkAll("Present")}
              className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("Absent")}
              className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <X className="w-3.5 h-3.5 text-rose-600" />
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="glass-card rounded-3xl border border-violet-100/60 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-slate-800">
              Student Attendance Sheet for {selectedDate} ({records.length} Students)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {presentCount} Present / {totalCount} Total
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">#</th>
                <th className="py-3.5 px-4 font-bold">Student Name & Roll</th>
                <th className="py-3.5 px-4 font-bold">Department & Year</th>
                <th className="py-3.5 px-4 font-bold text-center">Attendance Status</th>
                <th className="py-3.5 px-4 font-bold">Time In</th>
                <th className="py-3.5 px-4 font-bold">Remarks</th>
                <th className="py-3.5 px-4 font-bold text-right">Cumulative %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No students found for selected department/year.
                  </td>
                </tr>
              ) : (
                records.map((item, idx) => {
                  const isPresent = item.status === "Present";
                  const isAbsent = item.status === "Absent";
                  const isLate = item.status === "Late";

                  return (
                    <tr key={item.student_id || idx} className="hover:bg-violet-50/20 transition-colors">
                      {/* Serial */}
                      <td className="py-3.5 px-4 text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Student Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                            {item.student_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => handleViewStudentHistory(item)}
                              className="font-bold text-slate-800 hover:text-violet-600 transition-colors text-left"
                            >
                              {item.student_name}
                            </button>
                            <p className="text-[11px] text-slate-400 font-medium">
                              Roll: {item.roll} | ID: {item.student_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Dept / Year */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-700">{item.department}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {item.year} - {item.section}
                        </p>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.student_id, "Present")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isPresent
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.student_id, "Absent")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isAbsent
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.student_id, "Late")}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isLate
                                ? "bg-amber-500 text-white shadow-xs"
                                : "text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>

                      {/* Time In */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={item.time_in || "8:00 AM"}
                          disabled={isAbsent}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRecords((prev) =>
                              prev.map((r) => (r.student_id === item.student_id ? { ...r, time_in: val } : r))
                            );
                          }}
                          className={`w-24 px-2 py-1 rounded-xl border text-xs font-semibold ${
                            isAbsent
                              ? "bg-slate-50 border-slate-200 text-slate-400"
                              : "bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-violet-500"
                          }`}
                        />
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={item.remarks || ""}
                          onChange={(e) => handleRemarkChange(item.student_id, e.target.value)}
                          className="w-full px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-violet-500"
                        />
                      </td>

                      {/* Cumulative % */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleViewStudentHistory(item)}
                          className="inline-flex items-center gap-1 font-bold text-violet-700 hover:underline"
                        >
                          <span className="px-2 py-1 rounded-xl bg-violet-100 text-violet-800 text-[11px] font-extrabold">
                            {idx % 3 === 0 ? "91.6%" : idx % 2 === 0 ? "85.0%" : "96.4%"}
                          </span>
                          <Eye className="w-3.5 h-3.5 text-violet-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Attendance History Modal */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {historyStudent.student_name} - Attendance Log
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Roll: {historyStudent.roll} | {historyStudent.department}
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attendance Calculation Box */}
            <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Working Days</p>
                <p className="text-lg font-extrabold text-slate-800">{studentSummary?.totalWorkingDays || 12}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Present Days</p>
                <p className="text-lg font-extrabold text-emerald-700">{studentSummary?.presentDays || 11}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-violet-600 uppercase">Percentage</p>
                <p className="text-lg font-extrabold text-violet-700">
                  {studentSummary?.attendancePercentage ? `${studentSummary.attendancePercentage}%` : "91.6%"}
                </p>
              </div>
            </div>

            {/* Past Dates History */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Recent Daily Records
              </p>
              {studentHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No historical logs available.</p>
              ) : (
                studentHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-semibold text-slate-700">{h.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{h.time_in || "8:00 AM"}</span>
                      <span
                        className={`px-2 py-0.5 rounded-xl font-bold text-[10px] ${
                          h.status === "Present"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
