import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { departmentService } from "./departmentService";
import { feesService } from "./feesService";
import { logAuditEvent } from "./auditService";

export interface AdminExpense {
  id: string;
  expenseId?: string;
  title: string;
  category: "Staff Salary" | "Electricity Bill" | "Other Expenses" | string;
  amount: number;
  date?: string;
  month?: string;
  year?: number;
  payment_method?: string;
  paid_to: string;
  description?: string;
  reference_no?: string;
  payment_status?: "Paid" | "Pending" | "Approved" | "Cancelled" | string;
  createdBy?: string;
  processedBy?: string;
  timestamp?: string;
  staff_id?: string;
  staff_name?: string;
  designation?: string;
  department?: string;
  basic_salary?: number;
  allowances?: number;
  deductions?: number;
  salary_month?: string;
  payment_date?: string;
  billing_month?: string;
  eb_consumer_number?: string;
  previous_reading?: number;
  current_reading?: number;
  due_date?: string;
  meter_location?: string;
  receipt_url?: string | null;
  receipt_name?: string | null;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  payment_method?: string;
  paid_to: string;
  description?: string;
  department: string;
  createdAt?: string;
}

export const expenseService = {
  // Admin Central Expenses: adminExpenses/{expenseId}
  async getAdminExpenses(filters?: { category?: string; status?: string; month?: string }): Promise<AdminExpense[]> {
    const path = "adminExpenses";
    try {
      const snap = await getDocs(collection(db, "adminExpenses"));
      let list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        amount: Number(d.data().amount || 0),
      })) as AdminExpense[];

      if (filters?.category) {
        list = list.filter((e) => e.category === filters.category);
      }
      if (filters?.status) {
        list = list.filter((e) => e.payment_status === filters.status);
      }
      if (filters?.month) {
        list = list.filter(
          (e) => (e.date && e.date.startsWith(filters.month!)) || e.salary_month === filters.month || e.billing_month === filters.month
        );
      }

      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getAdminExpenseById(id: string): Promise<AdminExpense | null> {
    const path = `adminExpenses/${id}`;
    try {
      const snap = await getDoc(doc(db, "adminExpenses", id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as any) };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async createAdminExpense(data: Omit<AdminExpense, "id"> & { id?: string }): Promise<string> {
    const id = data.id || `EXP-${Date.now().toString().slice(-6)}`;
    const path = `adminExpenses/${id}`;
    try {
      const now = new Date().toISOString();
      const dateVal = data.date || now.slice(0, 10);
      const monthVal = data.month || data.salary_month || data.billing_month || dateVal.slice(0, 7);
      const yearVal = data.year || parseInt(monthVal.slice(0, 4), 10) || new Date().getFullYear();

      const payload: AdminExpense = {
        ...data,
        id,
        expenseId: id,
        date: dateVal,
        month: monthVal,
        year: yearVal,
        amount: Number(data.amount || 0),
        payment_status: data.payment_status || "Paid",
        createdBy: data.createdBy || "admin",
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, "adminExpenses", id), payload);

      // Audit Log for Expense Creation
      await logAuditEvent({
        userId: auth.currentUser?.uid || "admin",
        userEmail: auth.currentUser?.email || undefined,
        role: "admin",
        action: "EXPENSE_CREATE",
        affectedDocumentId: id,
        collectionName: "adminExpenses",
        details: `Logged expense '${payload.title}' in category '${payload.category}' for ₹${payload.amount}`,
        newValue: { title: payload.title, category: payload.category, amount: payload.amount, date: payload.date },
      });

      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getMonthlyExpenseTotals(): Promise<Array<{ month: string; monthName: string; total: number; count: number }>> {
    const expenses = await this.getAdminExpenses();
    const map: Record<string, { total: number; count: number }> = {};

    for (const e of expenses) {
      const m = e.month || (e.date ? e.date.slice(0, 7) : null);
      if (!m) continue;
      if (!map[m]) map[m] = { total: 0, count: 0 };
      map[m].total += Number(e.amount || 0);
      map[m].count += 1;
    }

    const sortedMonths = Object.keys(map).sort();
    return sortedMonths.map((month) => {
      const [y, mon] = month.split("-");
      const d = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
      const monthName = d.toLocaleString("default", { month: "long", year: "numeric" });
      return {
        month,
        monthName,
        total: Math.round(map[month].total),
        count: map[month].count,
      };
    });
  },

  async updateAdminExpense(id: string, updates: Partial<AdminExpense>): Promise<void> {
    const path = `adminExpenses/${id}`;
    try {
      await updateDoc(doc(db, "adminExpenses", id), {
        ...updates,
        amount: updates.amount !== undefined ? Number(updates.amount) : undefined,
        updatedAt: new Date().toISOString(),
      });

      // Audit Log for Expense Update
      await logAuditEvent({
        userId: auth.currentUser?.uid || "admin",
        userEmail: auth.currentUser?.email || undefined,
        role: "admin",
        action: "EXPENSE_UPDATE",
        affectedDocumentId: id,
        collectionName: "adminExpenses",
        details: `Updated expense document ${id}`,
        newValue: updates,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteAdminExpense(id: string): Promise<void> {
    const path = `adminExpenses/${id}`;
    try {
      await deleteDoc(doc(db, "adminExpenses", id));

      // Audit Log for Expense Deletion
      await logAuditEvent({
        userId: auth.currentUser?.uid || "admin",
        userEmail: auth.currentUser?.email || undefined,
        role: "admin",
        action: "EXPENSE_DELETE",
        affectedDocumentId: id,
        collectionName: "adminExpenses",
        details: `Deleted expense record ${id}`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Helper methods for Staff Salary and Electricity Bill within adminExpenses
  async createSalary(data: {
    staff_name: string;
    staff_id: string;
    designation: string;
    department: string;
    basic_salary: number;
    allowances?: number;
    deductions?: number;
    salary_month: string;
    payment_date: string;
    payment_status?: string;
    payment_method?: string;
    reference_no?: string;
    remarks?: string;
  }): Promise<string> {
    // 1. Prevent duplicate salary payments for the same staff member and month
    const existing = await this.getAdminExpenses({ category: "Staff Salary" });
    const isDuplicate = existing.some(
      (e) =>
        e.staff_id === data.staff_id &&
        (e.salary_month === data.salary_month || e.month === data.salary_month) &&
        e.payment_status !== "Cancelled"
    );
    if (isDuplicate) {
      throw new Error(
        `Duplicate payment prevented: Salary for staff member '${data.staff_name}' (${data.staff_id}) has already been processed for month '${data.salary_month}'.`
      );
    }

    const totalAmount =
      Number(data.basic_salary || 0) + Number(data.allowances || 0) - Number(data.deductions || 0);
    const now = new Date().toISOString();
    const yearVal = parseInt(data.salary_month.slice(0, 4), 10) || new Date().getFullYear();
    const currentUser = auth.currentUser;
    const processedBy = currentUser?.email || currentUser?.uid || "system";

    return this.createAdminExpense({
      title: `Salary: ${data.staff_name} (${data.salary_month})`,
      category: "Staff Salary",
      amount: totalAmount,
      date: data.payment_date,
      payment_date: data.payment_date,
      paid_to: data.staff_name,
      payment_method: data.payment_method || "Bank Transfer",
      reference_no: data.reference_no,
      payment_status: (data.payment_status as any) || "Paid",
      staff_id: data.staff_id,
      staff_name: data.staff_name,
      designation: data.designation,
      department: data.department,
      basic_salary: data.basic_salary,
      allowances: data.allowances,
      deductions: data.deductions,
      salary_month: data.salary_month,
      month: data.salary_month,
      year: yearVal,
      processedBy,
      timestamp: now,
      remarks: data.remarks,
    });
  },

  async createElectricityBill(data: {
    billing_month: string;
    eb_consumer_number: string;
    previous_reading: number;
    current_reading: number;
    bill_amount: number;
    due_date: string;
    paid_date?: string;
    payment_status?: string;
    meter_location?: string;
    remarks?: string;
  }): Promise<string> {
    return this.createAdminExpense({
      title: `EB Bill - Consumer #${data.eb_consumer_number} (${data.billing_month})`,
      category: "Electricity Bill",
      amount: Number(data.bill_amount || 0),
      date: data.paid_date || data.due_date,
      paid_to: "State Electricity Distribution Board",
      payment_status: (data.payment_status as any) || "Pending",
      billing_month: data.billing_month,
      eb_consumer_number: data.eb_consumer_number,
      previous_reading: data.previous_reading,
      current_reading: data.current_reading,
      due_date: data.due_date,
      meter_location: data.meter_location,
      remarks: data.remarks,
    });
  },

  // Department Expenses: departments/{departmentId}/expenses/{expenseId}
  async getDepartmentExpenses(departmentId: string): Promise<DepartmentExpense[]> {
    const path = `departments/${departmentId}/expenses`;
    try {
      const snap = await getDocs(collection(db, "departments", departmentId, "expenses"));
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        department: departmentId,
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createDepartmentExpense(
    departmentId: string,
    data: Omit<DepartmentExpense, "id" | "department"> & { id?: string }
  ): Promise<string> {
    const id = data.id || `DEXP-${Date.now().toString().slice(-6)}`;
    const path = `departments/${departmentId}/expenses/${id}`;
    try {
      const payload: DepartmentExpense = {
        ...data,
        id,
        department: departmentId,
        amount: Number(data.amount || 0),
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "departments", departmentId, "expenses", id), payload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Summaries and Financial Overview
  async getExpenseSummary() {
    const expenses = await this.getAdminExpenses();
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const salaryTotal = expenses
      .filter((e) => e.category === "Staff Salary")
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const ebTotal = expenses
      .filter((e) => e.category === "Electricity Bill")
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const otherTotal = expenses
      .filter((e) => e.category === "Other Expenses")
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    return {
      totalExpenses,
      salaryTotal,
      ebTotal,
      otherTotal,
      count: expenses.length,
      byCategory: {
        "Staff Salary": salaryTotal,
        "Electricity Bill": ebTotal,
        "Other Expenses": otherTotal,
      },
    };
  },

  async getFinancialOverview() {
    const feeSummary = await feesService.getSummary();
    const expenseSummary = await this.getExpenseSummary();

    const totalRevenue = feeSummary.totalCollected;
    const totalExpenses = expenseSummary.totalExpenses;
    const netBalance = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netBalance,
      feeCollectionRate: feeSummary.collectionEfficiency,
      totalBilled: feeSummary.totalBilled,
      totalPending: feeSummary.totalPending,
      salaryTotal: expenseSummary.salaryTotal,
      ebTotal: expenseSummary.ebTotal,
      otherTotal: expenseSummary.otherTotal,
    };
  },
};
