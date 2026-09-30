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
}

export const AcademicInfoPage: React.FC<AcademicInfoPageProps> = ({ onShowToast = () => {} }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicClass)));
        } else {
          setClasses([]);
        }

        if (subjectsSnap && !subjectsSnap.empty) {
          setSubjects(subjectsSnap.docs.map(d => ({ ...d.data() } as AcademicSubject)));
        } else {
          setSubjects([]);
        }
      } catch (err) {
        console.error("Failed to load academic data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAcademicData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Departments</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{departments.length} Departments</h3>
          <p className="text-xs text-slate-400 mt-1">Undergrad & Postgrad Programs</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Batches</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{classes.length} Batches</h3>
          <p className="text-xs text-slate-400 mt-1">Configured Academic Sections</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Degree Courses</span>
          <h3 className="text-2xl font-black text-purple-600 mt-1">{subjects.length} Modules</h3>
          <p className="text-xs text-slate-400 mt-1">Course & Subject Catalog</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Students</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{students.length} Enrolled</h3>
          <p className="text-xs text-slate-400 mt-1">Active Registered Students</p>
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
                  return (
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
                              style={{ width: `${Math.min(capacityPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">
                            {capacityPct}%
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
                  );
                })
              )}
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading course catalog...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No subjects found in the course catalog.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">{sub.code}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{sub.name}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{sub.faculty}</td>
                    <td className="px-6 py-4 text-slate-500">{sub.classes}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{sub.credits} Credits</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
