import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Calendar,
  CreditCard,
  Clock,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { chatbotService, ChatMessage, ChatbotContext } from "../../services/chatbotService";
import { chatService } from "../../services/firebase/chatService";
import { auth } from "../../config/firebase";
import {
  FeeExtensionModal,
  LeaveRequestModal,
  AttendanceCorrectionModal,
  PaymentIssueModal,
  RequestStatusViewerModal,
} from "./ChatbotModalForms";

interface CollegeChatbotProps {
  user: any;
  activeRole: string;
  onNavigate: (tab: string) => void;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const CollegeChatbot: React.FC<CollegeChatbotProps> = ({
  user,
  activeRole,
  onNavigate,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [context, setContext] = useState<ChatbotContext>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active modal triggers
  const [feeExtensionOpen, setFeeExtensionOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [attendanceCorrectionOpen, setAttendanceCorrectionOpen] = useState(false);
  const [paymentIssueOpen, setPaymentIssueOpen] = useState(false);
  const [viewRequestsOpen, setViewRequestsOpen] = useState(false);

  // Active user UID for database operations - prioritize authenticated currentUser UID
  const activeUid = auth?.currentUser?.uid || user?.uid || user?.id || "";

  // Load context on mount / when role changes
  useEffect(() => {
    if (user) {
      chatbotService
        .fetchLiveUserContext(user, activeRole)
        .then((ctx) => setContext(ctx))
        .catch((err) => console.warn("Failed to load chatbot context:", err));
    }
  }, [user?.email, user?.id, activeRole]);

  // Load chat history from Firestore when chatbot opens or user/role changes
  useEffect(() => {
    const welcomeText = `Hi! 👋 I'm your College AI Assistant.
I can help you with fees, attendance, examinations, leave requests, payments, student information and other college-management related questions.
How can I help you today?`;

    const defaultWelcome: ChatMessage = {
      id: "msg-welcome",
      sender: "bot",
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actions: [
        { label: "Check Fee Balance", target: "nav:fees" },
        { label: "Request Fee Extension", target: "form:fee_extension" },
        { label: "Apply Leave", target: "form:leave" },
        { label: "Check Attendance", target: "nav:attendance" },
      ],
    };

    if (!activeUid) {
      setMessages([defaultWelcome]);
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
          setMessages([defaultWelcome]);
        }
      })
      .catch((err) => {
        console.warn("[Chatbot] History load notice:", err);
        if (isMounted) setMessages([defaultWelcome]);
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeUid, activeRole]);

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Suggested questions based on role
  const getSuggestedQuestions = () => {
    if (activeRole === "student") {
      return [
        "Enakku fees balance evlo?",
        "Fees last date eppo?",
        "Fees time extend panna mudiyuma?",
        "En attendance percentage evlo?",
        "Upcoming exam fees details enna?",
        "En fee extension status enna?",
        "Apply for leave",
      ];
    }
    if (activeRole === "parent") {
      return [
        "What is my child's fee balance?",
        "Can I request a fee extension?",
        "How is my child's attendance rate?",
        "Upcoming semester exam fee dues",
        "Check fee extension request status",
      ];
    }
    if (activeRole === "accountant") {
      return [
        "What are today's total fee collections?",
        "How many students have pending fees?",
        "Any pending fee extension requests?",
        "Review fee extension applications",
      ];
    }
    if (activeRole === "staff") {
      return [
        "How to apply for staff leave?",
        "Department student attendance rate",
        "View student extension requests",
      ];
    }
    // Admin
    return [
      "Overall college fee collection overview",
      "Pending fee extension requests to review",
      "Electricity and staff salary expenses",
    ];
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);
    setLastFailedMessage(null);

    // Save user message to Firestore chat_conversations/{activeUid}/messages asynchronously
    if (activeUid) {
      chatService
        .saveMessage({
          userId: activeUid,
          sender: "user",
          text,
          userMeta: {
            name: user?.name,
            email: user?.email,
            role: activeRole,
            department: user?.department,
          },
        })
        .catch((err) => console.warn("[Chatbot] Failed saving user message to Firestore:", err?.message || err));
    }

    try {
      // Prepare history for Gemini context (last 6 messages)
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        text: m.text,
      }));

      // Refresh context before query to ensure live fee and academic records are accurate
      const freshContext = await chatbotService.fetchLiveUserContext(user, activeRole);
      setContext(freshContext);

      const res = await chatbotService.sendMessage({
        message: text,
        role: activeRole,
        user,
        context: freshContext,
        history,
      });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: res.actions,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Save Gemini response to Firestore chat_conversations/{activeUid}/messages
      if (activeUid) {
        chatService
          .saveMessage({
            userId: activeUid,
            sender: "bot",
            text: res.reply,
            actions: res.actions,
            userMeta: {
              name: user?.name,
              email: user?.email,
              role: activeRole,
              department: user?.department,
            },
          })
          .catch((err) => console.warn("[Chatbot] Failed saving bot response to Firestore:", err?.message || err));
      }
    } catch (err: any) {
      console.warn("[Chatbot] sendMessage error:", err?.message || err);
      setLastFailedMessage(text);
      const errMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: err?.message?.includes("busy") || err?.message?.includes("demand")
          ? "The Gemini AI service is currently experiencing high demand. Please click 'Retry' to try again."
          : `I encountered an issue connecting to the AI service: ${err?.message || "Please try again or contact the Accounts/Admin department."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (target: string) => {
    if (target.startsWith("nav:")) {
      const dest = target.replace("nav:", "");
      if (dest === "fees") {
        if (activeRole === "student") onNavigate("student-fees");
        else if (activeRole === "parent") onNavigate("parent-fees");
        else onNavigate("fees");
      } else if (dest === "attendance") {
        if (activeRole === "student") onNavigate("student-attendance");
        else if (activeRole === "parent") onNavigate("parent-attendance");
        else onNavigate("attendance");
      } else if (dest === "exam-fees" || dest === "exams") {
        onNavigate("exams");
      } else if (dest === "reports") {
        onNavigate("reports");
      } else {
        onNavigate(dest);
      }
    } else if (target.startsWith("form:")) {
      const formType = target.replace("form:", "");
      if (formType === "fee_extension") setFeeExtensionOpen(true);
      else if (formType === "leave") setLeaveModalOpen(true);
      else if (formType === "attendance_correction") setAttendanceCorrectionOpen(true);
      else if (formType === "payment_issue") setPaymentIssueOpen(true);
      else if (formType === "view_requests") setViewRequestsOpen(true);
    }
  };

  const handleClearChat = async () => {
    if (activeUid) {
      await chatService.clearChatHistory(activeUid).catch((err) => console.warn("Failed to clear remote history:", err));
    }
    setMessages([
      {
        id: "msg-cleared",
        sender: "bot",
        text: `Chat cleared. How can I assist you with your college services today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "Check Fee Balance", target: "nav:fees" },
          { label: "Request Fee Extension", target: "form:fee_extension" },
        ],
      },
    ]);
  };

  // Safe formatting for markdown (bold, bullet points)
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Check for bullet point
      const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("• ") || line.trim().startsWith("- ");
      const cleanLine = isBullet ? line.trim().replace(/^[\*\•\-]\s*/, "") : line;

      // Parse bold segments **text**
      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

      const parsedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 ml-1">
            <span className="text-blue-500 mt-1">•</span>
            <span className="flex-1">{parsedParts}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {parsedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
        {!isOpen && (
          <div className="relative group">
            <button
              onClick={() => setIsOpen(true)}
              id="college-ai-chatbot-trigger"
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label="Open College AI Assistant"
            >
              <Bot className="w-7 h-7" />
              {/* Online pulse dot */}
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </button>
            <div className="absolute right-0 bottom-full mb-2.5 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs font-medium py-1.5 px-3 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
              Ask College AI Assistant
              <div className="absolute top-full right-5 border-4 border-transparent border-t-slate-900" />
            </div>
          </div>
        )}
      </div>

      {/* 2. CHAT WINDOW */}
      {isOpen && (
        <div
          id="college-ai-chat-window"
          className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[410px] h-[580px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300 flex items-center justify-center">
                <Bot className="w-6 h-6" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white tracking-tight">College AI Assistant</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase tracking-wider">
                    {activeRole}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online • Ready to help
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setFeeExtensionOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-medium whitespace-nowrap flex items-center gap-1 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              Fee Extension
            </button>
            <button
              onClick={() => setAttendanceCorrectionOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-medium whitespace-nowrap flex items-center gap-1 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attendance
            </button>
            <button
              onClick={() => setViewRequestsOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 font-medium whitespace-nowrap flex items-center gap-1 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              My Requests
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 text-xs">
            {loadingHistory ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="space-y-2 max-w-[75%]">
                    <div className="h-4 bg-slate-200/80 rounded-lg w-48" />
                    <div className="h-14 bg-slate-200/80 rounded-2xl w-64" />
                  </div>
                </div>
                <div className="flex items-end justify-end gap-2.5">
                  <div className="h-10 bg-slate-200/80 rounded-2xl w-48" />
                  <div className="w-7 h-7 rounded-lg bg-slate-200/80 shrink-0" />
                </div>
                <div className="text-center pt-3">
                  <span className="text-[11px] text-slate-500 font-medium inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200/80 shadow-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Connecting to chat history...
                  </span>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isBot = msg.sender === "bot";
                const isError = isBot && (msg.text.includes("encountered an issue") || msg.text.includes("experiencing high demand"));
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isBot ? "items-start" : "items-end justify-end"}`}
                  >
                    {isBot && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`max-w-[85%] space-y-1.5 ${isBot ? "text-slate-800" : "text-white"}`}>
                      <div
                        className={`p-3.5 rounded-2xl text-xs shadow-xs ${
                          isBot
                            ? isError
                              ? "bg-rose-50/90 border border-rose-200 text-rose-800 rounded-tl-xs"
                              : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                        }`}
                      >
                        {renderFormattedText(msg.text)}

                        {/* Action buttons inside bot messages */}
                        {isBot && msg.actions && msg.actions.length > 0 && (
                          <div className="pt-2.5 mt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => handleActionClick(act.target)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 transition border border-blue-200/60 active:scale-95"
                              >
                                <span>{act.label}</span>
                                <ExternalLink className="w-3 h-3 text-blue-500" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Interactive Retry Button if error */}
                        {isError && lastFailedMessage && (
                          <div className="pt-2.5 mt-2 border-t border-rose-200/60 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendMessage(lastFailedMessage)}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] flex items-center gap-1.5 shadow-xs transition"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry Question</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <span className={`block text-[10px] text-slate-400 px-1 ${isBot ? "text-left" : "text-right"}`}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {!isBot && (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mb-4">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-500 ml-1 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Gemini AI is analyzing records...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions Carousel */}
          {messages.length < 3 && (
            <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100">
              <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                Suggested questions:
              </span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {getSuggestedQuestions().map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] whitespace-nowrap transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask in English, தமிழ் or Tanglish..."
              className="flex-1 py-2 px-3.5 bg-slate-100/80 focus:bg-white border border-transparent focus:border-blue-400 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-blue-500/20 transition shrink-0"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* 3. MODAL FORMS */}
      {feeExtensionOpen && (
        <FeeExtensionModal
          isOpen={feeExtensionOpen}
          onClose={() => setFeeExtensionOpen(false)}
          user={user}
          role={activeRole}
          defaultDueDate={context.feeSummary?.dueDate}
          onSuccess={(msg, reqId) => {
            onShowToast(msg, "success");
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-form-success-${Date.now()}`,
                sender: "bot",
                text: `✅ ${msg}\n\nYou can ask 'En fee extension request status enna?' anytime to track updates.`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                actions: [{ label: "View My Requests", target: "form:view_requests" }],
              },
            ]);
          }}
        />
      )}

      {leaveModalOpen && (
        <LeaveRequestModal
          isOpen={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          user={user}
          role={activeRole}
          onSuccess={(msg) => {
            onShowToast(msg, "success");
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-leave-success-${Date.now()}`,
                sender: "bot",
                text: `✅ ${msg}`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                actions: [{ label: "View My Requests", target: "form:view_requests" }],
              },
            ]);
          }}
        />
      )}

      {attendanceCorrectionOpen && (
        <AttendanceCorrectionModal
          isOpen={attendanceCorrectionOpen}
          onClose={() => setAttendanceCorrectionOpen(false)}
          user={user}
          role={activeRole}
          onSuccess={(msg) => {
            onShowToast(msg, "success");
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-att-success-${Date.now()}`,
                sender: "bot",
                text: `✅ ${msg}`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                actions: [{ label: "View My Requests", target: "form:view_requests" }],
              },
            ]);
          }}
        />
      )}

      {paymentIssueOpen && (
        <PaymentIssueModal
          isOpen={paymentIssueOpen}
          onClose={() => setPaymentIssueOpen(false)}
          user={user}
          role={activeRole}
          onSuccess={(msg) => {
            onShowToast(msg, "success");
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-pay-success-${Date.now()}`,
                sender: "bot",
                text: `✅ ${msg}`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                actions: [{ label: "View My Requests", target: "form:view_requests" }],
              },
            ]);
          }}
        />
      )}

      {viewRequestsOpen && (
        <RequestStatusViewerModal
          isOpen={viewRequestsOpen}
          onClose={() => setViewRequestsOpen(false)}
          user={user}
          role={activeRole}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
};
