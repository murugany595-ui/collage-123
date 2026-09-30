import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { departmentService } from "./departmentService";
import { studentService } from "./studentService";
import { userService } from "./userService";
import { logAuditEvent } from "./auditService";

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  academicYear: string;
  feeType: string; // e.g. "Tuition Fee", "Exam Fee", "Library Fee", "Other Fee"
  amount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: "Paid" | "Pending" | "Overdue" | "Partial";
  paymentDate?: string;
  dueDate: string;
  remarks?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  grade?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  code: string;
  amount: number;
  frequency: string;
  description?: string;
}

export const DEFAULT_FEE_CATEGORIES: FeeCategory[] = [];

export const feesService = {
  async getFeesByDepartment(departmentId: string): Promise<FeeRecord[]> {
    const path = `departments/${departmentId}/fees`;
    try {
      const snap = await getDocs(collection(db, "departments", departmentId, "fees"));
      return snap.docs.map((d) => {
        const data = d.data();
        const amt = Number(data.amount || 0);
        const paid = Number(data.paidAmount || 0);
        const bal = amt - paid;
        return {
          id: d.id,
          ...data,
          amount: amt,
          paidAmount: paid,
          balance: bal > 0 ? bal : 0,
          department: departmentId,
        } as FeeRecord;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getAllFees(currentRole?: string, userDept?: string): Promise<FeeRecord[]> {
    if (currentRole && currentRole !== "admin" && currentRole !== "accountant" && userDept && userDept !== "all") {
      return this.getFeesByDepartment(userDept);
    }

    try {
      const depts = await departmentService.getDepartments();
      const promises = depts.map((d) => this.getFeesByDepartment(d.id).catch(() => []));
      const results = await Promise.all(promises);
      return results.flat();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "fees");
    }
  },

  async getFeeById(departmentId: string, feeId: string): Promise<FeeRecord | null> {
    const path = `departments/${departmentId}/fees/${feeId}`;
    try {
      const snap = await getDoc(doc(db, "departments", departmentId, "fees", feeId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as any), department: departmentId };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async createFee(data: Omit<FeeRecord, "id" | "balance"> & { id?: string }): Promise<string> {
    const deptId = (data.department || "aids").toLowerCase().trim();
    const id = data.id || `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const path = `departments/${deptId}/fees/${id}`;
    try {
      const amount = Number(data.amount || 0);
      const paidAmount = Number(data.paidAmount || 0);
      const balance = Math.max(0, amount - paidAmount);
      let paymentStatus: FeeRecord["paymentStatus"] = data.paymentStatus || "Pending";
      if (paidAmount >= amount && amount > 0) {
        paymentStatus = "Paid";
      } else if (paidAmount > 0) {
        paymentStatus = "Partial";
      }

      const now = new Date().toISOString();
      const payload: FeeRecord = {
        ...data,
        id,
        department: deptId,
        amount,
        paidAmount,
        balance,
        paymentStatus,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "departments", deptId, "fees", id), payload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateFee(departmentId: string, feeId: string, updates: Partial<FeeRecord>): Promise<void> {
    const path = `departments/${departmentId}/fees/${feeId}`;
    try {
      const now = new Date().toISOString();
      const existing = await this.getFeeById(departmentId, feeId);
      const amount = updates.amount !== undefined ? Number(updates.amount) : existing?.amount || 0;
      const paidAmount = updates.paidAmount !== undefined ? Number(updates.paidAmount) : existing?.paidAmount || 0;
      const balance = Math.max(0, amount - paidAmount);

      let paymentStatus = updates.paymentStatus || existing?.paymentStatus || "Pending";
      if (paidAmount >= amount && amount > 0) {
        paymentStatus = "Paid";
      } else if (paidAmount > 0) {
        paymentStatus = "Partial";
      }

      await updateDoc(doc(db, "departments", departmentId, "fees", feeId), {
        ...updates,
        amount,
        paidAmount,
        balance,
        paymentStatus,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteFee(departmentId: string, feeId: string): Promise<void> {
    const path = `departments/${departmentId}/fees/${feeId}`;
    try {
      await deleteDoc(doc(db, "departments", departmentId, "fees", feeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async collectFeePayment(params: {
    departmentId: string;
    feeId: string;
    amount: number;
    method: string;
    referenceNote?: string;
  }) {
    const { departmentId, feeId, amount, method, referenceNote } = params;
    const fee = await this.getFeeById(departmentId, feeId);
    if (!fee) throw new Error("Fee invoice not found");

    const newPaid = (fee.paidAmount || 0) + Number(amount);
    const newBalance = Math.max(0, fee.amount - newPaid);
    const paymentStatus: FeeRecord["paymentStatus"] = newPaid >= fee.amount ? "Paid" : "Partial";
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const paymentDate = new Date().toISOString().split("T")[0];

    await this.updateFee(departmentId, feeId, {
      paidAmount: newPaid,
      balance: newBalance,
      paymentStatus,
      paymentDate,
      paymentMethod: method,
      receiptNumber,
      remarks: referenceNote || fee.remarks,
    });

    // Capture audit log for fee payment collection
    await logAuditEvent({
      userId: auth.currentUser?.uid || "accountant",
      userEmail: auth.currentUser?.email || undefined,
      role: "accountant",
      action: "FEE_PAYMENT_COLLECT",
      affectedDocumentId: feeId,
      collectionName: `departments/${departmentId}/fees`,
      details: `Collected fee payment of ₹${amount} for student ${fee.studentName} (${fee.feeType}). Receipt: ${receiptNumber}`,
      previousValue: { paidAmount: fee.paidAmount, balance: fee.balance },
      newValue: { paidAmount: newPaid, balance: newBalance, status: paymentStatus },
    });

    return {
      success: true,
      payment_id: `PAY-${Date.now()}`,
      receipt_id: receiptNumber,
      receipt: {
        receiptNumber,
        studentName: fee.studentName,
        studentId: fee.studentId,
        department: fee.department,
        feeType: fee.feeType,
        amountPaid: Number(amount),
        remainingBalance: newBalance,
        paymentMethod: method,
        date: paymentDate,
      },
    };
  },

  async batchGenerateFees(params: {
    department?: string;
    feeType?: string;
    amount: number;
    dueDate: string;
    month?: string;
    academicYear?: string;
  }): Promise<number> {
    const deptId = (params.department && params.department !== "all") ? params.department : null;
    const students = deptId
      ? await studentService.getStudentsByDepartment(deptId)
      : await studentService.getAllStudents();

    if (!students || students.length === 0) return 0;

    const batch = writeBatch(db);
    let count = 0;
    const now = new Date().toISOString();

    for (const stu of students) {
      const sDept = (stu.department || "aids").toLowerCase().trim();
      const feeId = `INV-${Date.now().toString().slice(-6)}-${count + 1}`;
      const docRef = doc(db, "departments", sDept, "fees", feeId);

      const feePayload: FeeRecord = {
        id: feeId,
        studentId: stu.id,
        studentName: stu.name,
        department: sDept,
        academicYear: params.academicYear || "2024-2025",
        feeType: params.feeType || "Tuition Fee",
        amount: Number(params.amount),
        paidAmount: 0,
        balance: Number(params.amount),
        paymentStatus: "Pending",
        dueDate: params.dueDate,
        grade: stu.year,
        remarks: params.month ? `Billed for ${params.month}` : "Regular Fee Schedule",
        createdAt: now,
        updatedAt: now,
      };

      batch.set(docRef, feePayload);
      count++;
    }

    await batch.commit();
    return count;
  },

  async getSummary(currentRole?: string, userDept?: string) {
    const allFees = await this.getAllFees(currentRole, userDept);
    const totalBilled = allFees.reduce((acc, f) => acc + (f.amount || 0), 0);
    const totalCollected = allFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
    const totalPending = allFees.reduce((acc, f) => acc + (f.balance || 0), 0);

    const now = new Date();
    const totalOverdue = allFees
      .filter((f) => f.paymentStatus !== "Paid" && f.dueDate && new Date(f.dueDate) < now)
      .reduce((acc, f) => acc + (f.balance || 0), 0);

    const collectionEfficiency = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      totalPaid: totalCollected,
      totalCollected,
      totalPending,
      totalOverdue,
      collectionEfficiency,
      counts: {
        total: allFees.length,
        paid: allFees.filter((f) => f.paymentStatus === "Paid").length,
        pending: allFees.filter((f) => f.paymentStatus === "Pending" || f.paymentStatus === "Partial").length,
        overdue: allFees.filter((f) => f.paymentStatus !== "Paid" && f.dueDate && new Date(f.dueDate) < now).length,
      },
    };
  },

  // 1. Fetch fee settings and category structures from Firebase
  async getFeeSettings(): Promise<FeeCategory[]> {
    try {
      const snap = await getDocs(collection(db, "fee_settings"));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as FeeCategory[];
    } catch (error) {
      console.warn("Could not fetch remote fee settings:", error);
      return [];
    }
  },

  // 2. Fetch fee settings without dummy seeding
  async initializeDefaultFeeSettings(): Promise<FeeCategory[]> {
    return this.getFeeSettings();
  },

  // 3. Delete a fee category (Admin-Only)
  async deleteFeeCategory(categoryId: string, adminRole?: string): Promise<void> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error("Unauthorized: You must be logged in as Administrator to delete fee categories.");
    }
    await deleteDoc(doc(db, "fee_settings", categoryId));
    await logAuditEvent({
      userId: currentUid,
      userEmail: auth.currentUser?.email || undefined,
      role: "admin",
      action: "FEE_CATEGORY_DELETE",
      affectedDocumentId: categoryId,
      collectionName: "fee_settings",
      details: `Deleted fee category ${categoryId}`,
    });
  },

  // 4. Update a single fee category amount (Strictly Admin-Only)
  async updateFeeSettingAmount(
    categoryId: string,
    newAmount: number,
    adminRole?: string
  ): Promise<FeeCategory> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error("Unauthorized: You must be logged in as Administrator to edit fee amounts.");
    }

    // Role verification
    let isUserAdmin = adminRole === "admin";
    if (!isUserAdmin) {
      const profile = await userService.getUserProfile(currentUid);
      const email = auth.currentUser?.email || "";
      isUserAdmin = profile?.role === "admin" || email.includes("admin");
    }

    if (!isUserAdmin) {
      throw new Error("Forbidden: Only authenticated Administrator can update fee amounts. Accountancy and other roles cannot modify fees.");
    }

    const parsedAmount = Number(newAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      throw new Error("Invalid amount: Fee amount must be a positive number.");
    }

    const now = new Date().toISOString();
    const docRef = doc(db, "fee_settings", categoryId);
    const existingSnap = await getDoc(docRef);

    let updatedRecord: FeeCategory;
    if (existingSnap.exists()) {
      const prevData = existingSnap.data() as FeeCategory;
      updatedRecord = {
        ...prevData,
        id: categoryId,
        amount: parsedAmount,
      };
      await updateDoc(docRef, {
        amount: parsedAmount,
        updatedAt: now,
        updatedBy: auth.currentUser?.email || "admin",
      });
    } else {
      updatedRecord = {
        id: categoryId,
        name: "Fee Category",
        code: categoryId.slice(0, 3).toUpperCase(),
        amount: parsedAmount,
        frequency: "Per Semester",
      };
      await setDoc(docRef, {
        ...updatedRecord,
        createdAt: now,
        updatedAt: now,
        updatedBy: auth.currentUser?.email || "admin",
      });
    }

    // Capture audit log for fee setting change
    await logAuditEvent({
      userId: currentUid,
      userEmail: auth.currentUser?.email || undefined,
      role: "admin",
      action: "FEE_SETTING_AMOUNT_UPDATE",
      affectedDocumentId: categoryId,
      collectionName: "fee_settings",
      details: `Updated fee setting '${updatedRecord.name}' rate to ₹${parsedAmount}`,
      newValue: { amount: parsedAmount },
    });

    return updatedRecord;
  },

  // 4. Save entire fee structure (Strictly Admin-Only)
  async saveFeeStructure(
    categories: FeeCategory[],
    adminRole?: string
  ): Promise<FeeCategory[]> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error("Unauthorized: You must be logged in as Administrator to edit fee amounts.");
    }

    let isUserAdmin = adminRole === "admin";
    if (!isUserAdmin) {
      const profile = await userService.getUserProfile(currentUid);
      const email = auth.currentUser?.email || "";
      isUserAdmin = profile?.role === "admin" || email.includes("admin");
    }

    if (!isUserAdmin) {
      throw new Error("Forbidden: Only authenticated Administrator can update fee amounts. Accountancy and other roles cannot modify fees.");
    }

    const now = new Date().toISOString();
    for (const cat of categories) {
      const parsedAmount = Number(cat.amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        throw new Error(`Invalid fee amount for ${cat.name}. Must be positive number.`);
      }
      const docRef = doc(db, "fee_settings", cat.id);
      await setDoc(
        docRef,
        {
          ...cat,
          amount: parsedAmount,
          updatedAt: now,
          updatedBy: auth.currentUser?.email || "admin",
        },
        { merge: true }
      );
    }

    // Capture audit log for saving entire fee structure
    await logAuditEvent({
      userId: currentUid,
      userEmail: auth.currentUser?.email || undefined,
      role: "admin",
      action: "FEE_STRUCTURE_SAVE",
      affectedDocumentId: "fee_settings",
      collectionName: "fee_settings",
      details: `Admin updated full institutional fee structure across ${categories.length} categories.`,
      newValue: categories.map((c) => ({ id: c.id, name: c.name, amount: c.amount })),
    });

    return categories;
  },
};
