import { feesService } from "./firebase/feesService";
import { attendanceService } from "./firebase/attendanceService";
import { examService } from "./firebase/examService";
import { studentService } from "./firebase/studentService";
import { requestService, StudentRequest } from "./firebase/requestService";
import { expenseService } from "./firebase/expenseService";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  actions?: Array<{ label: string; target: string }>;
  fromFallback?: boolean;
}

export interface ChatbotContext {
  feeSummary?: {
    totalBilled?: number;
    paidAmount?: number;
    pendingAmount?: number;
    dueDate?: string;
    paymentStatus?: string;
    invoices?: Array<{
      id: string;
      feeType: string;
      amount: number;
      paidAmount: number;
      balance: number;
      paymentStatus: string;
      dueDate: string;
    }>;
  };
  attendanceSummary?: {
    attendancePercentage: number;
    totalClasses: number;
    attendedClasses: number;
    absentClasses: number;
    shortage: boolean;
  };
  examFeeSummary?: {
    pendingExamFees: number;
    exams: Array<{
      id: string;
      exam_name: string;
      fee_amount: number;
      status: string;
      due_date: string;
    }>;
  };
  feeExtensionStatus?: {
    status?: string;
    requestedExtensionDate?: string;
    approvedExtensionDate?: string;
    reason?: string;
    adminRemarks?: string;
    createdAt?: string;
  } | null;
  accountantOverview?: {
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    collectionEfficiency: number;
    pendingExtensionRequestsCount: number;
  };
  adminOverview?: {
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    pendingRequestsCount: number;
  };
}

export const chatbotService = {
  async fetchLiveUserContext(user: any, role: string): Promise<ChatbotContext> {
    const context: ChatbotContext = {};
    const dept = (user?.department || "aids").toLowerCase().trim();
    const uid = user?.id || user?.uid || "";
    const regNo = user?.rollNo || user?.registerNumber || "";
    const name = user?.name || "";

    try {
      if (role === "student" || role === "parent") {
        // 1. Fetch fees
        const deptFees = await feesService.getFeesByDepartment(dept).catch(() => []);
        let userInvoices = deptFees.filter(
          (f) =>
            (uid && f.studentId === uid) ||
            (name && f.studentName?.toLowerCase() === name.toLowerCase())
        );

        const totalBilled = userInvoices.reduce((acc, f) => acc + (f.amount || 0), 0);
        const totalPaid = userInvoices.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
        const totalPending = userInvoices
          .filter((f) => f.paymentStatus !== "Paid")
          .reduce((acc, f) => acc + (f.balance || (f.amount - (f.paidAmount || 0)) || 0), 0);
        const firstPending = userInvoices.find((f) => f.paymentStatus !== "Paid") || userInvoices[0];

        context.feeSummary = {
          totalBilled: totalBilled || 0,
          paidAmount: totalPaid || 0,
          pendingAmount: totalPending || 0,
          dueDate: firstPending?.dueDate || "",
          paymentStatus: totalBilled === 0 ? "No Invoices" : (totalPending === 0 ? "Paid" : "Pending"),
          invoices: userInvoices.map((inv) => ({
            id: inv.id,
            feeType: inv.feeType || "Fee",
            amount: inv.amount || 0,
            paidAmount: inv.paidAmount || 0,
            balance: inv.balance || 0,
            paymentStatus: inv.paymentStatus || "Pending",
            dueDate: inv.dueDate || "",
          })),
        };

        // 2. Fetch Attendance
        const attRecords = await attendanceService
          .getAttendanceByDepartment(dept, { studentId: uid })
          .catch(() => []);
        const totalClasses = attRecords.length;
        const attendedClasses = attRecords.filter((r) => r.status === "Present").length;
        const absentClasses = totalClasses - attendedClasses;
        const rate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

        context.attendanceSummary = {
          attendancePercentage: rate,
          totalClasses,
          attendedClasses,
          absentClasses,
          shortage: totalClasses > 0 && rate < 75,
        };

        // 3. Fetch Exams
        const deptExams = await examService.getExamsByDepartment(dept).catch(() => []);
        const pendingExams = deptExams
          .filter((e) => e.status !== "Paid")
          .reduce((acc, e) => acc + (e.fee_amount || 0), 0);

        context.examFeeSummary = {
          pendingExamFees: pendingExams,
          exams: deptExams.map((e) => ({
            id: e.id,
            exam_name: e.exam_name,
            fee_amount: e.fee_amount,
            status: e.status,
            due_date: e.due_date,
          })),
        };

        // 4. Fetch Fee Extension Request Status
        const latestExt = await requestService.getFeeExtensionStatus(uid, regNo);
        if (latestExt) {
          context.feeExtensionStatus = {
            status: latestExt.status,
            requestedExtensionDate: latestExt.requestedExtensionDate,
            approvedExtensionDate: latestExt.approvedExtensionDate,
            reason: latestExt.reason,
            adminRemarks: latestExt.adminRemarks,
            createdAt: latestExt.createdAt,
          };
        } else {
          context.feeExtensionStatus = null;
        }
      } else if (role === "accountant") {
        const [summary, allReqs] = await Promise.all([
          feesService.getSummary().catch(() => null),
          requestService.getAllRequests().catch(() => []),
        ]);

        const pendingExts = allReqs.filter(
          (r) => r.category === "fee_extension" && r.status === "Pending"
        ).length;

        context.accountantOverview = {
          totalBilled: summary?.totalBilled || 0,
          totalCollected: summary?.totalCollected || 0,
          totalPending: summary?.totalPending || 0,
          collectionEfficiency: summary?.collectionEfficiency || 0,
          pendingExtensionRequestsCount: pendingExts,
        };
      } else if (role === "admin") {
        const [summary, allReqs] = await Promise.all([
          feesService.getSummary().catch(() => null),
          requestService.getAllRequests().catch(() => []),
        ]);

        context.adminOverview = {
          totalBilled: summary?.totalBilled || 0,
          totalCollected: summary?.totalCollected || 0,
          totalPending: summary?.totalPending || 0,
          pendingRequestsCount: allReqs.filter((r) => r.status === "Pending").length,
        };
      }
    } catch (err) {
      console.warn("[ChatbotService] Error fetching user context:", err);
    }

    return context;
  },

  async sendMessage(params: {
    message: string;
    role: string;
    user: any;
    context: ChatbotContext;
    history: Array<{ role: "user" | "model"; text: string }>;
  }): Promise<{ reply: string; actions: Array<{ label: string; target: string }>; fromFallback?: boolean }> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: params.message,
          role: params.role,
          user: {
            id: params.user?.id || params.user?.uid,
            name: params.user?.name,
            email: params.user?.email,
            department: params.user?.department,
            rollNo: params.user?.rollNo || params.user?.registerNumber,
            registerNumber: params.user?.registerNumber || params.user?.rollNo,
          },
          context: params.context,
          history: params.history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`[ChatbotService] /api/chat returned status ${response.status}:`, errorData);
        const fallback = generateClientContextFallback(params);
        return {
          reply: fallback.reply,
          actions: fallback.actions,
          fromFallback: true,
        };
      }

      const data = await response.json();
      return {
        reply: data.reply || "I'm having trouble processing that right now.",
        actions: data.actions || [],
        fromFallback: data.fromFallback,
      };
    } catch (err: any) {
      console.warn("[ChatbotService] Network fetch notice, using live context fallback:", err?.message || err);
      const fallback = generateClientContextFallback(params);
      return {
        reply: fallback.reply,
        actions: fallback.actions,
        fromFallback: true,
      };
    }
  },
};

function generateClientContextFallback(params: {
  message: string;
  role: string;
  user: any;
  context: ChatbotContext;
}): { reply: string; actions: Array<{ label: string; target: string }> } {
  const q = String(params.message || "").toLowerCase().trim();
  const name = params.user?.name || "Student";
  const fs = params.context?.feeSummary;

  if (/fee|balance|pending|evlo|due date|last date|pay|katta|panam|installment/i.test(q)) {
    const pending = fs?.pendingAmount ?? 0;
    const dueDate = fs?.dueDate ? `\n• Due Date: ${fs.dueDate}` : "";
    if (pending > 0) {
      return {
        reply: `Hello ${name}! Your current pending fee balance is ₹${Number(pending).toLocaleString("en-IN")}.${dueDate}\n• Status: Pending\n\nYou can view invoices or request a fee extension using the actions below.`,
        actions: [
          { label: "Open Fees Portal", target: "nav:fees" },
          { label: "Request Fee Extension", target: "form:fee_extension" },
        ],
      };
    } else {
      return {
        reply: `Great news ${name}! All your registered college fees are completely cleared (₹0 balance).`,
        actions: [{ label: "Open Fees Portal", target: "nav:fees" }],
      };
    }
  }

  if (/extend|extension|time extend|due date/i.test(q)) {
    return {
      reply: `To apply for extra time to pay your fees, please fill out the official Fee Extension Request Form. It will be sent directly to Admin & Accounts for review.`,
      actions: [
        { label: "Open Fee Extension Form", target: "form:fee_extension" },
        { label: "Check Request Status", target: "form:view_requests" },
      ],
    };
  }

  if (/attendance|shortage|percentage/i.test(q)) {
    const att = params.context?.attendanceSummary;
    const rate = att?.attendancePercentage ?? 0;
    const total = att?.totalClasses ?? 0;
    return {
      reply: total === 0
        ? `No attendance records have been registered for your account yet.`
        : `Your current attendance rate is ${rate}% (${att?.attendedClasses || 0}/${total} classes).\n${
            rate < 75
              ? "⚠️ You are below the 75% university eligibility requirement. Please submit an attendance correction or on-duty request."
              : "✅ Your attendance is above the required 75% threshold."
          }`,
      actions: [
        { label: "Open Attendance", target: "nav:attendance" },
        { label: "Attendance Correction", target: "form:attendance_correction" },
      ],
    };
  }

  if (/leave|od|on duty|permission/i.test(q)) {
    return {
      reply: "You can submit an official student leave or OD request directly through the Leave Request Form.",
      actions: [{ label: "Apply Leave", target: "form:leave" }],
    };
  }

  if (/exam/i.test(q)) {
    const ef = params.context?.examFeeSummary;
    return {
      reply: `Semester Examination Details:\n• Pending Exam Fees: ₹${(ef?.pendingExamFees || 0).toLocaleString("en-IN")}\n• You can check the semester schedule and payment status in Exam Fees.`,
      actions: [{ label: "Open Exam Fees", target: "nav:exam-fees" }],
    };
  }

  return {
    reply: `Hello ${name}! 👋 I am your College AI Assistant. I can help answer your questions about fees, attendance, exam registrations, fee extensions, and leave applications.`,
    actions: [
      { label: "Check Fee Balance", target: "nav:fees" },
      { label: "Request Fee Extension", target: "form:fee_extension" },
      { label: "Apply Leave", target: "form:leave" },
      { label: "Check Attendance", target: "nav:attendance" },
    ],
  };
}
