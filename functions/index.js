const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");

// Initialize Firebase Admin SDK for backend Firestore operations
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Initialize Gemini SDK with server-side API key
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

/**
 * Fallback response generator if Gemini API experiences rate limits or spikes
 */
function generateLocalFallbackReply({ message = "", role = "student", user = {}, context = {} }) {
  const q = String(message).toLowerCase().trim();
  const name = user.name || "Student";

  // Security check: other student data
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

  // Unrelated questions
  if (/ronaldo|messi|cricket|football|movie|song|recipe|weather|quicksort|python code/i.test(q)) {
    return {
      reply: "I'm designed to assist with the College Management System. Please ask me about fees, attendance, examinations, leave, payments or other college-related services.",
      actions: [],
    };
  }

  // Fee Extension Request
  if (/extend|extension|time extend|due date extend|date extend|kadan|avan/i.test(q)) {
    return {
      reply: `${name}, fee extension request submit panna vendum. Please fill the **Fee Extension Request Form** and submit it for Accounts/Admin approval. Once submitted, your request will be reviewed by the Accounts and Admin department.`,
      actions: [
        { label: "Open Fee Extension Form", target: "form:fee_extension" },
        { label: "Check Extension Status", target: "form:view_requests" },
      ],
    };
  }

  // Extension Status
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

  // Fees balance / Last date / Due date / Payment
  if (/fee|balance|pending|evlo|due date|last date|pay|katta|panam|installment/i.test(q)) {
    const fs = context.feeSummary || {};
    const pending = fs.pendingAmount !== undefined ? fs.pendingAmount : null;
    const dueDate = fs.dueDate || (fs.invoices && fs.invoices[0]?.dueDate) || "End of month";

    if (pending !== null && pending > 0) {
      return {
        reply: `Hello ${name}, ungaloda pending fee balance: **₹${pending.toLocaleString()}**.\n• Due Date: **${dueDate}**\n• Status: ${fs.paymentStatus || "Pending"}\n\nLate fee avoid panna udaney payment seiyavum, illai endral Fee Extension Request podalaam.`,
        actions: [
          { label: "Pay Fees Online", target: "nav:fees" },
          { label: "Request Fee Extension", target: "form:fee_extension" },
        ],
      };
    }
    return {
      reply: `Congratulations ${name}! Ungalukku current semester fee balance edhuvum pending illa (All Cleared).`,
      actions: [{ label: "View Fee Receipt", target: "nav:fees" }],
    };
  }

  // Attendance
  if (/attendance|present|absent|percentage|shortage|varuga/i.test(q)) {
    const att = context.attendanceSummary || {};
    const pct = att.attendancePercentage !== undefined ? att.attendancePercentage : 85;
    const shortageNote = pct < 75 ? "\n⚠️ Warning: Attendance is below 75% minimum threshold for university exams." : "";
    return {
      reply: `${name}, ungaloda current attendance: **${pct}%** (${att.attendedClasses || 42}/${att.totalClasses || 45} classes attended).${shortageNote}`,
      actions: [
        { label: "View Attendance Details", target: "nav:attendance" },
        { label: "Apply Leave", target: "form:leave" },
      ],
    };
  }

  // Exams
  if (/exam|hall ticket|arrear|reval|sem exam|theory|practical/i.test(q)) {
    const ex = context.examFeeSummary || {};
    const pendingExams = ex.pendingExamFees || 0;
    return {
      reply: `Upcoming semester examinations registration active-ah irukku. Pending exam fees: **₹${pendingExams.toLocaleString()}**.\nHall ticket download panna all fee dues clear seiyavum.`,
      actions: [
        { label: "Exam Portal", target: "nav:exams" },
        { label: "Pay Exam Fee", target: "nav:exams" },
      ],
    };
  }

  // Default helpful response
  return {
    reply: `Hello ${name}! I'm your College AI Assistant. Enkitta fees balance, due dates, attendance status, exam registrations, matrum fee extension requests patri kettu therinjukalaam.`,
    actions: [
      { label: "Check Fee Balance", target: "nav:fees" },
      { label: "Request Fee Extension", target: "form:fee_extension" },
      { label: "Check Attendance", target: "nav:attendance" },
    ],
  };
}

/**
 * HTTPS Firebase Cloud Function for secure chat communication
 * Keeps Gemini API Key strictly server-side
 */
exports.chat = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { message, role = "student", user = {}, context = {}, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (!ai) {
      console.warn("[Cloud Function] GEMINI_API_KEY missing, using context-aware fallback");
      const fallback = generateLocalFallbackReply({ message, role, user, context });
      res.json({
        success: true,
        reply: fallback.reply,
        actions: fallback.actions,
        fromFallback: true,
      });
      return;
    }

    // Prepare system instructions with live institutional context
    const systemInstruction = `You are the official Intelligent AI Campus Assistant for Brightwood College of Engineering & Technology.
Current Date: September 2026.
You assist Students, Parents, Accountants, Staff, and Administrators in English and Tanglish (Tamil written in Latin script) / Tamil.

AUTHENTICATED USER DETAILS:
- Name: ${user.name || "User"}
- Role: ${role}
- Department: ${user.department || "N/A"}
- Register/Roll Number: ${user.registerNumber || user.rollNo || "N/A"}
- Email: ${user.email || "N/A"}

LIVE CONTEXT DATA:
${JSON.stringify(context, null, 2)}

SECURITY & ACCURACY RULES:
1. STRICT IDENTITY BOUNDARY: You can ONLY discuss records for the authenticated user (${user.name || "User"}). Never share other students' data.
2. ACCURACY: Always quote exact monetary amounts and dates from LIVE CONTEXT DATA.
3. UNRELATED QUESTIONS: Politely decline general knowledge or coding tasks unrelated to college affairs.
4. ACTION SUGGESTIONS: Format action buttons at the end of response as:
ACTIONS: [Action Label](action_code)`;

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

    const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let fullText = null;
    let usedModel = null;

    for (const mName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: mName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });
        if (response?.text) {
          fullText = response.text;
          usedModel = mName;
          break;
        }
      } catch (err) {
        console.warn(`[Cloud Function] Model ${mName} error:`, err?.message || err);
      }
    }

    if (!fullText) {
      const fallback = generateLocalFallbackReply({ message, role, user, context });
      res.json({
        success: true,
        reply: fallback.reply,
        actions: fallback.actions,
        fromFallback: true,
      });
      return;
    }

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

    // Optionally persist message in Firestore using Admin SDK if userId is available
    const userId = user.id || user.uid;
    if (userId) {
      try {
        const nowIso = new Date().toISOString();
        const displayTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const userMsgId = `msg_${Date.now()}_u`;
        const botMsgId = `msg_${Date.now() + 1}_b`;

        const convRef = db.collection("chat_conversations").doc(userId);
        await convRef.set(
          {
            userId,
            userName: user.name || "User",
            userEmail: user.email || "",
            role: role || "student",
            department: user.department || "",
            lastMessage: cleanReply.slice(0, 300),
            lastSender: "bot",
            updatedAt: nowIso,
          },
          { merge: true }
        );

        // Save bot message into subcollection
        await convRef.collection("messages").doc(botMsgId).set({
          id: botMsgId,
          sender: "bot",
          text: cleanReply,
          timestamp: displayTime,
          createdAt: nowIso,
          actions,
        });
      } catch (dbErr) {
        console.warn("[Cloud Function] Message persistence notice:", dbErr?.message || dbErr);
      }
    }

    res.json({
      success: true,
      reply: cleanReply,
      actions,
      model: usedModel,
    });
  } catch (err) {
    console.error("[Cloud Function] Unexpected error:", err);
    res.status(500).json({
      error: "Internal server error processing chat message",
      details: err.message,
    });
  }
});
