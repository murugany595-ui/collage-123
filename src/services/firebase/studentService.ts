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

export const INITIAL_STUDENTS: Student[] = [];

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

        // Return Student object from authData if department doc is missing
        return {
          id: authData.studentId,
          name: authData.name,
          registerNumber: authData.registerNumber,
          rollNo: authData.registerNumber,
          dateOfBirth: authData.dateOfBirth,
          dob: authData.dateOfBirth,
          department: authData.department,
          year: "1st Year",
          grade: authData.grade || "B.Tech",
          email: `${cleanReg.toLowerCase()}@college.edu`,
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

    // 2. Search across actual students in departments in Firestore
    const allStudents = await this.getAllStudents().catch(() => []);
    const match = allStudents.find((s) => {
      const sReg = normalizeRegisterNumber(s.registerNumber || s.rollNo || s.roll || s.id);
      return sReg === cleanReg || s.id.toUpperCase() === cleanReg;
    });

    if (!match) {
      throw new Error(`No student record found with Register ID: "${registerId}". Please check your ID or contact the College Administration.`);
    }

    const sDob = normalizeDateString(match.dateOfBirth || match.dob || "");
    if (sDob && sDob !== normalizedDob) {
      throw new Error("Date of Birth does not match the registered record for this Register ID.");
    }

    // Synchronize to student_auth for subsequent logins
    try {
      await setDoc(doc(db, "student_auth", cleanReg), {
        registerNumber: cleanReg,
        dateOfBirth: sDob || normalizedDob,
        studentId: match.id,
        name: match.name,
        department: match.department,
        grade: match.grade || "",
        parentEmail: match.parentEmail || "",
        parentName: match.parentName || "",
        phone: match.phone || "",
        updatedAt: new Date().toISOString(),
      });
    } catch (authSyncErr) {
      console.warn("Could not sync to student_auth:", authSyncErr);
    }

    return match;
  },

  async getStudentsByDepartment(departmentId: string): Promise<Student[]> {
    const path = `departments/${departmentId}/students`;
    try {
      const snap = await getDocs(collection(db, "departments", departmentId, "students"));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        department: departmentId,
      }));
    } catch (error) {
      console.warn(`Could not fetch remote students for ${departmentId}:`, error);
      return [];
    }
  },

  async getAllStudents(currentRole?: string, userDept?: string): Promise<Student[]> {
    if (!auth.currentUser) {
      return [];
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
      return results.flat();
    } catch (error) {
      console.warn("Could not fetch remote students from Firestore:", error);
      return [];
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
