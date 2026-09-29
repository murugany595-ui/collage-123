import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  CreditCard,
  Calendar,
  AlertCircle,
  Clock,
  Phone,
  HelpCircle,
  FileText,
  Building,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { chatbotService, ChatMessage, ChatbotContext } from "../../services/chatbotService";
import { chatService } from "../../services/firebase/chatService";
import { auth } from "../../config/firebase";
import { FeeExtensionModal } from "../chatbot/ChatbotModalForms";

export interface StudentChatbotSectionProps {
  user: any;
  student: any;
  fees: any[];
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  onNavigateToFees: () => void;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const StudentChatbotSection: React.FC<StudentChatbotSectionProps> = ({
  user,
  student,
  fees,
  totalFees,
  paidAmount,
  pendingAmount,
  dueDate,
  onNavigateToFees,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [feeExtensionOpen, setFeeExtensionOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeUid = student?.id || user?.id || user?.uid || auth?.currentUser?.uid || "";
  const studentName = student?.name || user?.name || "Student";
  const studentReg = student?.registerNumber || user?.rollNo || "CSE-501";
  const studentDept = (student?.department || user?.department || "CSE").toUpperCase();

  // Create real-time live context object directly from student's actual Firebase fee data
  const liveContext: ChatbotContext = {
    feeSummary: {
      totalBilled: totalFees,
      paidAmount: paidAmount,
      pendingAmount: pendingAmount,
      dueDate: dueDate || "2026-10-15",
      paymentStatus: pendingAmount === 0 ? "Paid" : paidAmount > 0 ? "Partially Paid" : "Pending",
      invoices: fees.map((f) => ({
        id: f.id,
        feeType: f.feeType || "College Fee",
        amount: f.amount || 0,
        paidAmount: f.paidAmount || 0,
        balance: f.balance || 0,
        paymentStatus: f.paymentStatus || "Pending",
        dueDate: f.dueDate || dueDate,
      })),
    },
  };

  // Initial welcome message or load history from Firestore
  useEffect(() => {
    const welcome: ChatMessage = {
      id: "welcome-student-chat",
      sender: "bot",
      text: `Hello ${studentName}! 👋 I am your dedicated College Fee Assistant.
I have access to your live tuition, exam fee, and institutional records in Firebase.
• Total Fees: ₹${totalFees.toLocaleString("en-IN")}
• Paid: ₹${paidAmount.toLocaleString("en-IN")}
• Pending Balance: ₹${pendingAmount.toLocaleString("en-IN")}
• Next Due Date: ${dueDate || "October 15, 2026"}

Feel free to ask about your fee details, payment status, due dates, fee extension requests, or how to reach Admin/Accountancy!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actions: [
        { label: "Check Pending Fees", target: "action:check_fees" },
        { label: "Request Fee Extension", target: "action:extension_form" },
        { label: "Contact Accountancy", target: "action:contact_admin" },
      ],
    };

    if (!activeUid) {
      setMessages([welcome]);
      return;
    }

    let isMounted = true;
    setLoadingHistory(true);

    chatService
      .loadChatHistory(activeUid)
      .then((history) => {
        if (!isMounted) return;
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([welcome]);
        }
      })
      .catch((err) => {
        console.warn("[StudentChatbotSection] History load notice:", err);
        if (isMounted) setMessages([welcome]);
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeUid, totalFees, paidAmount, pendingAmount, dueDate, studentName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setLoading(true);
    setLastFailedMessage(null);

    // Save user message to Firestore chat_conversations/{activeUid}/messages
    if (activeUid) {
      chatService
        .saveMessage({
          userId: activeUid,
          sender: "user",
          text: query,
          userMeta: {
            name: studentName,
            email: student?.email || user?.email,
            role: "student",
            department: studentDept.toLowerCase(),
          },
        })
        .catch((err) => console.warn("[StudentChatbotSection] Failed saving user msg to Firestore:", err?.message || err));
    }

    try {
      // Build conversation history for context
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === "user" ? "user" : "model") as "user" | "model",
        text: m.text,
      }));

      const res = await chatbotService.sendMessage({
        message: query,
        role: "student",
        user: {
          id: student?.id || user?.id || user?.uid,
          name: studentName,
          email: student?.email || user?.email,
          department: studentDept.toLowerCase(),
          registerNumber: studentReg,
          rollNo: studentReg,
        },
        context: liveContext,
        history,
      });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: res.actions || [],
      };

      setMessages((prev) => [...prev, botMsg]);

      // Save bot response to Firestore chat_conversations/{activeUid}/messages
      if (activeUid) {
        chatService
          .saveMessage({
            userId: activeUid,
            sender: "bot",
            text: res.reply,
            actions: res.actions || [],
            userMeta: {
              name: studentName,
              email: student?.email || user?.email,
              role: "student",
              department: studentDept.toLowerCase(),
            },
          })
          .catch((err) => console.warn("[StudentChatbotSection] Failed saving bot msg to Firestore:", err?.message || err));
      }
    } catch (err: any) {
      console.warn("[StudentChatbotSection] sendMessage error:", err?.message || err);
      setLastFailedMessage(query);
      const errMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: err?.message?.includes("busy") || err?.message?.includes("demand")
          ? "The Gemini AI service is currently experiencing high traffic. Please click 'Retry Question' below."
          : `I encountered an issue connecting to Gemini AI: ${err?.message || "Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (target: string) => {
    if (target === "action:check_fees" || target === "nav:fees") {
      onNavigateToFees();
    } else if (target === "action:extension_form" || target === "form:fee_extension") {
      setFeeExtensionOpen(true);
    } else if (target === "action:contact_admin") {
      handleSend("Who should I contact in Administration or Accountancy for fee assistance?");
    } else {
      handleSend(`Tell me more about ${target}`);
    }
  };

  const handleResetChat = async () => {
    if (activeUid) {
      await chatService.clearChatHistory(activeUid).catch((err) => console.warn("Failed to clear chat history:", err));
    }
    setMessages([
      {
        id: "welcome-reset",
        sender: "bot",
        text: `Chat reset. Hello ${studentName}! How can I help you with your college fee queries?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "Check Pending Fees", target: "action:check_fees" },
          { label: "Request Fee Extension", target: "action:extension_form" },
        ],
      },
    ]);
  };

  const quickQuestions = [
    "What is my total pending fee and due date?",
    "Explain my fee breakdown",
    "How do I request a fee extension?",
    "Who should I contact in Accountancy?",
    "What are the payment methods accepted?",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Live Fee Context Status Header */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-violet-100/70 shadow-xs bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-violet-400/20 text-violet-300 border border-violet-400/30">
              <Sparkles className="w-4 h-4 text-violet-300" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300">
              Student Fee AI Assistant • Live Firebase Grounding
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Personal Fee Assistant for {studentName}
          </h2>
          <p className="text-xs text-violet-200">
            Reg: <strong className="font-mono text-white">{studentReg}</strong> • {studentDept} Department • Securely grounded in your actual payment ledger.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-xs">
          <div>
            <span className="text-[10px] text-violet-200 font-bold uppercase block">
              Live Pending Balance
            </span>
            <p className="text-lg font-black text-white">
              ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={() => setFeeExtensionOpen(true)}
            className="px-3 py-1.5 bg-white text-violet-950 hover:bg-violet-50 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Request Extension
          </button>
        </div>
      </div>

      {/* Main Chat Interface Container */}
      <div className="glass-card rounded-3xl border border-white/80 shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Chat Feed Header */}
        <div className="p-4 border-b border-slate-100 bg-white/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">College AI Fee Support</h3>
              <p className="text-[10px] text-slate-400">Available 24/7 for queries & extension guidance</p>
            </div>
          </div>

          <button
            onClick={handleResetChat}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Reset Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
          {loadingHistory ? (
            <div className="h-full flex flex-col items-center justify-center py-12 space-y-3 text-center">
              <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
              <p className="text-xs font-medium text-slate-600">Retrieving chat history from Firestore...</p>
              <p className="text-[11px] text-slate-400">Loading chat_conversations/{activeUid}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isBot = msg.sender === "bot";
              const isError = isBot && (msg.text.includes("encountered an issue") || msg.text.includes("experiencing high traffic"));
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isBot ? "items-start" : "items-end justify-end"}`}
                >
                  {isBot && (
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                      isBot
                        ? isError
                          ? "bg-rose-50 border border-rose-200 text-rose-800 shadow-xs"
                          : "bg-white text-slate-800 border border-slate-200/80 shadow-xs"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Bot Interactive Action Chips */}
                    {isBot && msg.actions && msg.actions.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleActionClick(act.target)}
                            className="px-3 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/70 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Retry button on error */}
                    {isError && lastFailedMessage && (
                      <div className="pt-2 border-t border-rose-200/60 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSend(lastFailedMessage)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Question</span>
                        </button>
                      </div>
                    )}

                    <span
                      className={`block text-[10px] text-right font-medium ${
                        isBot ? "text-slate-400" : "text-violet-200"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {!isBot && (
                    <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mb-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs py-2 px-1">
              <div className="w-6 h-6 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center animate-spin">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="animate-pulse font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Gemini AI is analyzing live fee ledger and formulating response...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white/90 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            Suggested:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 text-[11px] font-medium whitespace-nowrap transition border border-slate-200/60 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about your fee details, due dates, breakdown, or extensions..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-slate-50/50 font-medium text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Modal: Fee Extension Request Form */}
      <FeeExtensionModal
        isOpen={feeExtensionOpen}
        onClose={() => setFeeExtensionOpen(false)}
        user={{
          id: student?.id || user?.id || user?.uid,
          name: studentName,
          email: student?.email || user?.email,
          department: studentDept,
          rollNo: studentReg,
          registerNumber: studentReg,
        }}
        currentDueDate={dueDate || "2026-10-15"}
        onShowToast={onShowToast}
      />
    </div>
  );
};

