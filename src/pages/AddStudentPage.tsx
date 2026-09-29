import React, { useState } from "react";
import {
  Upload,
  CheckCircle2,
  ArrowLeft,
  User,
  GraduationCap,
  HeartHandshake,
  CreditCard,
} from "lucide-react";
import { api } from "../services/api";

export interface AddStudentPageProps {
  onNavigate?: (tab: string) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  initialData?: any;
}

export const AddStudentPage: React.FC<AddStudentPageProps> = ({
  onNavigate = () => {},
  onShowToast = () => {},
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [roll, setRoll] = useState(initialData?.roll || "");
  const [grade, setGrade] = useState(initialData?.grade || "B.Tech CSE");
  const [gender, setGender] = useState(initialData?.gender || "Female");
  const [dob, setDob] = useState(initialData?.dob || "2005-05-14");
  const [bloodGroup, setBloodGroup] = useState(initialData?.bloodGroup || "O+");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "+1 555-0192");
  const [guardian, setGuardian] = useState(initialData?.guardian || "");
  const [guardianPhone, setGuardianPhone] = useState("+1 555-201-3344");
  const [guardianEmail, setGuardianEmail] = useState("parent@ourcollege.edu");
  const [address, setAddress] = useState("42 West End Blvd, Northfield");
  const [parentPassword, setParentPassword] = useState("Password123!");
  const [transportRoute, setTransportRoute] = useState("Route 4 (North Campus Suburbs)");
  const [hostel, setHostel] = useState("No");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const assignedRoll = roll || `CSE-${Math.floor(100 + Math.random() * 899)}`;
      const deptCode = grade.toLowerCase().includes("cse")
        ? "cse"
        : grade.toLowerCase().includes("ece")
        ? "ece"
        : grade.toLowerCase().includes("mech")
        ? "mech"
        : "aids";

      const studentPayload = {
        name,
        roll: assignedRoll,
        rollNo: assignedRoll,
        registerNumber: assignedRoll,
        dateOfBirth: dob || "2005-05-14",
        dob: dob || "2005-05-14",
        grade,
        gender,
        bloodGroup,
        department: deptCode,
        guardian: guardian || "Guardian",
        parentName: guardian || "Guardian",
        parentPhone: guardianPhone,
        guardianPhone,
        parentEmail: guardianEmail || "parent@mail.com",
        guardianEmail: guardianEmail || "parent@mail.com",
        parentPassword: parentPassword || "Password123!",
        email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@brightwood.edu`,
        phone,
        address,
        year: grade.includes("Sem 1") ? "1st Year" : grade.includes("Sem 3") ? "2nd Year" : "3rd Year",
        status: "active",
      };

      const res = await api.admin.createStudent(studentPayload);
      if (res.success) {
        setSuccessMsg(
          `Student record created! Register ID: ${assignedRoll} (DOB: ${dob || "2005-05-14"}). Parent login created for ${guardianEmail || "parent@mail.com"}.`
        );
        setTimeout(() => {
          onNavigate("students-list");
        }, 1500);
      } else {
        setError(res.message || "Failed to create student");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save student profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("students-list")}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {initialData ? "Edit Student Details" : "Add New Student"}
            </h1>
            <p className="text-xs text-slate-400">Complete student enrollment and academic admission</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Personal Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <User className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-800 text-sm">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ava Thompson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Email</label>
              <input
                type="email"
                placeholder="student@ourcollege.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* 2. Academic Enrollment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-800 text-sm">Academic Enrollment</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Program & Semester *</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="B.Tech CSE">B.Tech Computer Science - Sem 5</option>
                <option value="B.Tech ECE">B.Tech Electronics & Comm - Sem 3</option>
                <option value="B.Tech MECH">B.Tech Mechanical - Sem 7</option>
                <option value="MBA">MBA Finance - Sem 1</option>
                <option value="B.Sc DS">B.Sc Data Science - Sem 1</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / College ID</label>
              <input
                type="text"
                placeholder="e.g. CSE-501"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Session</label>
              <input
                type="text"
                disabled
                value="2025-2026 (Active)"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 3. Parent & Guardian Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <HeartHandshake className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-800 text-sm">Parent & Guardian Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mark Thompson"
                value={guardian}
                onChange={(e) => setGuardian(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone *</label>
              <input
                type="text"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Email *</label>
              <input
                type="email"
                required
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="parent@mail.com"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Login Password</label>
              <input
                type="text"
                value={parentPassword}
                onChange={(e) => setParentPassword(e.target.value)}
                placeholder="Password123!"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-400">Used by parent to login to Parent Dashboard</span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* 4. Transport & Fee Allocations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-800 text-sm">Fee Allocations & Services</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transportation Bus Route</label>
              <select
                value={transportRoute}
                onChange={(e) => setTransportRoute(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="None">No Transportation Required</option>
                <option value="Route 1">Route 1 (Downtown Campus)</option>
                <option value="Route 2">Route 2 (East Valley)</option>
                <option value="Route 4">Route 4 (North Suburbs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hostel Accommodation</label>
              <select
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="No">Day Scholar (No Hostel)</option>
                <option value="Yes">Hostel Resident (Campus Block A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("students-list")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? "Saving Student Record..." : "Save & Register Student"}
          </button>
        </div>
      </form>
    </div>
  );
};
