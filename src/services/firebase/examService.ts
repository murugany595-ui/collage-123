import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { departmentService } from "./departmentService";

export interface ExamFeeRecord {
  id: string;
  exam_name: string;
  student_id?: string;
  student_name?: string;
  register_no?: string;
  department: string;
  semester: string;
  year?: string;
  fee_amount: number;
  paid_amount?: number;
  status: "Paid" | "Pending" | "Overdue";
  due_date: string;
  payment_date?: string;
  payment_method?: string;
  reference_no?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const examService = {
  async getExamsByDepartment(departmentId: string): Promise<ExamFeeRecord[]> {
    const path = `departments/${departmentId}/exams`;
    try {
      const snap = await getDocs(collection(db, "departments", departmentId, "exams"));
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        department: departmentId,
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getAllExams(currentRole?: string, userDept?: string): Promise<ExamFeeRecord[]> {
    if (currentRole && currentRole !== "admin" && userDept && userDept !== "all") {
      return this.getExamsByDepartment(userDept);
    }

    try {
      const depts = await departmentService.getDepartments();
      const promises = depts.map((d) => this.getExamsByDepartment(d.id).catch(() => []));
      const results = await Promise.all(promises);
      return results.flat();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "exams");
    }
  },

  async createExam(data: Omit<ExamFeeRecord, "id"> & { id?: string }): Promise<string> {
    const deptId = (data.department || "aids").toLowerCase().trim();
    const id = data.id || `EXM-${Date.now().toString().slice(-6)}`;
    const path = `departments/${deptId}/exams/${id}`;
    try {
      const now = new Date().toISOString();
      const payload: ExamFeeRecord = {
        ...data,
        id,
        department: deptId,
        fee_amount: Number(data.fee_amount || 0),
        status: data.status || "Pending",
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, "departments", deptId, "exams", id), payload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateExam(departmentId: string, examId: string, updates: Partial<ExamFeeRecord>): Promise<void> {
    const path = `departments/${departmentId}/exams/${examId}`;
    try {
      await updateDoc(doc(db, "departments", departmentId, "exams", examId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async recordPayment(
    departmentId: string,
    examId: string,
    body: { payment_date?: string; payment_method?: string; reference_no?: string; remarks?: string }
  ) {
    const path = `departments/${departmentId}/exams/${examId}`;
    try {
      const now = new Date().toISOString().split("T")[0];
      await updateDoc(doc(db, "departments", departmentId, "exams", examId), {
        status: "Paid",
        payment_date: body.payment_date || now,
        payment_method: body.payment_method || "Online",
        reference_no: body.reference_no || `REF-${Date.now().toString().slice(-6)}`,
        remarks: body.remarks || "Payment confirmed",
        updatedAt: new Date().toISOString(),
      });
      return { success: true, message: "Exam fee payment recorded" };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteExam(departmentId: string, examId: string): Promise<void> {
    const path = `departments/${departmentId}/exams/${examId}`;
    try {
      await deleteDoc(doc(db, "departments", departmentId, "exams", examId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getSummary(currentRole?: string, userDept?: string) {
    const all = await this.getAllExams(currentRole, userDept);
    const totalAmount = all.reduce((acc, e) => acc + (e.fee_amount || 0), 0);
    const collectedAmount = all.filter((e) => e.status === "Paid").reduce((acc, e) => acc + (e.fee_amount || 0), 0);
    const pendingAmount = totalAmount - collectedAmount;

    return {
      totalAmount,
      collectedAmount,
      pendingAmount,
      totalCount: all.length,
      paidCount: all.filter((e) => e.status === "Paid").length,
      pendingCount: all.filter((e) => e.status !== "Paid").length,
    };
  },
};
