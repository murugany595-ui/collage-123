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
import {
  createStudentAuthAccount,
  getStudentAuthEmail,
  normalizeRegisterNumber as normalizeRegNumHelper,
} from "./studentAuthHelper";

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

  // If MM-DD-YYYY or MM/DD/YYYY (when day > 12 handled by DMY, check YMD)
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fallback to JS Date parser if valid
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return trimmed;
}

/**
 * Robust Date of Birth verification comparing entered vs stored DOB across multiple formats
 */
export function verifyDobMatch(enteredDob: string, storedDob: string): boolean {
  if (!enteredDob || !storedDob) return false;

  const normEntered = normalizeDateString(enteredDob);
  const normStored = normalizeDateString(storedDob);

  // Exact normalized ISO string match (e.g. "2005-05-15" === "2005-05-15")
  if (normEntered && normStored && normEntered === normStored) {
    return true;
  }

  // Raw digits match (e.g. "20050515" === "20050515")
  const enteredDigits = enteredDob.replace(/[^0-9]/g, "");
  const storedDigits = storedDob.replace(/[^0-9]/g, "");
  if (enteredDigits && storedDigits && enteredDigits === storedDigits) {
    return true;
  }

  // Reversed format match (e.g. DDMMYYYY 15052005 vs YYYYMMDD 20050515)
  if (enteredDigits.length === 8 && storedDigits.length === 8) {
    const dmyToYmd = enteredDigits.slice(4, 8) + enteredDigits.slice(2, 4) + enteredDigits.slice(0, 2);
    if (dmyToYmd === storedDigits) return true;

    const ymdToDmy = enteredDigits.slice(6, 8) + enteredDigits.slice(4, 6) + enteredDigits.slice(0, 4);
    if (ymdToDmy === storedDigits) return true;
  }

  return false;
}

export function normalizeRegisterNumber(reg: string): string {
  return (reg || "").trim().toUpperCase().replace(/\s+/g, "");
}

export const studentService = {
  /**
   * Search Firestore for the student using Registration ID and verify entered DOB against stored DOB.
   * On match, returns full Student object. On mismatch or missing record, throws "Invalid Registration ID or Date of Birth."
   */
  async verifyStudentLogin(registerId: string, dobInput: string): Promise<Student> {
    const cleanReg = normalizeRegisterNumber(registerId);
    const rawDob = (dobInput || "").trim();

    if (!cleanReg || !rawDob) {
      throw new Error("Invalid Registration ID or Date of Birth.");
    }

    console.log(`[StudentAuth] Searching student credentials for Registration ID: "${cleanReg}"`);

    let candidateStudent: Student | null = null;
    let candidateStoredDob: string = "";

    // 1. Primary lookup in student_auth collection by Registration ID
    try {
      const authSnap = await getDoc(doc(db, "student_auth", cleanReg));
      if (authSnap.exists()) {
        const authData = authSnap.data() as StudentAuthRecord;
        candidateStoredDob = authData.dateOfBirth || authData.dob || "";
        candidateStudent = {
          id: authData.studentId || cleanReg,
          studentId: authData.studentId || cleanReg,
          name: authData.name || "Student",
          registerNumber: authData.registerNumber || cleanReg,
          rollNo: authData.registerNumber || cleanReg,
          roll: authData.registerNumber || cleanReg,
          dateOfBirth: candidateStoredDob,
          dob: candidateStoredDob,
          department: (authData.department || "aids").toLowerCase(),
          year: authData.year || "1st Year",
          grade: authData.grade || "B.Tech",
          email: authData.authEmail || `${cleanReg.toLowerCase()}@student.college.edu`,
          parentEmail: authData.parentEmail,
          parentName: authData.parentName,
          phone: authData.phone || "",
          status: "active",
        };
        console.log(`[StudentAuth] Found student in student_auth: "${candidateStudent.name}"`);
      }
    } catch (err: any) {
      console.warn("[StudentAuth] student_auth collection lookup notice:", err?.message || err);
    }

    // 2. Search department subcollections: departments/{dept}/students
    if (!candidateStudent) {
      const depts = ["aids", "cse", "ece", "mech", "it", "civil"];
      for (const dept of depts) {
        try {
          // A. Direct document ID lookup
          const directSnap = await getDoc(doc(db, "departments", dept, "students", cleanReg)).catch(() => null);
          if (directSnap && directSnap.exists()) {
            const data = directSnap.data();
            candidateStoredDob = data.dateOfBirth || data.dob || "";
            candidateStudent = {
              id: directSnap.id,
              studentId: data.studentId || directSnap.id,
              department: dept,
              ...(data as any),
            };
            console.log(`[StudentAuth] Found student by direct doc in departments/${dept}/students`);
            break;
          }

          // B. Query by registerNumber
          const qReg = await getDocs(
            query(collection(db, "departments", dept, "students"), where("registerNumber", "==", cleanReg))
          ).catch(() => null);

          if (qReg && !qReg.empty) {
            const docFound = qReg.docs[0];
            const data = docFound.data();
            candidateStoredDob = data.dateOfBirth || data.dob || "";
            candidateStudent = {
              id: docFound.id,
              studentId: data.studentId || docFound.id,
              department: dept,
              ...(data as any),
            };
            console.log(`[StudentAuth] Found student by registerNumber in departments/${dept}/students`);
            break;
          }

          // C. Query by rollNo
          const qRoll = await getDocs(
            query(collection(db, "departments", dept, "students"), where("rollNo", "==", cleanReg))
          ).catch(() => null);

          if (qRoll && !qRoll.empty) {
            const docFound = qRoll.docs[0];
            const data = docFound.data();
            candidateStoredDob = data.dateOfBirth || data.dob || "";
            candidateStudent = {
              id: docFound.id,
              studentId: data.studentId || docFound.id,
              department: dept,
              ...(data as any),
            };
            console.log(`[StudentAuth] Found student by rollNo in departments/${dept}/students`);
            break;
          }

          // D. Department collection scan
          const deptDocs = await getDocs(collection(db, "departments", dept, "students")).catch(() => null);
          if (deptDocs && !deptDocs.empty) {
            for (const d of deptDocs.docs) {
              const data = d.data();
              const sReg = normalizeRegisterNumber(data.registerNumber || data.rollNo || data.roll || d.id);
              if (sReg === cleanReg) {
                candidateStoredDob = data.dateOfBirth || data.dob || "";
                candidateStudent = {
                  id: d.id,
                  studentId: data.studentId || d.id,
                  department: dept,
                  ...(data as any),
                };
                console.log(`[StudentAuth] Found student by scan in departments/${dept}/students`);
                break;
              }
            }
            if (candidateStudent) break;
          }
        } catch (deptErr: any) {
          console.warn(`[StudentAuth] Notice querying departments/${dept}/students:`, deptErr?.message || deptErr);
        }
      }
    }

    // 3. Search top-level students collection
    if (!candidateStudent) {
      try {
        const topSnap = await getDoc(doc(db, "students", cleanReg)).catch(() => null);
        if (topSnap && topSnap.exists()) {
          const data = topSnap.data();
          candidateStoredDob = data.dateOfBirth || data.dob || "";
          candidateStudent = {
            id: topSnap.id,
            studentId: data.studentId || topSnap.id,
            ...(data as any),
          };
          console.log(`[StudentAuth] Found student in top-level students doc`);
        } else {
          const qTop = await getDocs(
            query(collection(db, "students"), where("registerNumber", "==", cleanReg))
          ).catch(() => null);
          if (qTop && !qTop.empty) {
            const d = qTop.docs[0];
            const data = d.data();
            candidateStoredDob = data.dateOfBirth || data.dob || "";
            candidateStudent = {
              id: d.id,
              studentId: data.studentId || d.id,
              ...(data as any),
            };
            console.log(`[StudentAuth] Found student in top-level students by query`);
          }
        }
      } catch (topErr: any) {
        console.warn("[StudentAuth] Top-level students search notice:", topErr?.message || topErr);
      }
    }

    // 4. Server-side assisted fallback lookup
    if (!candidateStudent) {
      try {
        const srvRes = await fetch("/api/student/verify-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registerId: cleanReg, dob: rawDob }),
        }).catch(() => null);

        if (srvRes && srvRes.ok) {
          const srvData = await srvRes.json();
          if (srvData.success && srvData.student) {
            candidateStudent = srvData.student;
            candidateStoredDob = srvData.student.dateOfBirth || srvData.student.dob || "";
            console.log(`[StudentAuth] Verified via server fallback endpoint`);
          }
        }
      } catch (srvErr: any) {
        console.warn("[StudentAuth] Server fallback notice:", srvErr?.message || srvErr);
      }
    }

    // If no candidate student found across Firestore
    if (!candidateStudent) {
      console.warn(`[StudentAuth] No student found with Registration ID: "${cleanReg}"`);
      // Requirement 12 & 13: Do not expose whether the Registration ID exists.
      throw new Error("Invalid Registration ID or Date of Birth.");
    }

    // 5. Verify DOB against stored DOB
    const isDobValid = verifyDobMatch(rawDob, candidateStoredDob);
    if (!isDobValid) {
      console.warn(
        `[StudentAuth] Date of Birth mismatch for Registration ID "${cleanReg}". Entered: "${rawDob}", Stored: "${candidateStoredDob}"`
      );
      // Requirement 12 & 13: Do not expose existence. Show exact unified message.
      throw new Error("Invalid Registration ID or Date of Birth.");
    }

    console.log(`[StudentAuth] Successfully verified student: "${candidateStudent.name}" (${cleanReg})`);

    // Return complete normalized Student object
    return {
      id: candidateStudent.id || candidateStudent.studentId || cleanReg,
      studentId: candidateStudent.studentId || candidateStudent.id || cleanReg,
      name: candidateStudent.name || "Student",
      registerNumber: cleanReg,
      rollNo: cleanReg,
      roll: cleanReg,
      department: (candidateStudent.department || "aids").toLowerCase(),
      dateOfBirth: candidateStoredDob || normalizeDateString(rawDob),
      dob: candidateStoredDob || normalizeDateString(rawDob),
      year: candidateStudent.year || "1st Year",
      grade: candidateStudent.grade || "B.Tech",
      email: candidateStudent.email || `${cleanReg.toLowerCase()}@student.college.edu`,
      phone: candidateStudent.phone || "",
      parentName: candidateStudent.parentName || (candidateStudent as any).guardian || "",
      parentEmail: candidateStudent.parentEmail || (candidateStudent as any).guardianEmail || "",
      status: candidateStudent.status || "active",
      admissionYear: candidateStudent.admissionYear || "2024",
    };
  },

  async getStudentsByDepartment(departmentId: string): Promise<Student[]> {
    if (!auth.currentUser && !localStorage.getItem("edufee_token")) return [];
    if (departmentId === "all" || !departmentId) {
      return this.getAllStudents();
    }
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
    try {
      const studentMap = new Map<string, Student>();

      // 1. Fetch from canonical department subcollections
      const depts = await departmentService.getDepartments().catch(() => []);
      const studentPromises = depts.map((d) => this.getStudentsByDepartment(d.id).catch(() => []));
      const results = await Promise.all(studentPromises);
      results.flat().forEach((s) => {
        studentMap.set(s.id || s.studentId || s.registerNumber, s);
      });

      // 2. Also check top-level students collection if available
      try {
        const topSnap = await getDocs(collection(db, "students"));
        topSnap.docs.forEach((d) => {
          const data = d.data();
          const cleanStatus = (data.status || "active").toLowerCase();
          const validStatus = cleanStatus === "inactive" || cleanStatus === "graduated" || cleanStatus === "suspended" ? cleanStatus : "active";
          const sObj: Student = {
            id: d.id,
            studentId: data.student_id || data.studentId || d.id,
            student_id: data.student_id || data.studentId || d.id,
            name: data.student_name || data.name || "Student",
            student_name: data.student_name || data.name || "Student",
            registerNumber: data.register_id || data.registerNumber || d.id,
            register_id: data.register_id || data.registerNumber || d.id,
            rollNo: data.register_id || data.rollNo || d.id,
            department: data.department || "General",
            year: data.year || "1st Year",
            dateOfBirth: data.date_of_birth || data.dob || "",
            dob: data.date_of_birth || data.dob || "",
            phone: data.phone || "",
            status: validStatus as any,
            email: data.email || `${(data.register_id || d.id).toLowerCase()}@student.college.edu`,
            ...data,
          } as Student;
          if (!studentMap.has(d.id) && !studentMap.has(sObj.registerNumber)) {
            studentMap.set(d.id, sObj);
          }
        });
      } catch {}

      let list = Array.from(studentMap.values());
      if (currentRole && currentRole !== "admin" && currentRole !== "accountant" && userDept && userDept !== "all") {
        list = list.filter((s) => s.department?.toLowerCase() === userDept.toLowerCase());
      }
      return list;
    } catch (error) {
      console.warn("Could not fetch remote students from Firestore:", error);
      return [];
    }
  },

  async getStudentById(departmentId: string, studentId: string): Promise<Student | null> {
    if ((!auth.currentUser && !localStorage.getItem("edufee_token")) || !studentId) return null;
    if (departmentId === "all" || !departmentId) {
      return this.getStudentByAnyId(studentId);
    }
    const path = `departments/${departmentId}/students/${studentId}`;
    try {
      const snap = await getDoc(doc(db, "departments", departmentId, "students", studentId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as any), department: departmentId };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async getStudentByAnyId(studentId: string): Promise<Student | null> {
    if (!studentId) return null;
    const cleanId = studentId.trim();

    try {
      // 1. Check all departments
      const all = await this.getAllStudents();
      const match = all.find(
        (s) =>
          s.id === cleanId ||
          (s as any).studentId === cleanId ||
          (s as any).uid === cleanId ||
          (s as any).authUid === cleanId ||
          normalizeRegisterNumber(s.registerNumber || s.rollNo || s.roll || "") === normalizeRegisterNumber(cleanId)
      );
      if (match) return match;

      // 2. Direct probe across known departments if not found in list
      const depts = ["aids", "cse", "ece", "mech", "eee", "civil"];
      for (const d of depts) {
        const snap = await getDoc(doc(db, "departments", d, "students", cleanId)).catch(() => null);
        if (snap && snap.exists()) {
          return { id: snap.id, ...(snap.data() as any), department: d };
        }
      }

      // 3. Direct probe student_auth registry by Register Number
      const cleanReg = normalizeRegisterNumber(cleanId);
      if (cleanReg) {
        const authSnap = await getDoc(doc(db, "student_auth", cleanReg)).catch(() => null);
        if (authSnap && authSnap.exists()) {
          const authData = authSnap.data();
          const targetDept = (authData.department || "aids").toLowerCase();
          const targetDocId = authData.studentId || cleanId;
          const snap = await getDoc(doc(db, "departments", targetDept, "students", targetDocId)).catch(() => null);
          if (snap && snap.exists()) {
            return { id: snap.id, ...(snap.data() as any), department: targetDept };
          }
          // Fallback student object from authData if subcollection record was moved
          return {
            id: targetDocId,
            studentId: targetDocId,
            name: authData.name || "Student",
            registerNumber: authData.registerNumber || cleanReg,
            rollNo: authData.registerNumber || cleanReg,
            department: targetDept,
            grade: authData.grade || "B.Tech AI&DS",
            year: "1st Year",
            dateOfBirth: authData.dateOfBirth || "",
            dob: authData.dateOfBirth || "",
            email: authData.authEmail || getStudentAuthEmail(cleanReg),
            parentEmail: authData.parentEmail || "",
            parentName: authData.parentName || "",
            status: "active",
          };
        }
      }

      // 4. Direct probe users collection by UID
      const userSnap = await getDoc(doc(db, "users", cleanId)).catch(() => null);
      if (userSnap && userSnap.exists()) {
        const uData = userSnap.data();
        const targetDept = (uData.department || "aids").toLowerCase();
        const targetDocId = uData.studentId || cleanId;
        const snap = await getDoc(doc(db, "departments", targetDept, "students", targetDocId)).catch(() => null);
        if (snap && snap.exists()) {
          return { id: snap.id, ...(snap.data() as any), department: targetDept };
        }
      }

      return null;
    } catch (err) {
      console.warn("Could not find student by ID:", err);
      return null;
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

  async createStudent(data: Omit<Student, "id"> & { id?: string; password?: string; studentPassword?: string }): Promise<string> {
    const deptId = (data.department || "aids").toLowerCase().trim();
    
    // 1. Verify Register Number Uniqueness across all departments
    const rawReg = data.registerNumber || data.rollNo || data.roll || data.id || `REG-${Math.floor(1000 + Math.random() * 8999)}`;
    const cleanReg = normalizeRegisterNumber(rawReg);
    const isUnique = await this.checkRegisterNumberUnique(cleanReg);
    if (!isUnique) {
      throw new Error(`Register Number "${cleanReg}" already exists. Register Number must be unique across all departments.`);
    }

    try {
      const now = new Date().toISOString();
      const pEmail = (data.parentEmail || data.guardianEmail || "").toLowerCase().trim();
      const pName = data.parentName || data.guardian || "Parent Guardian";

      // 2. Prepare Student Assigned Password (minimum 6 characters)
      let studentPassword =
        data.password ||
        data.studentPassword ||
        (data.dateOfBirth || data.dob ? String(data.dateOfBirth || data.dob).replace(/[^0-9]/g, "") : "");
      
      if (!studentPassword || studentPassword.length < 6) {
        studentPassword = `Stud@${cleanReg.replace(/[^A-Za-z0-9]/g, "")}`;
        if (studentPassword.length < 6) {
          studentPassword = `Student@${cleanReg}123`;
        }
      }

      // 3. Provision Student in Firebase Authentication
      let studentUid = data.id || "";
      let authEmail = getStudentAuthEmail(cleanReg);

      try {
        const authResult = await createStudentAuthAccount({
          registerNumber: cleanReg,
          password: studentPassword,
          name: data.name,
          email: data.email,
        });
        studentUid = authResult.uid || studentUid || `stu_${cleanReg.toLowerCase()}`;
        authEmail = authResult.authEmail || authEmail;
      } catch (authErr: any) {
        console.warn("[studentService] Firebase Auth creation notice:", authErr.message);
        if (!studentUid) {
          studentUid = `stu_${cleanReg.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        }
      }

      const id = studentUid;
      const path = `departments/${deptId}/students/${id}`;
      const parentUid = data.parentId || (pEmail ? `par_${pEmail.replace(/[^a-z0-9]/g, "")}` : `PAR-${id}`);
      const dobVal = normalizeDateString(data.dateOfBirth || data.dob || "2005-01-01");

      const payload: Student = {
        ...data,
        id,
        studentId: id,
        registerNumber: cleanReg,
        rollNo: cleanReg,
        roll: cleanReg,
        department: deptId,
        email: data.email || authEmail,
        dateOfBirth: dobVal,
        dob: dobVal,
        parentId: parentUid,
        parentName: pName,
        parentEmail: pEmail,
        status: data.status || "active",
        createdAt: data.createdAt || now,
        updatedAt: now,
      };

      // 4. Store in department-specific subcollection: departments/{departmentId}/students/{studentId}
      await setDoc(doc(db, "departments", deptId, "students", id), {
        ...payload,
        uid: studentUid,
        authUid: studentUid,
        authEmail,
      });

      // Also ensure if custom id was provided, store an alias/pointer
      if (data.id && data.id !== id) {
        await setDoc(doc(db, "departments", deptId, "students", data.id), {
          ...payload,
          id: data.id,
          studentId: id,
          uid: studentUid,
          authUid: studentUid,
          authEmail,
        }).catch(() => {});
      }

      // 5. Store in user profiles: users/{studentUid}
      try {
        await setDoc(
          doc(db, "users", studentUid),
          {
            uid: studentUid,
            id: studentUid,
            studentId: id,
            name: data.name,
            email: authEmail,
            studentEmail: data.email || authEmail,
            role: "student",
            department: deptId,
            rollNo: cleanReg,
            registerNumber: cleanReg,
            phone: data.phone || "",
            wardName: data.name,
            status: "active",
            createdAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (userErr) {
        console.warn("Could not save to users collection:", userErr);
      }

      // 6. Store in student_auth registry for instantaneous Register ID resolution and credentials mapping
      try {
        await setDoc(doc(db, "student_auth", cleanReg), {
          registerNumber: cleanReg,
          cleanRegisterNumber: cleanReg.toLowerCase().replace(/[^a-z0-9]/g, ""),
          authEmail,
          uid: studentUid,
          studentId: id,
          name: data.name,
          department: deptId,
          grade: data.grade || "",
          dateOfBirth: dobVal,
          dob: dobVal,
          parentEmail: pEmail,
          parentName: pName,
          phone: data.phone || "",
          password: studentPassword,
          updatedAt: now,
        });
      } catch (authErr) {
        console.warn("Could not register student_auth record:", authErr);
      }

      // 7. Store in dedicated 'parents' collection: parents/{parentId}
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
      handleFirestoreError(error, OperationType.WRITE, `departments/${deptId}/students`);
    }
  },

  async updateStudent(departmentId: string, studentId: string, updates: Partial<Student> & { password?: string; studentPassword?: string }): Promise<void> {
    let origDept = (departmentId || "").toLowerCase().trim();
    let oldSnap = origDept ? await getDoc(doc(db, "departments", origDept, "students", studentId)).catch(() => null) : null;

    // Locate actual document if not found at provided origDept
    if (!oldSnap || !oldSnap.exists()) {
      const all = await this.getAllStudents().catch(() => []);
      const match = all.find((s) => s.id === studentId || (s as any).studentId === studentId);
      if (match && match.department) {
        origDept = match.department.toLowerCase().trim();
        oldSnap = await getDoc(doc(db, "departments", origDept, "students", studentId)).catch(() => null);
      }
    }

    if (!origDept) {
      origDept = (updates.department || "aids").toLowerCase().trim();
    }

    const prevData: any = oldSnap && oldSnap.exists() ? oldSnap.data() : {};
    const targetDept = updates.department ? updates.department.toLowerCase().trim() : origDept;
    const now = new Date().toISOString();
    const oldReg = normalizeRegisterNumber(prevData.registerNumber || prevData.rollNo || prevData.roll || "");

    // Check register number uniqueness if registerNumber is being modified
    if (updates.registerNumber) {
      const cleanReg = normalizeRegisterNumber(updates.registerNumber);
      if (cleanReg !== oldReg) {
        const isUnique = await this.checkRegisterNumberUnique(cleanReg, studentId);
        if (!isUnique) {
          throw new Error(`Register Number "${cleanReg}" is already assigned to another student.`);
        }
      }
    }

    try {
      // Fetch existing student_auth details to preserve login password & UID
      let existingAuthData: any = null;
      if (oldReg) {
        const oldAuthSnap = await getDoc(doc(db, "student_auth", oldReg)).catch(() => null);
        if (oldAuthSnap && oldAuthSnap.exists()) {
          existingAuthData = oldAuthSnap.data();
        }
      }

      const studentUid =
        prevData.uid ||
        prevData.authUid ||
        existingAuthData?.uid ||
        studentId;

      const finalReg = normalizeRegisterNumber(updates.registerNumber || prevData.registerNumber || prevData.rollNo || prevData.roll || "");

      const studentPassword =
        (updates as any).password ||
        (updates as any).studentPassword ||
        existingAuthData?.password ||
        prevData.password ||
        `Stud@${finalReg}`;

      const authEmail =
        existingAuthData?.authEmail ||
        prevData.authEmail ||
        getStudentAuthEmail(finalReg);

      const mergedData: any = {
        ...prevData,
        ...updates,
        id: studentId,
        studentId: prevData.studentId || studentId,
        uid: studentUid,
        authUid: studentUid,
        authEmail,
        department: targetDept,
        updatedAt: now,
      };

      if (finalReg) {
        mergedData.registerNumber = finalReg;
        mergedData.rollNo = finalReg;
        mergedData.roll = finalReg;
      }

      // If department changed, migrate to the target department collection
      if (targetDept !== origDept) {
        // Write to new department
        await setDoc(doc(db, "departments", targetDept, "students", studentId), mergedData);
        // Delete from previous department to prevent cross-department duplication
        await deleteDoc(doc(db, "departments", origDept, "students", studentId)).catch(() => {});
      } else {
        await setDoc(doc(db, "departments", origDept, "students", studentId), mergedData, { merge: true });
      }

      // Sync updated profile to users/{studentId} and users/{studentUid}
      try {
        const pName = updates.parentName || updates.guardian || prevData.parentName || prevData.guardian || "";
        const pEmail = (updates.parentEmail || updates.guardianEmail || prevData.parentEmail || prevData.guardianEmail || "").toLowerCase().trim();

        const userUpdates: any = {
          name: mergedData.name,
          department: targetDept,
          rollNo: finalReg,
          registerNumber: finalReg,
          wardName: mergedData.name,
          parentName: pName,
          parentEmail: pEmail,
          updatedAt: now,
        };
        if (mergedData.email) userUpdates.studentEmail = mergedData.email;
        if (mergedData.phone) userUpdates.phone = mergedData.phone;
        if (mergedData.status) userUpdates.status = mergedData.status;

        await setDoc(doc(db, "users", studentId), userUpdates, { merge: true }).catch(() => {});
        if (studentUid && studentUid !== studentId) {
          await setDoc(doc(db, "users", studentUid), userUpdates, { merge: true }).catch(() => {});
        }
      } catch (userSyncErr) {
        console.warn("Could not sync user profile:", userSyncErr);
      }

      // Sync student_auth record to preserve instantaneous login with assigned credentials
      if (finalReg) {
        try {
          const pName = updates.parentName || updates.guardian || prevData.parentName || prevData.guardian || "";
          const pEmail = (updates.parentEmail || updates.guardianEmail || prevData.parentEmail || prevData.guardianEmail || "").toLowerCase().trim();

          await setDoc(
            doc(db, "student_auth", finalReg),
            {
              registerNumber: finalReg,
              cleanRegisterNumber: finalReg.toLowerCase().replace(/[^a-z0-9]/g, ""),
              authEmail,
              uid: studentUid,
              studentId,
              name: mergedData.name,
              department: targetDept,
              grade: mergedData.grade || "",
              dateOfBirth: mergedData.dateOfBirth || mergedData.dob || "",
              dob: mergedData.dateOfBirth || mergedData.dob || "",
              phone: mergedData.phone || "",
              parentName: pName,
              parentEmail: pEmail,
              password: studentPassword,
              updatedAt: now,
            },
            { merge: true }
          );

          // If register number was modified, clean up the old student_auth document
          if (oldReg && oldReg !== finalReg) {
            await deleteDoc(doc(db, "student_auth", oldReg)).catch(() => {});
          }
        } catch (authSyncErr) {
          console.warn("Could not sync student_auth record:", authSyncErr);
        }
      }

      // If parent details updated, update parents collection
      if (updates.parentName || updates.parentEmail || updates.parentPhone || updates.guardian || updates.guardianEmail || updates.guardianPhone) {
        const pEmail = (updates.parentEmail || updates.guardianEmail || prevData.parentEmail || prevData.guardianEmail || "").toLowerCase().trim();
        const pName = updates.parentName || updates.guardian || prevData.parentName || prevData.guardian || "Parent Guardian";
        const parentUid = prevData.parentId || (pEmail ? `par_${pEmail.replace(/[^a-z0-9]/g, "")}` : null);
        if (parentUid) {
          try {
            await setDoc(
              doc(db, "parents", parentUid),
              {
                parentId: parentUid,
                name: pName,
                email: pEmail,
                phone: updates.parentPhone || updates.guardianPhone || prevData.parentPhone || "",
                department: targetDept,
                studentName: mergedData.name,
                studentRegisterNumber: finalReg,
                updatedAt: now,
              },
              { merge: true }
            );
          } catch (e) {
            console.warn("Could not sync parent update:", e);
          }
        }
      }

      // Sync student details on existing fee records to preserve fee payment history with updated student identity
      try {
        const allDepts = ["aids", "cse", "ece", "mech", "eee", "civil"];
        for (const d of allDepts) {
          const feesSnap = await getDocs(
            query(collection(db, "departments", d, "fees"), where("studentId", "==", studentId))
          ).catch(() => null);
          if (feesSnap && !feesSnap.empty) {
            for (const fDoc of feesSnap.docs) {
              await setDoc(
                fDoc.ref,
                {
                  studentName: mergedData.name,
                  studentRegisterNumber: finalReg,
                  rollNo: finalReg,
                  department: targetDept,
                  updatedAt: now,
                },
                { merge: true }
              ).catch(() => {});
            }
          }
        }
      } catch (feeSyncErr) {
        console.warn("Could not sync student fee records:", feeSyncErr);
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
