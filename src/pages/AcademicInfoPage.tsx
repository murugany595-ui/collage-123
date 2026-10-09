import React, { useState, useEffect } from "react";
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
  Sparkles,
  Building2,
  Mail,
  UserCheck,
  X,
  Cpu,
  Search,
} from "lucide-react";
import { departmentService, Department } from "../services/firebase/departmentService";
import { studentService, Student } from "../services/firebase/studentService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export interface AcademicInfoPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export interface AcademicClass {
  id: string;
  grade: string;
  section: string;
  teacher: string;
  students: number;
  capacity: number;
  room: string;
}

export interface AcademicSubject {
  code: string;
  name: string;
  faculty: string;
  classes: string;
  credits: number;
  department?: string;
}

const DEFAULT_BATCHES: AcademicClass[] = [
  {
    id: "batch-aids-sem5",
    grade: "B.Tech AI&DS",
    section: "Section A - Sem 5",
    teacher: "Dr. K. Senthil Kumar",
    students: 60,
    capacity: 64,
    room: "AI & Deep Learning Lab (Lab 4B)",
  },
  {
    id: "batch-aids-sem3",
    grade: "B.Tech AI&DS",
    section: "Section A - Sem 3",
    teacher: "Prof. Ananya Sharma",
    students: 58,
    capacity: 64,
    room: "Data Analytics & Machine Learning Hall 204",
  },
  {
    id: "batch-cse-sem5",
    grade: "B.Tech CSE",
    section: "Section A - Sem 5",
    teacher: "Dr. R. Meenakshi",
    students: 62,
    capacity: 65,
    room: "Advanced Computing Lab 1",
  },
  {
    id: "batch-ece-sem3",
    grade: "B.Tech ECE",
    section: "Section A - Sem 3",
    teacher: "Dr. S. Karthikeyan",
    students: 55,
    capacity: 60,
    room: "Embedded Systems Lab 2A",
  },
  {
    id: "batch-mech-sem7",
    grade: "B.Tech MECH",
    section: "Section A - Sem 7",
    teacher: "Dr. P. Rajendran",
    students: 48,
    capacity: 60,
    room: "CAD/CAM Simulation Center",
  },
];

const DEFAULT_SUBJECTS: AcademicSubject[] = [
  {
    code: "AD3501",
    name: "Deep Learning & Neural Networks",
    faculty: "Dr. K. Senthil Kumar",
    classes: "B.Tech AI&DS (Sem 5)",
    credits: 4,
    department: "aids",
  },
  {
    code: "AD3502",
    name: "Big Data Analytics & Distributed Systems",
    faculty: "Prof. Ananya Sharma",
    classes: "B.Tech AI&DS (Sem 5)",
    credits: 3,
    department: "aids",
  },
  {
    code: "AD3511",
    name: "AI & Machine Learning Laboratory",
    faculty: "Dr. K. Senthil Kumar",
    classes: "B.Tech AI&DS (Sem 5)",
    credits: 2,
    department: "aids",
  },
  {
    code: "AD3401",
    name: "Data Science Foundations & Statistical Computing",
    faculty: "Prof. R. Vikram",
    classes: "B.Tech AI&DS (Sem 3)",
    credits: 4,
    department: "aids",
  },
  {
    code: "AD3411",
    name: "Computer Vision & Robotics Lab",
    faculty: "Prof. S. Priyadharshini",
    classes: "B.Tech AI&DS (Sem 3)",
    credits: 2,
    department: "aids",
  },
  {
    code: "CS3501",
    name: "Compiler Design & Optimization",
    faculty: "Dr. R. Meenakshi",
    classes: "B.Tech CSE (Sem 5)",
    credits: 4,
    department: "cse",
  },
  {
    code: "EC3401",
    name: "Digital Signal Processing & Microcontrollers",
    faculty: "Dr. S. Karthikeyan",
    classes: "B.Tech ECE (Sem 3)",
    credits: 4,
    department: "ece",
  },
  {
    code: "ME3701",
    name: "Finite Element Analysis & Automation",
    faculty: "Dr. P. Rajendran",
    classes: "B.Tech MECH (Sem 7)",
    credits: 4,
    department: "mech",
  },
];

export const AcademicInfoPage: React.FC<AcademicInfoPageProps> = ({ onShowToast = () => {} }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>(DEFAULT_BATCHES);
  const [subjects, setSubjects] = useState<AcademicSubject[]>(DEFAULT_SUBJECTS);
  const [loading, setLoading] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [deptForm, setDeptForm] = useState<{
    id: string;
    name: string;
    code: string;
    hodName: string;
    hodEmail: string;
    establishedYear: string;
    totalStudents: number;
    totalStaff: number;
  }>({
    id: "",
    name: "",
    code: "",
    hodName: "",
    hodEmail: "",
    establishedYear: "2021",
    totalStudents: 120,
    totalStaff: 14,
  });
  const [savingDept, setSavingDept] = useState(false);

  const loadAcademicData = async () => {
    try {
      setLoading(true);
      const [deptList, studentList] = await Promise.all([
        departmentService.getDepartments().catch(() => []),
        studentService.getAllStudents().catch(() => []),
      ]);
      setDepartments(deptList);
      setStudents(studentList);

      // Fetch configured batches and subjects if any exist in Firestore
      const [classesSnap, subjectsSnap] = await Promise.all([
        getDocs(collection(db, "academic_classes")).catch(() => null),
        getDocs(collection(db, "academic_subjects")).catch(() => null),
      ]);

      if (classesSnap && !classesSnap.empty) {
        setClasses(classesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AcademicClass)));
      } else {
        setClasses(DEFAULT_BATCHES);
      }

      if (subjectsSnap && !subjectsSnap.empty) {
        setSubjects(subjectsSnap.docs.map((d) => ({ ...d.data() } as AcademicSubject)));
      } else {
        setSubjects(DEFAULT_SUBJECTS);
      }
    } catch (err) {
      console.error("Failed to load academic data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicData();
  }, []);

  const handleOpenAddDept = () => {
    setIsEditingDept(false);
    setDeptForm({
      id: "aids",
      name: "Artificial Intelligence & Data Science",
      code: "AI&DS",
      hodName: "Dr. K. Senthil Kumar",
      hodEmail: "hod.aids@ourcollege.edu",
      establishedYear: "2021",
      totalStudents: 120,
      totalStaff: 14,
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setIsEditingDept(true);
    setDeptForm({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      hodName: dept.hodName || "",
      hodEmail: dept.hodEmail || "",
      establishedYear: dept.establishedYear || "2021",
      totalStudents: dept.totalStudents || 120,
      totalStaff: dept.totalStaff || 14,
    });
    setIsDeptModalOpen(true);
  };

  const handlePreFillAIDS = () => {
    setDeptForm({
      id: "aids",
      name: "Artificial Intelligence & Data Science",
      code: "AI&DS",
      hodName: "Dr. K. Senthil Kumar",
      hodEmail: "hod.aids@ourcollege.edu",
      establishedYear: "2021",
      totalStudents: 120,
      totalStaff: 14,
    });
    onShowToast("Pre-filled Artificial Intelligence & Data Science (AI&DS) details", "info");
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      onShowToast("Please enter Department Name and Code", "error");
      return;
    }

    try {
      setSavingDept(true);
      const normalizedId = deptForm.id.toLowerCase().trim() || deptForm.code.toLowerCase().replace(/[^a-z0-9_-]/g, "");

      if (isEditingDept) {
        await departmentService.updateDepartment(normalizedId, {
          name: deptForm.name,
          code: deptForm.code,
          hodName: deptForm.hodName,
          hodEmail: deptForm.hodEmail,
          establishedYear: deptForm.establishedYear,
          totalStudents: Number(deptForm.totalStudents),
          totalStaff: Number(deptForm.totalStaff),
        });
        onShowToast(`Department ${deptForm.code} updated successfully`, "success");
      } else {
        await departmentService.addDepartment({
          id: normalizedId,
          name: deptForm.name,
          code: deptForm.code,
          hodName: deptForm.hodName,
          hodEmail: deptForm.hodEmail,
          establishedYear: deptForm.establishedYear,
          totalStudents: Number(deptForm.totalStudents),
          totalStaff: Number(deptForm.totalStaff),
        });
        onShowToast(`Department ${deptForm.code} (${deptForm.name}) added to Firestore!`, "success");
      }

      setIsDeptModalOpen(false);
      await loadAcademicData();
    } catch (err: any) {
      console.error("Error saving department:", err);
      onShowToast(err.message || "Failed to save department", "error");
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    if (confirm(`Are you sure you want to remove the ${deptName} department?`)) {
      try {
        await departmentService.deleteDepartment(deptId);
        onShowToast(`Department ${deptName} deleted`, "info");
        await loadAcademicData();
      } catch (err: any) {
        onShowToast(err.message || "Failed to delete department", "error");
      }
    }
  };

  // Check if AI&DS is present
  const hasAidsDepartment = departments.some(
    (d) =>
      d.id?.toLowerCase() === "aids" ||
      d.code?.toUpperCase() === "AI&DS" ||
      d.name?.toLowerCase().includes("data science")
  );

  const filteredSubjects = selectedDeptFilter === "ALL"
    ? subjects
    : subjects.filter((s) => s.department === selectedDeptFilter.toLowerCase() || s.classes.toLowerCase().includes(selectedDeptFilter.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-violet-100/70 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Departments</span>
          <h3 className="text-2xl font-black text-violet-700 mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-violet-600" />
            {departments.length} Departments
          </h3>
          <p className="text-xs text-slate-400 mt-1">Undergrad & Postgrad Degree Programs</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-emerald-100/70 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Batches</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-500" />
            {classes.length} Batches
          </h3>
          <p className="text-xs text-slate-400 mt-1">Configured Academic Sections</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-purple-100/70 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Degree Courses</span>
          <h3 className="text-2xl font-black text-purple-600 mt-1 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            {subjects.length} Modules
          </h3>
          <p className="text-xs text-slate-400 mt-1">Course & Subject Catalog</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Students</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            {students.length > 0 ? students.length : 120} Enrolled
          </h3>
          <p className="text-xs text-slate-400 mt-1">Active Registered Students</p>
        </div>
      </div>

      {/* Quick AI&DS Banner if not present */}
      {!hasAidsDepartment && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Cpu className="w-6 h-6 text-white" />
            </span>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Add AI&DS (Artificial Intelligence & Data Science)
              </h3>
              <p className="text-violet-100 text-xs mt-0.5">
                Quickly add the high-demand AI&DS department to your college structure with one click.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAddDept}
            className="px-4 py-2 bg-white hover:bg-violet-50 text-violet-700 rounded-xl text-xs font-bold shadow-md transition whitespace-nowrap"
          >
            + Add AI&DS Department
          </button>
        </div>
      )}

      {/* 1. Academic Departments Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-violet-100 text-violet-700">
                <Building2 className="w-4 h-4" />
              </span>
              <h2 className="font-bold text-slate-900 text-base">Academic Departments</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active engineering and science departments, Head of Departments, faculty, and student quotas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddDept}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* Department Cards Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => {
            const isAids =
              dept.id?.toLowerCase() === "aids" ||
              dept.code?.toUpperCase() === "AI&DS" ||
              dept.name?.toLowerCase().includes("data science");

            return (
              <div
                key={dept.id}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  isAids
                    ? "bg-gradient-to-b from-violet-50/70 via-purple-50/40 to-white border-violet-200 shadow-sm ring-1 ring-violet-500/10"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black tracking-wide border ${
                        isAids
                          ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      {dept.code}
                    </span>
                    {dept.establishedYear && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Est. {dept.establishedYear}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDept(dept)}
                      title="Edit Department"
                      className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                      title="Delete Department"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                    {dept.name}
                  </h3>
                  {isAids && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3 text-violet-600" /> Autonomous Curriculum
                    </span>
                  )}
                </div>

                {/* HOD Details */}
                <div className="mt-4 pt-3 border-t border-slate-100/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <UserCheck className="w-3.5 h-3.5 text-violet-500" />
                    <span className="truncate">{dept.hodName || "Faculty Head"}</span>
                  </div>
                  {dept.hodEmail && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{dept.hodEmail}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100/80 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50/80 p-2 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Students</span>
                    <span className="font-bold text-slate-800">{dept.totalStudents || 120}</span>
                  </div>
                  <div className="bg-slate-50/80 p-2 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Faculty</span>
                    <span className="font-bold text-slate-800">{dept.totalStaff || 14}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Class & Section Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Department Batches & Classrooms</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Faculty advisors, lecture halls, and enrollment capacity</p>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading academic batches...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No department batches configured yet. Click "+ Add New Batch" to configure.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => {
                  const capacityPct = cls.capacity > 0 ? Math.round((cls.students / cls.capacity) * 100) : 0;
                  const isAids = cls.grade.includes("AI&DS");

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold border ${
                              isAids
                                ? "bg-violet-50 text-violet-700 border-violet-200"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                          >
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
                              className={`h-full rounded-full ${isAids ? "bg-violet-600" : "bg-blue-600"}`}
                              style={{ width: `${Math.min(capacityPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{capacityPct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{cls.room}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* 3. Subjects & Faculty Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                <BookOpen className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Course & Subject Catalog</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Department faculty assignments and credit curriculum</p>
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "AI&DS", "CSE", "ECE", "MECH"].map((deptCode) => (
              <button
                key={deptCode}
                onClick={() => setSelectedDeptFilter(deptCode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedDeptFilter === deptCode
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {deptCode === "ALL" ? "All Courses" : deptCode}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Faculty Head</th>
                <th className="px-6 py-4">Applicable Program / Classes</th>
                <th className="px-6 py-4">Credit Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading course catalog...
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No subjects found in the selected catalog.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => {
                  const isAids = sub.code.startsWith("AD") || sub.classes.includes("AI&DS");

                  return (
                    <tr key={sub.code} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            isAids ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {sub.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{sub.name}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{sub.faculty}</td>
                      <td className="px-6 py-4 text-slate-500">{sub.classes}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{sub.credits} Credits</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-violet-100 text-violet-700">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {isEditingDept ? "Edit Academic Department" : "Add Academic Department"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure institutional engineering & degree curriculum
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Fill Button */}
            {!isEditingDept && (
              <div className="mt-4 p-3 bg-violet-50/70 border border-violet-200/80 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold text-violet-800">
                    Quick Preset: AI&DS Department
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePreFillAIDS}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Pre-fill AI&DS
                </button>
              </div>
            )}

            <form onSubmit={handleSaveDepartment} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI&DS, CSE"
                    value={deptForm.code}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setDeptForm((prev) => ({
                        ...prev,
                        code,
                        id: prev.id || code.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department ID / Slug *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditingDept}
                    placeholder="e.g. aids"
                    value={deptForm.id}
                    onChange={(e) =>
                      setDeptForm((prev) => ({
                        ...prev,
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head of Department (HOD)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. K. Senthil Kumar"
                    value={deptForm.hodName}
                    onChange={(e) => setDeptForm((prev) => ({ ...prev, hodName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HOD Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. hod.aids@ourcollege.edu"
                    value={deptForm.hodEmail}
                    onChange={(e) => setDeptForm((prev) => ({ ...prev, hodEmail: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Est. Year</label>
                  <input
                    type="text"
                    placeholder="2021"
                    value={deptForm.establishedYear}
                    onChange={(e) =>
                      setDeptForm((prev) => ({ ...prev, establishedYear: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Students</label>
                  <input
                    type="number"
                    min="1"
                    value={deptForm.totalStudents}
                    onChange={(e) =>
                      setDeptForm((prev) => ({ ...prev, totalStudents: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faculty</label>
                  <input
                    type="number"
                    min="1"
                    value={deptForm.totalStaff}
                    onChange={(e) =>
                      setDeptForm((prev) => ({ ...prev, totalStaff: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 text-center"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20 transition disabled:opacity-50"
                >
                  {savingDept ? "Saving to Cloud..." : isEditingDept ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
