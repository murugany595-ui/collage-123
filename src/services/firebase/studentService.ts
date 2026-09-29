import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { departmentService } from "./departmentService";

export interface Student {
  id: string;
  studentId?: string;
  name: string;
  registerNumber: string;
  email: string;
  phone?: string;
  department: string; // e.g. "aids", "cse", "ece", "eee", "mech"
  year: string; // e.g. "1st Year", "2nd Year", "3rd Year", "Final Year"
  section?: string;
  dateOfBirth?: string;
  dob?: string;
  address?: string;
  admissionYear?: string;
  status: "active" | "inactive" | "graduated" | "suspended";
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  guardian?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  rollNo?: string;
  roll?: string;
  grade?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAuthRecord {
  registerNumber: string;
  dateOfBirth: string;
  studentId: string;
  name: string;
  department: string;
  grade?: string;
  parentEmail?: string;
  parentName?: string;
  phone?: string;
  updatedAt?: string;
}

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "STU-1042",
    name: "Ava Thompson",
    registerNumber: "CSE-501",
    rollNo: "CSE-501",
    roll: "CSE-501",
    dateOfBirth: "2005-05-14",
    dob: "2005-05-14",
    department: "cse",
    year: "3rd Year",
    grade: "B.Tech CSE - Sem 5",
    email: "ava.thompson@brightwood.edu",
    phone: "+1 555-0192",
    parentName: "Mark Thompson",
    parentEmail: "mark.t@mail.com",
    parentPhone: "+1 555-201-3344",
    guardian: "Mark Thompson",
    guardianEmail: "mark.t@mail.com",
    guardianPhone: "+1 555-201-3344",
    address: "42 West End Blvd, Northfield",
    status: "active",
  },
  {
    id: "STU-1045",
    name: "Kavitha R",
    registerNumber: "21AD045",
    rollNo: "21AD045",
    roll: "21AD045",
    dateOfBirth: "2004-09-12",
    dob: "2004-09-12",
    department: "aids",
    year: "3rd Year",
    grade: "B.Tech AIDS - Sem 5",
    email: "kavitha.r@brightwood.edu",
    phone: "+91 98401 54321",
    parentName: "Ramasamy M",
    parentEmail: "ramasamy.m@mail.com",
    parentPhone: "+91 98401 23456",
    guardian: "Ramasamy M",
    guardianEmail: "ramasamy.m@mail.com",
    guardianPhone: "+91 98401 23456",
    address: "12 Anna Salai, Chennai",
    status: "active",
  },
  {
    id: "STU-1043",
    name: "Noah Patel",
    registerNumber: "ECE-302",
    rollNo: "ECE-302",
    roll: "ECE-302",
    dateOfBirth: "2006-03-22",
    dob: "2006-03-22",
    department: "ece",
    year: "2nd Year",
    grade: "B.Tech ECE - Sem 3",
    email: "noah.patel@brightwood.edu",
    phone: "+1 555-0193",
    parentName: "Sanjay Patel",
    parentEmail: "sanjay.patel@mail.com",
    parentPhone: "+1 555-201-3345",
    guardian: "Sanjay Patel",
    guardianEmail: "sanjay.patel@mail.com",
    guardianPhone: "+1 555-201-3345",
    address: "88 Lakeview Ave, Northfield",
    status: "active",
  },
  {
    id: "STU-1044",
    name: "Liam Chen",
    registerNumber: "MECH-701",
    rollNo: "MECH-701",
    roll: "MECH-701",
    dateOfBirth: "2005-11-08",
    dob: "2005-11-08",
    department: "mech",
    year: "4th Year",
    grade: "B.Tech MECH - Sem 7",
    email: "liam.chen@brightwood.edu",
    phone: "+1 555-0194",
    parentName: "David Chen",
    parentEmail: "david.chen@mail.com",
    parentPhone: "+1 555-201-3346",
    guardian: "David Chen",
    guardianEmail: "david.chen@mail.com",
    guardianPhone: "+1 555-201-3346",
    address: "19 Silicon Way, Northfield",
    status: "active",
  },
];

// Helper to normalize dates from YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, etc. to standard YYYY-MM-DD
export function normalizeDateString(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // If YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\//g, "-");
  }

  // If DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    return `${y}-${month}-${day}`;
  }

  // Fallback to JS Date parser if valid
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return trimmed;
}

export function normalizeRegisterNumber(reg: string): string {
  return reg.trim().toUpperCase().replace(/\s+/g, "");
}

export const studentService = {
  async initializeDefaultStudents(): Promise<void> {
    for (const student of INITIAL_STUDENTS) {
      try {
        const deptId = student.department.toLowerCase();
        const studentRef = doc(db, "departments", deptId, "students", student.id);
        const existingSnap = await getDoc(studentRef);
        if (!existingSnap.exists()) {
          const now = new Date().toISOString();
          await setDoc(studentRef, {
            ...student,
            createdAt: now,
            updatedAt: now,
          });
        }

        // Also register in student_auth
        const cleanReg = normalizeRegisterNumber(student.registerNumber);
        const authRef = doc(db, "student_auth", cleanReg);
        const authSnap = await getDoc(authRef);
        if (!authSnap.exists()) {
          await setDoc(authRef, {
            registerNumber: cleanReg,
            dateOfBirth: normalizeDateString(student.dateOfBirth || "2005-05-14"),
            studentId: student.id,
            name: student.name,
            department: deptId,
            grade: student.grade || "",
            parentEmail: student.parentEmail || "",
            parentName: student.parentName || "",
            phone: student.phone || "",
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn(`Could not seed default student ${student.name}:`, e);
      }
    }
  },

  async verifyStudentLogin(registerId: string, dateOfBirth: string): Promise<Student> {
    const cleanReg = normalizeRegisterNumber(registerId);
    const normalizedDob = normalizeDateString(dateOfBirth);

    if (!cleanReg) {
      throw new Error("Register ID / Register Number is required.");
    }
    if (!normalizedDob) {
      throw new Error("Date of Birth is required.");
    }

    // 1. Direct lookup in student_auth collection
    try {
      const authSnap = await getDoc(doc(db, "student_auth", cleanReg));
      if (authSnap.exists()) {
        const authData = authSnap.data() as StudentAuthRecord;
        const storedDob = normalizeDateString(authData.dateOfBirth);

        if (storedDob !== normalizedDob) {
          throw new Error("Date of Birth does not match the registered record for this Register ID.");
        }

        // Fetch complete student record from department subcollection
        const fullStudent = await this.getStudentById(authData.department, authData.studentId);
        if (fullStudent) {
          return fullStudent;
        }

        // Fallback: construct Student object from authData
        return {
          id: authData.studentId,
          name: authData.name,
          registerNumber: authData.registerNumber,
          rollNo: authData.registerNumber,
          dateOfBirth: authData.dateOfBirth,
          dob: authData.dateOfBirth,
          department: authData.department,
          year: "3rd Year",
          grade: authData.grade || "B.Tech",
          email: `${cleanReg.toLowerCase()}@brightwood.edu`,
          parentEmail: authData.parentEmail,
          parentName: authData.parentName,
          status: "active",
        };
      }
    } catch (err: any) {
      // If error was mismatch, rethrow
      if (err.message && err.message.includes("Date of Birth does not match")) {
        throw err;
      }
      console.warn("Direct student_auth lookup notice:", err);
    }

    // 2. Fallback: Search across all students in departments (and seed defaults if empty)
    let allStudents = await this.getAllStudents().catch(() => []);
    if (allStudents.length === 0) {
      await this.initializeDefaultStudents();
      allStudents = await this.getAllStudents().catch(() => []);
    }

    // Also check memory INITIAL_STUDENTS if Firestore was empty
    const pool = [...allStudents, ...INITIAL_STUDENTS];
    const match = pool.find((s) => {
      const sReg = normalizeRegisterNumber(s.registerNumber || s.rollNo || s.roll || s.id);
      return sReg === cleanReg || s.id.toUpperCase() === cleanReg;
    });

    if (!match) {
      throw new Error(`No student record found with Register ID: "${registerId}". Please check your ID or contact the College Administration.`);
    }

    const sDob = normalizeDateString(match.dateOfBirth || match.dob || "");
    if (sDob !== normalizedDob) {
      throw new Error("Date of Birth does not match the registered record for this Register ID.");
    }

    // Synchronize to student_auth for subsequent logins
    try {
      await setDoc(doc(db, "student_auth", cleanReg), {
        registerNumber: cleanReg,
        dateOfBirth: sDob,
        studentId: match.id,
        name: match.name,
        department: match.department,
        grade: match.grade || "",
        parentEmail: match.parentEmail || match.guardianEmail || "",
        parentName: match.parentName || match.guardian || "",
        phone: match.phone || "",
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not cache student_auth document:", e);
    }

    return match;
  },

  async getStudentsByDepartment(departmentId: string): Promise<Student[]> {
    const path = `departments/${departmentId}/students`;
    try {
      const snap = await getDocs(collection(db, "departments", departmentId, "students"));
      if (snap.empty) {
        return INITIAL_STUDENTS.filter((s) => s.department.toLowerCase() === departmentId.toLowerCase());
      }
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        department: departmentId,
      }));
    } catch (error) {
      console.warn(`Could not fetch remote students for ${departmentId}:`, error);
      return INITIAL_STUDENTS.filter((s) => s.department.toLowerCase() === departmentId.toLowerCase());
    }
  },

  async getAllStudents(currentRole?: string, userDept?: string): Promise<Student[]> {
    // If not authenticated, return INITIAL_STUDENTS fallback
    if (!auth.currentUser) {
      return INITIAL_STUDENTS;
    }

    // If not admin and has department, restrict to user's department
    if (currentRole && currentRole !== "admin" && currentRole !== "accountant" && userDept && userDept !== "all") {
      return this.getStudentsByDepartment(userDept);
    }

    // Otherwise, admin or accountant: fetch across departments
    try {
      const depts = await departmentService.getDepartments();
      const studentPromises = depts.map((d) => this.getStudentsByDepartment(d.id).catch(() => []));
      const results = await Promise.all(studentPromises);
      const flat = results.flat();
      return flat.length > 0 ? flat : INITIAL_STUDENTS;
    } catch (error) {
      console.warn("Could not fetch remote students, falling back to INITIAL_STUDENTS:", error);
      return INITIAL_STUDENTS;
    }
  },

  async getStudentById(departmentId: string, studentId: string): Promise<Student | null> {
    const path = `departments/${departmentId}/students/${studentId}`;
    try {
      const snap = await getDoc(doc(db, "departments", departmentId, "students", studentId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as any), department: departmentId };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async checkRegisterNumberUnique(registerNumber: string, excludeStudentId?: string): Promise<boolean> {
    const cleanReg = normalizeRegisterNumber(registerNumber);
    if (!cleanReg) return true;
    try {
      const all = await this.getAllStudents();
      const existing = all.find(
        (s) =>
          normalizeRegisterNumber(s.registerNumber || s.rollNo || s.roll || "") === cleanReg &&
          s.id !== excludeStudentId
      );
      return !existing;
    } catch {
      return true;
    }
  },

  async createStudent(data: Omit<Student, "id"> & { id?: string }): Promise<string> {
    const deptId = (data.department || "aids").toLowerCase().trim();
    const id = data.id || `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const path = `departments/${deptId}/students/${id}`;
    
    // 1. Verify Register Number Uniqueness across all departments
    const rawReg = data.registerNumber || data.rollNo || data.roll || id;
    const cleanReg = normalizeRegisterNumber(rawReg);
    const isUnique = await this.checkRegisterNumberUnique(cleanReg);
    if (!isUnique) {
      throw new Error(`Register Number "${cleanReg}" already exists. Register Number must be unique across all departments.`);
    }

    try {
      const now = new Date().toISOString();
      const pEmail = (data.parentEmail || data.guardianEmail || "").toLowerCase().trim();
      const pName = data.parentName || data.guardian || "Parent Guardian";
      const parentUid = data.parentId || (pEmail ? `par_${pEmail.replace(/[^a-z0-9]/g, "")}` : `PAR-${id}`);

      const payload: Student = {
        ...data,
        id,
        studentId: id,
        registerNumber: cleanReg,
        rollNo: cleanReg,
        roll: cleanReg,
        department: deptId,
        parentId: parentUid,
        parentName: pName,
        parentEmail: pEmail,
        status: data.status || "active",
        createdAt: data.createdAt || now,
        updatedAt: now,
      };

      // Store in department-specific subcollection: departments/{departmentId}/students/{studentId}
      await setDoc(doc(db, "departments", deptId, "students", id), payload);

      // Also sync to student_auth registry for Register ID + DOB login
      const dobVal = normalizeDateString(data.dateOfBirth || data.dob || "2005-01-01");
      try {
        await setDoc(doc(db, "student_auth", cleanReg), {
          registerNumber: cleanReg,
          dateOfBirth: dobVal,
          studentId: id,
          name: data.name,
          department: deptId,
          grade: data.grade || "",
          parentEmail: pEmail,
          parentName: pName,
          phone: data.phone || "",
          updatedAt: now,
        });
      } catch (authErr) {
        console.warn("Could not register student_auth record:", authErr);
      }

      // Store in dedicated 'parents' collection: parents/{parentId}
      if (pEmail || data.parentName) {
        try {
          const parentDoc = {
            id: parentUid,
            parentId: parentUid,
            name: pName,
            email: pEmail,
            phone: data.parentPhone || data.guardianPhone || "",
            studentId: id,
            linkedStudentId: id,
            studentRegisterNumber: cleanReg,
            studentName: data.name,
            department: deptId,
            role: "parent",
            status: "Active",
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(doc(db, "parents", parentUid), parentDoc, { merge: true });
          // Mirror in users for authentication
          await setDoc(doc(db, "users", parentUid), {
            uid: parentUid,
            ...parentDoc,
            wardName: data.name,
            rollNo: cleanReg,
          }, { merge: true });
        } catch (parErr) {
          console.warn("Could not associate parent record in parents collection:", parErr);
        }
      }

      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateStudent(departmentId: string, studentId: string, updates: Partial<Student>): Promise<void> {
    const origDept = (departmentId || "aids").toLowerCase().trim();
    const targetDept = updates.department ? updates.department.toLowerCase().trim() : origDept;
    const now = new Date().toISOString();

    // Check register number uniqueness if registerNumber is being modified
    if (updates.registerNumber) {
      const cleanReg = normalizeRegisterNumber(updates.registerNumber);
      const isUnique = await this.checkRegisterNumberUnique(cleanReg, studentId);
      if (!isUnique) {
        throw new Error(`Register Number "${cleanReg}" is already assigned to another student.`);
      }
    }

    try {
      // If department changed, migrate to the target department collection
      if (targetDept !== origDept) {
        const oldSnap = await getDoc(doc(db, "departments", origDept, "students", studentId));
        const prevData = oldSnap.exists() ? oldSnap.data() : {};
        const mergedData = {
          ...prevData,
          ...updates,
          id: studentId,
          studentId,
          department: targetDept,
          updatedAt: now,
        };
        // Write to new department
        await setDoc(doc(db, "departments", targetDept, "students", studentId), mergedData);
        // Delete from previous department to prevent cross-department duplication
        await deleteDoc(doc(db, "departments", origDept, "students", studentId));
      } else {
        await updateDoc(doc(db, "departments", origDept, "students", studentId), {
          ...updates,
          updatedAt: now,
        });
      }

      // If parent details updated, update parents collection
      if (updates.parentName || updates.parentEmail || updates.parentPhone) {
        const pEmail = (updates.parentEmail || "").toLowerCase().trim();
        const parentUid = updates.parentId || (pEmail ? `par_${pEmail.replace(/[^a-z0-9]/g, "")}` : null);
        if (parentUid) {
          try {
            await setDoc(
              doc(db, "parents", parentUid),
              {
                parentId: parentUid,
                name: updates.parentName,
                email: pEmail,
                phone: updates.parentPhone,
                department: targetDept,
                updatedAt: now,
              },
              { merge: true }
            );
          } catch (e) {
            console.warn("Could not sync parent update:", e);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `departments/${origDept}/students/${studentId}`);
    }
  },

  async deleteStudent(departmentId: string, studentId: string): Promise<void> {
    const path = `departments/${departmentId}/students/${studentId}`;
    try {
      await deleteDoc(doc(db, "departments", departmentId, "students", studentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  onDepartmentStudentsChange(departmentId: string, callback: (students: Student[]) => void): () => void {
    const path = `departments/${departmentId}/students`;
    return onSnapshot(
      collection(db, "departments", departmentId, "students"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          department: departmentId,
        }));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};
