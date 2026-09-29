export type UserRole = "admin" | "hod" | "accountant" | "faculty" | "staff" | "student" | "parent";

export interface UserProfile {
  id?: string | number;
  uid?: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  rollNo?: string;
  wardName?: string;
  phone?: string;
  designation?: string;
  avatar_url?: string | null;
  createdAt?: string | number | any;
  updatedAt?: string | number | any;
}

export interface AuthUser {
  id: string | number;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  department?: string;
  rollNo?: string;
  wardName?: string;
  phone?: string;
  designation?: string;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  defaultTab: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    role: "admin",
    label: "Super Admin / Principal",
    description: "Complete institutional governance, finance, and system controls",
    defaultTab: "dashboard",
  },
  hod: {
    role: "hod",
    label: "HOD (Head of Dept)",
    description: "Departmental academic structure, classes, faculty, and student tracking",
    defaultTab: "dashboard",
  },
  accountant: {
    role: "accountant",
    label: "Accountant / Bursar",
    description: "Tuition billing, payment reconciliations, invoicing, and fee audits",
    defaultTab: "dashboard",
  },
  faculty: {
    role: "faculty",
    label: "Faculty / Professor",
    description: "Attendance logging, student academic records, timetable, and subjects",
    defaultTab: "academic-info",
  },
  staff: {
    role: "staff",
    label: "Staff / Faculty",
    description: "Attendance logging, student academic records, timetable, and department operations",
    defaultTab: "academic-info",
  },
  student: {
    role: "student",
    label: "Student",
    description: "Course schedules, tuition payments, receipts, and examination grades",
    defaultTab: "dashboard",
  },
  parent: {
    role: "parent",
    label: "Parent / Guardian",
    description: "Ward academic progress, fee clearance, receipts, and attendance monitor",
    defaultTab: "dashboard",
  },
};

export const EXPENSE_CATEGORIES = [
  "Staff Salary",
  "Electricity Bill",
  "Water Bill",
  "Internet / Wi-Fi Bill",
  "Maintenance & Repairs",
  "Computer / Hardware Expenses",
  "Stationery Expenses",
  "Transport Expenses",
  "Cleaning Expenses",
  "Software / Subscription Expenses",
  "Event & Function Expenses",
  "Examination Expenses",
  "Other Expenses",
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface ExpenseItem {
  id: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  payment_method: string;
  paid_to: string;
  description?: string;
  receipt_url?: string | null;
  receipt_name?: string | null;
  payment_status: "Paid" | "Pending" | "Cancelled" | string;
  reference_no?: string;
  source_type?: "manual" | "salary" | "electricity";
  source_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffSalaryItem {
  id: string;
  staff_name: string;
  staff_id: string;
  designation: string;
  department: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  salary_month: string;
  month?: string;
  year?: number;
  payment_date: string;
  payment_status: "Paid" | "Pending" | string;
  payment_method: string;
  reference_no?: string;
  remarks?: string;
  expense_id?: string;
  processedBy?: string;
  timestamp?: string;
  created_at?: string;
}

export interface ElectricityBillItem {
  id: string;
  billing_month: string;
  eb_consumer_number: string;
  previous_reading: number;
  current_reading: number;
  units_consumed: number;
  bill_amount: number;
  due_date: string;
  paid_date?: string | null;
  payment_status: "Paid" | "Pending" | string;
  bill_receipt_url?: string | null;
  bill_receipt_name?: string | null;
  meter_location?: string;
  remarks?: string;
  expense_id?: string;
  created_at?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  thisMonthExpenses: number;
  staffSalaryTotal: number;
  electricityTotal: number;
  pendingExpenses: number;
  otherExpenses: number;
  categoryTotals: Record<string, number>;
  totalCount: number;
}

export interface ExamFeeItem {
  id: string;
  student_id: string;
  student_name: string;
  roll: string;
  department: string;
  year: string;
  semester: string;
  exam_name: string;
  amount: number;
  due_date: string;
  status: "Paid" | "Pending" | "Overdue";
  payment_date?: string | null;
  payment_method?: string | null;
  reference_no?: string | null;
  remarks?: string;
  receipt_id?: string | null;
  created_at?: string;
}

export interface ExamFeeSummary {
  totalExamFees: number;
  collectedExamFees: number;
  pendingExamFees: number;
  overdueExamFees: number;
  countPaid: number;
  countPending: number;
  totalCount: number;
}

export interface AttendanceRecord {
  id: string | number;
  date: string;
  department: string;
  year: string;
  section: string;
  student_id: string;
  student_name: string;
  roll: string;
  status: "Present" | "Absent" | "Late";
  remarks?: string;
  time_in?: string;
}

export interface AttendanceSummary {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
  presentCount: number;
  absentCount: number;
  totalStudents: number;
}

export interface FinancialOverviewData {
  totalFeesCollected: number;
  pendingFees: number;
  examFeesCollected: number;
  pendingExamFees: number;
  totalExpenses: number;
  thisMonthExpenses: number;
  staffSalaryTotal: number;
  electricityTotal: number;
  remainingBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  monthlyTrends: Array<{
    month: string;
    year: number;
    income: number;
    expenses: number;
    balance: number;
  }>;
}

export interface MonthlyExpenseReportData {
  month: string;
  totalStaffSalary: number;
  totalElectricityBill: number;
  totalWaterBill: number;
  totalMaintenance: number;
  totalInternetExpense: number;
  totalOtherExpenses: number;
  grandTotalExpenses: number;
  categoryBreakdown: Record<string, number>;
  itemCount: number;
  expenses: ExpenseItem[];
}

