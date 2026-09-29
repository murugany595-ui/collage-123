import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  BookOpen,
  Award,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  HeartHandshake,
  Download,
  PlusCircle,
} from "lucide-react";
import { api } from "../services/api";

export interface StudentDetailsPageProps {
  studentId?: string;
  onNavigate?: (tab: string) => void;
  onCollectFee?: (invoice: any) => void;
  onViewReceipt?: (receipt: any) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const StudentDetailsPage: React.FC<StudentDetailsPageProps> = ({
  studentId = "STU-1042",
  onNavigate = () => {},
  onCollectFee = () => {},
  onViewReceipt = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "fees" | "attendance" | "results" | "assignments">("overview");
  const [studentData, setStudentData] = useState<any>({
    id: studentId,
    name: "Ava Thompson",
    roll: "CSE-501",
    grade: "B.Tech CSE - Sem 5",
    gender: "Female",
    dob: "2005-05-14",
    bloodGroup: "O+",
    email: "ava.thompson@ourcollege.edu",
    phone: "+1 555-0192",
    guardian: "Mark Thompson",
    guardianPhone: "+1 555-201-3344",
    guardianEmail: "mark.t@ourcollege.edu",
    address: "42 West End Blvd, Northfield",
    admissionDate: "2024-08-01",
    status: "Active",
  });

  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-2026-001", type: "Semester 4 Tuition Fee", amount: 1250, paid: 1250, balance: 0, dueDate: "2026-06-15", status: "Paid" },
    { id: "INV-2026-002", type: "Semester 5 Tuition Fee", amount: 1250, paid: 0, balance: 1250, dueDate: "2026-08-30", status: "Pending" },
    { id: "INV-2026-003", type: "Annual Campus Lab & Library Fee", amount: 450, paid: 450, balance: 0, dueDate: "2026-05-10", status: "Paid" },
  ]);

  const [attendanceStats, setAttendanceStats] = useState({
    present: 142,
    absent: 4,
    late: 2,
    rate: "96.0%",
  });

  const [examResults, setExamResults] = useState([
    { subject: "Advanced Mathematics", marks: "94/100", grade: "A+", remarks: "Outstanding problem solving" },
    { subject: "Physics & Mechanics", marks: "88/100", grade: "A", remarks: "Great lab execution" },
    { subject: "Chemistry", marks: "91/100", grade: "A+", remarks: "Excellent grasp of concepts" },
    { subject: "English Literature", marks: "85/100", grade: "A", remarks: "Strong essays" },
    { subject: "Computer Science", marks: "98/100", grade: "A+", remarks: "Top in section" },
  ]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("students-list")}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Directory
        </button>
      </div>

      {/* Main Student Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
              {studentData.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{studentData.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {studentData.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                <span>Student ID: <strong className="text-slate-700 font-mono">{studentData.id}</strong></span>
                <span>•</span>
                <span>Department: <strong className="text-blue-600">{studentData.grade}</strong></span>
                <span>•</span>
                <span>Roll No: <strong className="text-slate-700">{studentData.roll}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onCollectFee({ ...studentData, amount: 1250, id: "INV-2026-002" })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Collect Fee</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Profile</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 mt-8 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Bio", icon: <User className="w-4 h-4" /> },
            { id: "fees", label: "Fee Ledger & Invoices", icon: <CreditCard className="w-4 h-4" /> },
            { id: "attendance", label: "Attendance Record", icon: <Calendar className="w-4 h-4" /> },
            { id: "results", label: "Academic Exam Results", icon: <Award className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100">
              Personal & Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold text-slate-800">{studentData.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-slate-800">{studentData.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-800">{studentData.dob}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Blood Group</span>
                <span className="font-semibold text-slate-800">{studentData.bloodGroup}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Residential Address</span>
                <span className="font-semibold text-slate-800">{studentData.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100">
              Guardian & Emergency Contact
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Guardian Name</span>
                <span className="font-semibold text-slate-800">{studentData.guardian}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Relationship</span>
                <span className="font-semibold text-slate-800">Father</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Guardian Phone</span>
                <span className="font-semibold text-slate-800">{studentData.guardianPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Guardian Email</span>
                <span className="font-semibold text-slate-800">{studentData.guardianEmail}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Admission Date</span>
                <span className="font-semibold text-slate-800">{studentData.admissionDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fee Ledger */}
      {activeTab === "fees" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Fee Invoices & Ledger</h3>
              <p className="text-xs text-slate-400">History of billed terms and balance status</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
              Outstanding Balance: ₹1,250.00
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Fee Type</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Paid Amount</th>
                  <th className="px-6 py-3.5">Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{inv.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{inv.type}</td>
                    <td className="px-6 py-4 text-slate-500">{inv.dueDate}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{inv.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">₹{inv.paid.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">₹{inv.balance.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.balance > 0 ? (
                        <button
                          onClick={() => onCollectFee({ ...studentData, ...inv, student: studentData.name })}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition"
                        >
                          Collect Fee
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            onViewReceipt({
                              id: inv.id,
                              student_name: studentData.name,
                              student_id: studentData.id,
                              grade: studentData.grade,
                              amount: inv.amount,
                              date: inv.dueDate,
                              fee_type: inv.type,
                            })
                          }
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition"
                        >
                          Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Overall Attendance</span>
              <h4 className="text-2xl font-black text-blue-600 mt-1">{attendanceStats.rate}</h4>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Present Days</span>
              <h4 className="text-2xl font-black text-emerald-600 mt-1">{attendanceStats.present}</h4>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Absences</span>
              <h4 className="text-2xl font-black text-rose-600 mt-1">{attendanceStats.absent}</h4>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Late Marks</span>
              <h4 className="text-2xl font-black text-amber-600 mt-1">{attendanceStats.late}</h4>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Results */}
      {activeTab === "results" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Term 2 Academic Examination Report</h3>
              <p className="text-xs text-slate-400">Cumulative Grade Point: 3.92 / 4.00 (Rank 1 in 10-A)</p>
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5">Grade</th>
                <th className="px-6 py-3.5">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {examResults.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{r.subject}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{r.marks}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-700 border border-blue-100">
                      {r.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{r.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
