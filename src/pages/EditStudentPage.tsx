import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  GraduationCap,
  HeartHandshake,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  ShieldCheck,
  Hash,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "../services/api";
import { studentService, Student, normalizeDateString } from "../services/firebase/studentService";

export interface EditStudentPageProps {
  studentId: string;
  onNavigate?: (tab: string, studentId?: string) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const EditStudentPage: React.FC<EditStudentPageProps> = ({
  studentId,
  onNavigate = () => {},
  onShowToast = () => {},
}) => {
  // Form State
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [department, setDepartment] = useState("aids");
  const [grade, setGrade] = useState("B.Tech AI&DS");
  const [year, setYear] = useState("3rd Year");
  const [status, setStatus] = useState<Student["status"]>("active");
  const [gender, setGender] = useState("Female");
  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Parent & Guardian State
  const [guardian, setGuardian] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [address, setAddress] = useState("");

  // Services State
  const [transportRoute, setTransportRoute] = useState("None");
  const [hostel, setHostel] = useState("No");

  // Optional Student Password Update
  const [studentPassword, setStudentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Original Data & Preserved Identifiers
  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);

  // UI States
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Student's Actual Data from Firebase Firestore
  useEffect(() => {
    let isMounted = true;

    const loadStudentData = async () => {
      if (!studentId) {
        if (isMounted) {
          setError("No student ID specified to edit.");
          setInitialLoading(false);
        }
        return;
      }

      try {
        setInitialLoading(true);
        setError(null);

        // Fetch actual student document from Firestore
        const student = await studentService.getStudentByAnyId(studentId);

        if (!student) {
          if (isMounted) {
            setError(`Student record with ID "${studentId}" was not found in the database.`);
            setInitialLoading(false);
          }
          return;
        }

        if (isMounted) {
          setOriginalStudent(student);

          // Populate Form Fields
          setName(student.name || "");
          const regNum = student.registerNumber || student.rollNo || student.roll || student.id;
          setRoll(regNum);
          setDepartment((student.department || "aids").toLowerCase());
          setGrade(student.grade || "B.Tech AI&DS");
          setYear(student.year || "3rd Year");
          setStatus(student.status || "active");
          setGender((student as any).gender || "Female");
          const normalizedDob = normalizeDateString(student.dateOfBirth || student.dob || "");
          setDob(normalizedDob);
          setBloodGroup((student as any).bloodGroup || "O+");
          setEmail(student.email || "");
          setPhone(student.phone || "");

          setGuardian(student.guardian || student.parentName || "");
          setGuardianPhone(student.guardianPhone || student.parentPhone || "");
          setGuardianEmail(student.guardianEmail || student.parentEmail || "");
          setAddress(student.address || "");

          setTransportRoute((student as any).transportRoute || "None");
          setHostel((student as any).hostel || "No");
          setInitialLoading(false);
        }
      } catch (fetchErr: any) {
        if (isMounted) {
          console.error("Error loading student for editing:", fetchErr);
          setError(fetchErr.message || "Failed to load student details from database.");
          setInitialLoading(false);
        }
      }
    };

    loadStudentData();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  // When grade dropdown changes, synchronize department code and year
  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const lower = newGrade.toLowerCase();
    if (lower.includes("ai") || lower.includes("ds")) {
      setDepartment("aids");
    } else if (lower.includes("cse") || lower.includes("computer")) {
      setDepartment("cse");
    } else if (lower.includes("ece") || lower.includes("electronics")) {
      setDepartment("ece");
    } else if (lower.includes("mech") || lower.includes("mechanical")) {
      setDepartment("mech");
    }

    if (lower.includes("sem 1") || lower.includes("sem 2")) setYear("1st Year");
    else if (lower.includes("sem 3") || lower.includes("sem 4")) setYear("2nd Year");
    else if (lower.includes("sem 5") || lower.includes("sem 6")) setYear("3rd Year");
    else if (lower.includes("sem 7") || lower.includes("sem 8")) setYear("Final Year");
  };

  // 2. Submit Handler: Updates the existing Firestore document (NOT creating a new record)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Student full name is required.");
      return;
    }
    if (!roll.trim()) {
      setError("Register number / roll is required.");
      return;
    }

    if (studentPassword.trim() && studentPassword.trim().length < 6) {
      setError("If updating the student password, it must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const cleanReg = roll.trim().toUpperCase().replace(/\s+/g, "");

      const updatedPayload: Partial<Student> & {
        dob?: string;
        dateOfBirth?: string;
        bloodGroup?: string;
        gender?: string;
        guardian?: string;
        guardianPhone?: string;
        guardianEmail?: string;
        transportRoute?: string;
        hostel?: string;
      } = {
        name: name.trim(),
        registerNumber: cleanReg,
        rollNo: cleanReg,
        roll: cleanReg,
        department: department.toLowerCase().trim(),
        grade,
        year,
        status,
        gender,
        dateOfBirth: dob,
        dob,
        bloodGroup,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        guardian: guardian.trim(),
        parentName: guardian.trim(),
        guardianPhone: guardianPhone.trim(),
        parentPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim().toLowerCase(),
        parentEmail: guardianEmail.trim().toLowerCase(),
        transportRoute,
        hostel,
      };

      // Call API to update the existing Firestore student record
      const origDept = (originalStudent?.department || department).toLowerCase();
      await api.admin.updateStudent(
        studentId,
        {
          ...updatedPayload,
          originalDepartment: origDept,
          department: department.toLowerCase().trim(),
          ...(studentPassword.trim() ? { password: studentPassword.trim(), studentPassword: studentPassword.trim() } : {}),
        },
        origDept
      );

      const successNotice = `Student record for "${name}" (${cleanReg}) updated successfully!`;
      setSuccessMsg(successNotice);
      onShowToast(successNotice, "success");

      // Redirect back to student list after short delay
      setTimeout(() => {
        onNavigate("students-list");
      }, 1500);
    } catch (err: any) {
      console.error("Error saving student updates:", err);
      setError(err.message || "Failed to update student profile in database.");
    } finally {
      setSaving(false);
    }
  };

  // Loading Skeleton State
  if (initialLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-3xl border border-slate-200/80 p-5 flex items-center justify-between" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200/80 p-6" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200/80 p-6" />
      </div>
    );
  }

  // Error State when student not found
  if (error && !originalStudent) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-lg space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Student Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => onNavigate("students-list")}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
        >
          Return to Student Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("students-list")}
            className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 hover:text-slate-800 transition"
            title="Cancel and return to Student Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Edit Student Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                Editing Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Modifying record for <strong className="text-slate-700">{name || originalStudent?.name}</strong>
            </p>
          </div>
        </div>

        {/* Identity & Protection Meta */}
        <div className="flex items-center gap-2 text-xs self-start sm:self-auto bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-slate-500 font-mono text-[11px]">
            ID: <strong className="text-slate-700">{studentId}</strong>
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="flex-1">{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Personal Information */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b pb-3.5 border-slate-100">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Personal Information</h3>
              <p className="text-[11px] text-slate-400">Basic identification and contact particulars</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Student Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student full name"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Student Email Address</label>
              <input
                type="email"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
              <input
                type="text"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Enrollment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
              >
                <option value="active">Active (Enrolled)</option>
                <option value="inactive">Inactive / On Leave</option>
                <option value="graduated">Graduated / Alumni</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Residential Address</label>
              <input
                type="text"
                placeholder="Permanent or residential address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 2. Academic Enrollment & Program */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b pb-3.5 border-slate-100">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Academic Enrollment Details</h3>
              <p className="text-[11px] text-slate-400">Department assignment, degree program and register ID</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Register Number / Roll No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 21AD045 or REG1001"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-mono font-bold uppercase text-slate-900"
                />
              </div>
              <span className="text-[10px] text-slate-400">Unique student login ID</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value.toLowerCase())}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
              >
                <option value="aids">Artificial Intelligence & Data Science (AI&DS)</option>
                <option value="cse">Computer Science & Engineering (CSE)</option>
                <option value="ece">Electronics & Communication Engineering (ECE)</option>
                <option value="mech">Mechanical Engineering (MECH)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Degree Program & Semester <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="B.Tech AI&DS">B.Tech Artificial Intelligence & Data Science - Sem 5</option>
                <option value="B.Tech CSE">B.Tech Computer Science - Sem 5</option>
                <option value="B.Tech ECE">B.Tech Electronics & Comm - Sem 3</option>
                <option value="B.Tech MECH">B.Tech Mechanical - Sem 7</option>
                <option value="MBA">MBA Finance - Sem 1</option>
                <option value="B.Sc DS">B.Sc Data Science - Sem 1</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="Final Year">Final Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Academic Session</label>
              <input
                type="text"
                disabled
                value="2025-2026 (Active)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 3. Parent & Guardian Information */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b pb-3.5 border-slate-100">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <HeartHandshake className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Parent & Guardian Information</h3>
              <p className="text-[11px] text-slate-400">Emergency contacts and linked parent portal account</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Guardian Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Guardian name"
                value={guardian}
                onChange={(e) => setGuardian(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Guardian Phone</label>
              <input
                type="text"
                placeholder="Phone number"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Guardian Email</label>
              <input
                type="email"
                placeholder="parent@example.com"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 4. Campus Services & Facilities */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b pb-3.5 border-slate-100">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Campus Services & Facilities</h3>
              <p className="text-[11px] text-slate-400">Institutional accommodation and transportation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Transportation Bus Route</label>
              <select
                value={transportRoute}
                onChange={(e) => setTransportRoute(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="None">No Transportation Required</option>
                <option value="Route 1">Route 1 (Downtown Campus)</option>
                <option value="Route 2">Route 2 (East Valley)</option>
                <option value="Route 4">Route 4 (North Suburbs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Hostel Accommodation</label>
              <select
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="No">Day Scholar (No Hostel)</option>
                <option value="Yes">Hostel Resident (Campus Block A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Student Portal Login Credentials */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b pb-3.5 border-slate-100">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Student Portal Login Credentials</h3>
              <p className="text-[11px] text-slate-400">
                Student uses Register Number (<strong className="font-mono text-slate-700">{roll || "REGISTER_ID"}</strong>) as Login ID.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Authentication Login ID
              </label>
              <input
                type="text"
                disabled
                value={roll || "Register Number"}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400">Synchronized with Register Number / Roll No</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Update Student Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Leave empty to retain existing password"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400">Minimum 6 characters if modifying password</span>
            </div>
          </div>
        </div>

        {/* Bottom Form Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onNavigate("students-list")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
