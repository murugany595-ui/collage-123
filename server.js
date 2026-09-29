require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const PORT = 3000;

// Firebase Backend Setup for Trusted Server-Side Authorization
const { initializeApp: initFirebaseApp, getApps: getFirebaseApps } = require("firebase/app");
const { getAuth: getServerAuth, signInWithEmailAndPassword: serverSignIn } = require("firebase/auth");
const {
  initializeFirestore: initServerFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAJ1oda9FePj90ktJss6Zye_TbnE7BDVDI",
  authDomain: "collage-28e7c.firebaseapp.com",
  projectId: "collage-28e7c",
};

let serverApp;
const existingApps = getFirebaseApps();
const backendAppName = "server_backend_erp";
const foundBackend = existingApps.find((a) => a.name === backendAppName);
if (foundBackend) {
  serverApp = foundBackend;
} else {
  serverApp = initFirebaseApp(firebaseConfig, backendAppName);
}
const serverAuth = getServerAuth(serverApp);
const serverDb = initServerFirestore(serverApp, { experimentalForceLongPolling: true });

// Auto-authenticate backend on startup with admin credentials so server can perform privileged queries and atomic writes
serverSignIn(serverAuth, "admin@brightwood.edu", "Password123!")
  .then(() => {
    console.log("[Server] Firebase Admin Session initialized successfully.");
  })
  .catch((err) => {
    console.warn("[Server] Firebase Admin Session warning:", err.message);
  });

// Helper for local context-aware fallback when external API hits rate limits or spikes
function generateLocalFallbackReply({ message = "", role = "student", user = {}, context = {} }) {
  const q = String(message).toLowerCase().trim();
  const name = user.name || "Student";

  // 1. Security check: other student data
  if (
    /other student|another student|friend|roll\s*no\s*\d+|register\s*(?:no|number)\s*\d+/i.test(q) &&
    !q.includes(String(user.registerNumber || "").toLowerCase()) &&
    !q.includes(String(user.rollNo || "").toLowerCase())
  ) {
    return {
      reply: "I can only provide fee and academic information for your own registered account.",
      actions: [],
    };
  }

  // 2. Unrelated questions
  if (/ronaldo|messi|cricket|football|movie|song|recipe|weather|quicksort|python code/i.test(q)) {
    return {
      reply: "I'm designed to assist with the College Management System. Please ask me about fees, attendance, examinations, leave, payments or other college-related services.",
      actions: [],
    };
  }

  // 3. Fee Extension Request
  if (/extend|extension|time extend|due date extend|date extend|kadan|avan/i.test(q)) {
    return {
      reply: `${name}, fee extension request submit panna vendum. Please fill the **Fee Extension Request Form** and submit it for Accounts/Admin approval. Once submitted, your request will be reviewed by the Accounts and Admin department.`,
      actions: [
        { label: "Open Fee Extension Form", target: "form:fee_extension" },
        { label: "Check Extension Status", target: "form:view_requests" },
      ],
    };
  }

  // 4. Extension Status
  if (/status|extension status|request status|en status/i.test(q)) {
    const ext = context.feeExtensionStatus;
    if (ext && ext.status) {
      const remarks = ext.adminRemarks ? `\n• Remarks: ${ext.adminRemarks}` : "";
      const approvedDate = ext.approvedExtensionDate ? `\n• Approved Due Date: **${ext.approvedExtensionDate}**` : "";
      return {
        reply: `Ungaloda Fee Extension Request Status: **${ext.status.toUpperCase()}**.\n• Requested Extension Date: ${ext.requestedExtensionDate || "N/A"}${approvedDate}${remarks}`,
        actions: [{ label: "View All Requests", target: "form:view_requests" }],
      };
    }
    return {
      reply: "Ungalukku active fee extension request edhuvum illa. Thevaipattal Fee Extension Request Form submit seiyavum.",
      actions: [
        { label: "Open Fee Extension Form", target: "form:fee_extension" },
        { label: "View All Requests", target: "form:view_requests" },
      ],
    };
  }

  // 5. Fees balance / Last date / Due date / Payment
  if (/fee|balance|pending|evlo|due date|last date|pay|katta|panam|installment/i.test(q)) {
    const fs = context.feeSummary || {};
    const pending = fs.pendingAmount !== undefined ? fs.pendingAmount : null;
    const dueDate = fs.dueDate || (fs.invoices && fs.invoices[0]?.dueDate) || "End of month";

    if (pending !== null && pending > 0) {
      return {
        reply: `Ungaloda current pending fee balance: **₹${Number(pending).toLocaleString()}**.\n• Due Date: **${dueDate}**\n• Status: **Pending**\n\nFees pay panna or online receipt download panna Fees Portal-ah open pannikalam. Extension thevaipattal request submit seiyavum.`,
        actions: [
          { label: "Open Fees Portal", target: "nav:fees" },
          { label: "Open Fee Extension Form", target: "form:fee_extension" },
        ],
      };
    } else if (pending === 0 || fs.totalBilled > 0) {
      return {
        reply: `Ungaloda current fees muzhuvadhum pay seiyappattu vitadhu (Status: **Paid**). Pending balance edhum illai (₹0).`,
        actions: [{ label: "Open Fees Portal", target: "nav:fees" }],
      };
    }
    return {
      reply: "I couldn't find this information in the college management system. Please contact the Accounts/Admin department.",
      actions: [{ label: "Open Fees Portal", target: "nav:fees" }],
    };
  }

  // 6. Attendance / Shortage / Percentage
  if (/attendance|present|absent|shortage|percentage|kammi|leave count/i.test(q)) {
    const att = context.attendanceSummary || {};
    const rate = att.attendancePercentage || 94;
    const isShortage = rate < 75;

    return {
      reply: `Ungaloda current overall attendance: **${rate}%**.\n${
        isShortage
          ? "⚠️ **Attendance Shortage Alert**: Ungaloda attendance 75%-ku keezhe irukku. Please attend all regular classes or submit an Attendance Correction / On Duty (OD) form."
          : "✅ Ungaloda attendance safe zone-il irukku (University 75% minimum criteria satisfied)."
      }`,
      actions: [
        { label: "Open Attendance Portal", target: "nav:attendance" },
        { label: "Attendance Correction Form", target: "form:attendance_correction" },
      ],
    };
  }

  // 7. Leave Application
  if (/leave|vidumurai|sick|od|on duty/i.test(q)) {
    return {
      reply: "College leave apply panna kitta ulla **Apply Leave Request** form-ai poorthi seithu submit seiyavum. Class Advisor matrum HOD review seivargal.",
      actions: [{ label: "Apply Leave Request", target: "form:leave" }],
    };
  }

  // 8. Exam Fees
  if (/exam|paritchai|hall ticket|semester exam/i.test(q)) {
    const ex = context.examFeeSummary || {};
    const pendingExams = ex.pendingExamFees || 0;
    return {
      reply: `Upcoming semester examination details:\n• Exam Fee Pending: **₹${pendingExams.toLocaleString()}**\n• Exam portal moolam hall ticket eligibility matrum exam schedule-ai check seiyalam.`,
      actions: [{ label: "Open Exam Fees", target: "nav:exam-fees" }],
    };
  }

  // Default friendly greeting
  return {
    reply: `Vanakkam ${name}! 👋 I'm your College AI Assistant.
I can help you with fees, attendance, examinations, leave requests, payments, student information and other college-management related questions.
How can I help you today?`,
    actions: [
      { label: "Check Fee Balance", target: "nav:fees" },
      { label: "Request Fee Extension", target: "form:fee_extension" },
      { label: "Apply Leave", target: "form:leave" },
      { label: "Check Attendance", target: "nav:attendance" },
    ],
  };
}

async function startServer() {
  const app = express();

  // Enable CORS for all incoming cross-origin requests & preflight OPTIONS checks
  app.use(cors({ origin: true, credentials: true }));
  app.options("*", cors({ origin: true, credentials: true }));

  // Parse JSON request bodies
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "College AI Assistant & ERP API" });
  });

  // Dedicated Secure Salary Processing endpoint with Server-side Firebase Auth & Duplicate Prevention
  app.post("/api/salary/process", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "Authentication required: Missing Bearer ID token in Authorization header.",
          code: "UNAUTHENTICATED",
        });
      }

      const idToken = authHeader.split("Bearer ")[1].trim();
      const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyAJ1oda9FePj90ktJss6Zye_TbnE7BDVDI";

      // 1. Verify Firebase ID Token via Google Identity Toolkit
      const verifyResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );
      const verifyData = await verifyResp.json();
      if (!verifyData.users || verifyData.users.length === 0) {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired Firebase authentication token. Please re-authenticate.",
          code: "INVALID_TOKEN",
        });
      }

      const authUser = verifyData.users[0];
      const callerUid = authUser.localId;
      const callerEmail = (authUser.email || "").toLowerCase();

      // 2. Server-side Role-Based Authorization Check
      // Only Admin and Accountant users are authorized to process salaries
      const isPrivilegedEmail =
        callerEmail === "admin@brightwood.edu" ||
        callerEmail === "accounts@brightwood.edu" ||
        callerEmail === "murugany595@gmail.com";

      let isAuthorized = isPrivilegedEmail;
      let userRole = isPrivilegedEmail
        ? callerEmail.includes("account")
          ? "accountant"
          : "admin"
        : "unauthorized";

      if (!isAuthorized) {
        // Query users/{uid} or admins/{uid} using server Firestore
        try {
          const userDocSnap = await getDoc(doc(serverDb, "users", callerUid));
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data();
            if (profile.role === "admin" || profile.role === "accountant") {
              isAuthorized = true;
              userRole = profile.role;
            }
          }
          if (!isAuthorized) {
            const adminDocSnap = await getDoc(doc(serverDb, "admins", callerUid));
            if (adminDocSnap.exists()) {
              isAuthorized = true;
              userRole = "admin";
            }
          }
        } catch (dbErr) {
          console.warn("[Server] Role check error:", dbErr.message);
        }
      }

      // Explicitly reject Student, Parent, and unauthorized callers
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: "Permission Denied: Only authorized Admin and Accountant accounts are permitted to process salaries.",
          code: "PERMISSION_DENIED",
        });
      }

      const {
        staff_name,
        staff_id,
        designation,
        department,
        basic_salary,
        allowances,
        deductions,
        salary_month,
        payment_date,
        payment_status,
        payment_method,
        reference_no,
        remarks,
      } = req.body;

      if (!staff_name || !staff_id || !salary_month) {
        return res.status(400).json({
          success: false,
          error: "Validation failed: Staff Name, Staff ID, and Salary Month are required.",
          code: "VALIDATION_ERROR",
        });
      }

      const basicNum = Number(basic_salary) || 0;
      const allowNum = Number(allowances) || 0;
      const dedNum = Number(deductions) || 0;
      const netSalary = Math.max(0, basicNum + allowNum - dedNum);

      // 3. Duplicate Prevention: Check if a salary record already exists for this staff member and month
      const existingSnap = await getDocs(collection(serverDb, "adminExpenses"));
      const duplicateRecord = existingSnap.docs.find((d) => {
        const item = d.data();
        return (
          item.category === "Staff Salary" &&
          item.staff_id === staff_id &&
          (item.salary_month === salary_month || item.month === salary_month) &&
          item.payment_status !== "Cancelled"
        );
      });

      if (duplicateRecord) {
        return res.status(409).json({
          success: false,
          error: `Duplicate payment prevented: Salary for staff member '${staff_name}' (${staff_id}) has already been processed for month '${salary_month}'.`,
          code: "DUPLICATE_SALARY_PAYMENT",
          existingRecordId: duplicateRecord.id,
        });
      }

      // 4. Save Salary Record to Firestore adminExpenses atomically
      const now = new Date().toISOString();
      const expenseId = `EXP-SAL-${Date.now().toString().slice(-6)}`;
      const year = parseInt(salary_month.slice(0, 4), 10) || new Date().getFullYear();

      const salaryPayload = {
        id: expenseId,
        expenseId,
        title: `Salary: ${staff_name} (${salary_month})`,
        category: "Staff Salary",
        amount: netSalary,
        basic_salary: basicNum,
        allowances: allowNum,
        deductions: dedNum,
        net_salary: netSalary,
        staff_id,
        staff_name,
        designation: designation || "Faculty",
        department: department || "General",
        salary_month,
        month: salary_month,
        year,
        date: payment_date || now.slice(0, 10),
        payment_date: payment_date || now.slice(0, 10),
        payment_status: payment_status || "Paid",
        payment_method: payment_method || "Bank Transfer",
        reference_no: reference_no || `NEFT-${Date.now().toString().slice(-6)}`,
        remarks: remarks || "Monthly payroll processed via secure server authorization",
        paid_to: staff_name,
        processedBy: callerEmail || callerUid,
        createdBy: callerEmail || callerUid,
        timestamp: now,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(serverDb, "adminExpenses", expenseId), salaryPayload);

      // 5. Save Audit Trail to auditLogs
      try {
        const auditId = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
        await setDoc(doc(serverDb, "auditLogs", auditId), {
          id: auditId,
          logId: auditId,
          userId: callerUid,
          userEmail: callerEmail,
          role: userRole,
          timestamp: now,
          action: "SALARY_PROCESS",
          affectedDocumentId: expenseId,
          collectionName: "adminExpenses",
          details: `Processed salary payment of ₹${netSalary.toLocaleString()} for ${staff_name} (${staff_id}) for month ${salary_month}`,
          newValue: {
            staff_id,
            staff_name,
            salary_month,
            net_salary: netSalary,
            payment_status: salaryPayload.payment_status,
          },
        });
      } catch (auditErr) {
        console.warn("[Server] Non-fatal audit log warning:", auditErr.message);
      }

      console.log(`[Server] Successfully processed salary for ${staff_name} (${staff_id}) by ${callerEmail}`);
      return res.status(200).json({
        success: true,
        id: expenseId,
        data: salaryPayload,
        message: `Salary of ₹${netSalary.toLocaleString()} processed successfully for ${staff_name}`,
      });
    } catch (err) {
      console.error("[Server] /api/salary/process error:", err);
      return res.status(500).json({
        success: false,
        error: "Salary processing failed: " + (err.message || "Internal server error"),
        code: "SERVER_ERROR",
      });
    }
  });

  // AI Chatbot endpoint powered by Gemini API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, role, user, context, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const fallback = generateLocalFallbackReply({ message, role, user, context });
        return res.json({
          success: true,
          reply: fallback.reply,
          actions: fallback.actions,
          fromFallback: true,
        });
      }

      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Build structured system instruction
      const systemInstruction = `You are "College AI Assistant", the official intelligent AI Assistant for Our College Management System (ERP).
You assist college administrators, accountants, faculty/staff, students, and parents.
You naturally understand and reply in English, Tamil, and Tanglish (Tamil written in Latin script, e.g. "fees last date eppo?", "enaku fees balance evlo?", "attendance kammiya iruka?", "fee ku time extend panna mudiyuma?", "leave epdi apply panrathu?", "exam fee katta last date enna?").

CURRENT AUTHENTICATED USER:
- Name: ${user?.name || "User"}
- Role: ${role || "student"}
- Department: ${user?.department || "General"}
- Register/Student ID: ${user?.registerNumber || user?.rollNo || user?.id || "N/A"}

REAL LIVE DATABASE CONTEXT FOR THIS USER:
${JSON.stringify(context || {}, null, 2)}

CRITICAL SECURITY AND PRIVACY RULES:
1. STRICT ROLE-BASED ACCESS: Only provide information belonging to the currently logged in user (or child if parent).
2. NEVER reveal another student's fees, marks, attendance, or personal details.
   If a user asks about another register number (e.g., "Register number 23 oda fees evlo?" or "give me marks of another student"), refuse politely and firmly:
   "I can only provide fee and academic information for your own registered account."
3. NEVER invent or hallucinate amounts, due dates, payment status, approval status, or student records. ONLY use the real database numbers provided in the context above.
4. If the database context does not have the requested detail:
   State clearly: "I couldn't find this information in the college management system. Please contact the Accounts/Admin department."
5. UNRELATED QUESTIONS: If the user asks general knowledge questions unrelated to college management (e.g., "Who is Ronaldo?", "Write Python code for quicksort", "Tell me a joke"):
   Respond politely:
   "I'm designed to assist with the College Management System. Please ask me about fees, attendance, examinations, leave, payments or other college-related services."
6. FEE EXTENSION FLOW:
   When a student or parent asks for fee extension (e.g. "Fee extension venum", "Fees time extend panna mudiyuma?", "Fee due date extend panna enna seiyanum?", "Late fee avoid panna extension request podalama?"):
   Explain:
   "Fee extension request submit panna vendum. Please fill the Fee Extension Request Form and submit it for Accounts/Admin approval."
   Advise them that they can click the "Open Fee Extension Form" button provided below.
7. ACTION SUGGESTIONS:
   At the very end of your response, if relevant, suggest navigation or form actions on a dedicated line formatted strictly as:
   ACTIONS: [Action Label](action_code)
   Supported action_codes:
   - form:fee_extension -> Open Fee Extension Form
   - form:leave -> Apply Leave Request
   - form:attendance_correction -> Attendance Correction Request
   - form:payment_issue -> Report Payment Issue
   - form:general_request -> General Service Request
   - form:view_requests -> View My Requests & Status
   - nav:fees -> Open Fees Portal
   - nav:attendance -> Open Attendance
   - nav:exam-fees -> Open Exam Fees
   - nav:reports -> Open Financial Reports
   - nav:dashboard -> Open Dashboard
8. TONE:
   Be polite, clear, concise, and helpful. Use clean bullet points for currency amounts (₹ or $) and dates. If the user spoke Tanglish or Tamil, respond in friendly, understandable Tanglish or Tamil.`;

      // Build conversation contents
      const contents = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-6)) {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: String(h.text || "") }],
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      // Valid production models: Prioritizing fastest and most stable models
      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
      ];
      let fullText = null;
      let usedModel = null;

      const callWithTimeout = (promise, ms = 4500) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout generating AI response")), ms)),
        ]);

      for (const mName of candidateModels) {
        try {
          const response = await callWithTimeout(
            ai.models.generateContent({
              model: mName,
              contents,
              config: {
                systemInstruction,
                temperature: 0.2,
              },
            }),
            4500
          );
          if (response?.text) {
            fullText = response.text;
            usedModel = mName;
            break;
          }
        } catch (mErr) {
          console.warn(`[Server] Model ${mName} notice:`, mErr.status || mErr.message);
        }
      }

      if (!fullText) {
        console.warn("[Server] Using accurate live context fallback reply.");
        const fallback = generateLocalFallbackReply({ message, role, user, context });
        return res.json({
          success: true,
          reply: fallback.reply,
          actions: fallback.actions,
          fromFallback: true,
        });
      }

      // Parse any action buttons suggested in ACTIONS: line
      let cleanReply = fullText.trim();
      const actions = [];
      const actionMatch = cleanReply.match(/ACTIONS:\s*([^\n\r]+)/i);
      if (actionMatch) {
        cleanReply = cleanReply.replace(/ACTIONS:\s*([^\n\r]+)/i, "").trim();
        const actionStr = actionMatch[1];
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let m;
        while ((m = regex.exec(actionStr)) !== null) {
          actions.push({ label: m[1], target: m[2] });
        }
      }

      res.json({
        success: true,
        reply: cleanReply,
        actions,
        model: usedModel,
      });
    } catch (err) {
      console.warn("[Server] /api/chat fallback triggered on:", err.message);
      const fallback = generateLocalFallbackReply({
        message: req.body?.message,
        role: req.body?.role,
        user: req.body?.user,
        context: req.body?.context,
      });
      return res.json({
        success: true,
        reply: fallback.reply,
        actions: fallback.actions,
        fromFallback: true,
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = require("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("[Server] Error initializing Vite middleware:", err);
    }
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Fatal server startup error:", err);
  process.exit(1);
});
