import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { departmentService } from "./departmentService";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  subject: string;
  status: "Present" | "Absent" | "Leave";
  department: string;
  year?: string;
  section?: string;
  remarks?: string;
  createdAt?: string;
}

export const attendanceService = {
  async getAttendanceByDepartment(
    departmentId: string,
    filters?: { date?: string; year?: string; section?: string; studentId?: string }
  ): Promise<AttendanceRecord[]> {
    if (!auth.currentUser) return [];
    if (departmentId === "all" || !departmentId) {
      return this.getAllAttendance(undefined, undefined, filters);
    }
    const path = `departments/${departmentId}/attendance`;
    try {
      const colRef = collection(db, "departments", departmentId, "attendance");
      const snap = await getDocs(colRef);
      let records: AttendanceRecord[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        department: departmentId,
      }));

      if (filters?.date) {
        records = records.filter((r) => r.date === filters.date);
      }
      if (filters?.year) {
        records = records.filter((r) => r.year === filters.year);
      }
      if (filters?.section) {
        records = records.filter((r) => r.section === filters.section);
      }
      if (filters?.studentId) {
        records = records.filter((r) => r.studentId === filters.studentId);
      }

      return records;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getAllAttendance(
    currentRole?: string,
    userDept?: string,
    filters?: { date?: string; year?: string; section?: string; studentId?: string }
  ): Promise<AttendanceRecord[]> {
    if (!auth.currentUser) return [];
    if (currentRole && currentRole !== "admin" && userDept && userDept !== "all") {
      return this.getAttendanceByDepartment(userDept, filters);
    }

    try {
      const depts = await departmentService.getDepartments();
      const promises = depts.map((d) =>
        this.getAttendanceByDepartment(d.id, filters).catch(() => [])
      );
      const results = await Promise.all(promises);
      return results.flat();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "attendance");
    }
  },

  async recordAttendance(data: Omit<AttendanceRecord, "id"> & { id?: string }): Promise<string> {
    const deptId = (data.department || "aids").toLowerCase().trim();
    const id = data.id || `${data.studentId}_${data.date}_${data.subject || "default"}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const path = `departments/${deptId}/attendance/${id}`;
    try {
      const payload: AttendanceRecord = {
        ...data,
        id,
        department: deptId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "departments", deptId, "attendance", id), payload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async recordBatchAttendance(
    departmentId: string,
    records: Array<{
      student_id?: string;
      studentId?: string;
      student_name?: string;
      studentName?: string;
      status: "Present" | "Absent" | "Leave";
      subject?: string;
      date: string;
      year?: string;
      section?: string;
    }>
  ): Promise<number> {
    const deptId = departmentId.toLowerCase().trim();
    const path = `departments/${deptId}/attendance`;
    try {
      const batch = writeBatch(db);
      let count = 0;
      const now = new Date().toISOString();

      for (const rec of records) {
        const studentId = rec.studentId || rec.student_id || `s-${Date.now()}`;
        const studentName = rec.studentName || rec.student_name || "Unknown Student";
        const sub = rec.subject || "General";
        const id = `${studentId}_${rec.date}_${sub}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        const docRef = doc(db, "departments", deptId, "attendance", id);

        batch.set(
          docRef,
          {
            id,
            studentId,
            studentName,
            status: rec.status,
            subject: sub,
            date: rec.date,
            department: deptId,
            year: rec.year || "",
            section: rec.section || "",
            createdAt: now,
          },
          { merge: true }
        );
        count++;
      }

      await batch.commit();
      return count;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getAttendanceSummary(
    currentRole?: string,
    userDept?: string,
    filters?: { department?: string; year?: string; section?: string; student_id?: string }
  ) {
    const dept = filters?.department || userDept;
    const records = await this.getAllAttendance(currentRole, dept, {
      year: filters?.year,
      section: filters?.section,
      studentId: filters?.student_id,
    });

    const total = records.length;
    const present = records.filter((r) => r.status === "Present").length;
    const absent = records.filter((r) => r.status === "Absent").length;
    const leave = records.filter((r) => r.status === "Leave").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    return {
      total,
      present,
      absent,
      leave,
      attendancePercentage: rate,
      rate,
    };
  },
};
