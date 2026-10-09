import React, { useEffect, useState, useMemo } from "react";
import {
  CreditCard,
  User,
  MessageSquare,
  Bell,
  Sparkles,
  IndianRupee,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Student, studentService } from "../../services/firebase/studentService";
import { FeeRecord, feesService } from "../../services/firebase/feesService";
import { NotificationItem, notificationService } from "../../services/firebase/notificationService";
import { StudentFeesSection } from "../../components/student/StudentFeesSection";
import { StudentProfileSection } from "../../components/student/StudentProfileSection";
import { StudentChatbotSection } from "../../components/student/StudentChatbotSection";
import { StudentNotificationsSection } from "../../components/student/StudentNotificationsSection";

export interface StudentPortalViewProps {
  activeTab?: string;
  onNavigate?: (tab: string) => void;
  onCollectFee?: (invoice: any) => void;
  onViewReceipt?: (receipt: any) => void;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export type StudentDashboardSection = "fees" | "profile" | "chatbot" | "notifications";

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  activeTab = "fees",
  onNavigate = () => {},
  onCollectFee = () => {},
  onViewReceipt = () => {},
  onShowToast = () => {},
}) => {
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState<StudentDashboardSection>("fees");

  // Live Data States from Firebase
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [loadingFees, setLoadingFees] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  // Sync external tab prop with internal section
  useEffect(() => {
    if (activeTab === "profile" || activeTab === "student-profile") {
      setSelectedSection("profile");
    } else if (activeTab === "chatbot" || activeTab === "student-chatbot") {
      setSelectedSection("chatbot");
    } else if (activeTab === "notifications" || activeTab === "student-notifications") {
      setSelectedSection("notifications");
    } else if (activeTab === "fees" || activeTab === "student-fees" || activeTab === "dashboard") {
      setSelectedSection("fees");
    }
  }, [activeTab]);

  // 1. Fetch Student Profile from Department-wise Records in Firebase
  const loadStudentProfile = async () => {
    try {
      setLoadingStudent(true);
      const rawDept = user?.department?.toLowerCase().trim();
      const userDept = rawDept && rawDept !== "all" ? rawDept : "cse";
      const userReg = (user?.rollNo || user?.registerNumber || "").toUpperCase().trim();
      const uid = user?.id || user?.uid || "";

      // Look up student in their department
      let found: Student | null = null;
      if (userDept && uid) {
        found = await studentService.getStudentById(userDept, uid).catch(() => null);
      }

      // If not found by direct ID, search across all departments for matching register number or name
      if (!found) {
        const allStudents = await studentService.getAllStudents().catch(() => []);
        found = allStudents.find((s) => {
          const sReg = (s.registerNumber || s.rollNo || s.id || "").toUpperCase().trim();
          return (
            (userReg && sReg === userReg) ||
            (uid && s.id === uid) ||
            (user?.name && s.name?.toLowerCase() === user.name.toLowerCase())
          );
        }) || null;
      }

      // If still not found, construct basic Student from Auth state without dummy values
      if (!found && user) {
        found = {
          id: uid,
          studentId: uid,
          name: user.name || "Student",
          registerNumber: userReg || "",
          rollNo: userReg || "",
          department: userDept || "",
          year: "1st Year",
          section: "",
          dateOfBirth: "",
          dob: "",
          email: user.email || "",
          phone: user.phone || "",
          parentName: user.wardName || "",
          parentPhone: "",
          status: "active",
        };
      }

      setStudentProfile(found);
    } catch (err) {
      console.warn("Could not load student profile:", err);
    } finally {
      setLoadingStudent(false);
    }
  };

  useEffect(() => {
    loadStudentProfile();
  }, [user?.email, user?.rollNo, user?.department]);

  // 2. Fetch & Listen to Fees in Firebase
  const loadFees = async () => {
    try {
      setLoadingFees(true);
      const rawDept = (studentProfile?.department || user?.department)?.toLowerCase().trim();
      const dept = rawDept && rawDept !== "all" ? rawDept : "cse";
      const deptFees = await feesService.getFeesByDepartment(dept).catch(() => []);

      const studentId = studentProfile?.id || user?.id || user?.uid || "";
      const sName = (studentProfile?.name || user?.name || "").toLowerCase().trim();
      const userReg = (studentProfile?.registerNumber || user?.rollNo || user?.registerNumber || "").toUpperCase().trim();

      let studentInvoices = deptFees.filter((f) => {
        const fReg = ((f as any).studentRegisterNumber || (f as any).rollNo || "").toUpperCase().trim();
        return (
          (studentId && (f.studentId === studentId || (f as any).uid === studentId)) ||
          (userReg && fReg === userReg) ||
          (sName && f.studentName?.toLowerCase().trim() === sName)
        );
      });

      // Fallback search across all departments if no invoices in current department
      if (studentInvoices.length === 0) {
        const allFees = await feesService.getAllFees().catch(() => []);
        studentInvoices = allFees.filter((f) => {
          const fReg = ((f as any).studentRegisterNumber || (f as any).rollNo || "").toUpperCase().trim();
          return (
            (studentId && (f.studentId === studentId || (f as any).uid === studentId)) ||
            (userReg && fReg === userReg) ||
            (sName && f.studentName?.toLowerCase().trim() === sName)
          );
        });
      }

      setFees(studentInvoices);
    } catch (err) {
      console.warn("Could not load student fees:", err);
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    if (studentProfile) {
      loadFees();
    }
  }, [studentProfile?.id, studentProfile?.department]);

  // 3. Real-time Subscription to Notifications
  useEffect(() => {
    const sId = studentProfile?.id || user?.id || user?.uid || "";
    const sDept = (studentProfile?.department || user?.department || "cse").toLowerCase().trim();
    const sReg = (studentProfile?.registerNumber || user?.rollNo || "").toUpperCase().trim();

    setLoadingNotifs(true);
    const unsubscribe = notificationService.subscribeToStudentNotifications(
      sId,
      sDept,
      sReg,
      (items) => {
        setNotifications(items);
        setLoadingNotifs(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [studentProfile?.id, studentProfile?.department, studentProfile?.registerNumber]);

  // Computed Financial Metrics
  const totalFees = useMemo(() => {
    return fees.reduce((acc, f) => acc + Number(f.amount || 0), 0);
  }, [fees]);

  const paidAmount = useMemo(() => {
    return fees.reduce((acc, f) => acc + Number(f.paidAmount || 0), 0);
  }, [fees]);

  const pendingAmount = useMemo(() => {
    return fees
      .filter((f) => f.paymentStatus !== "Paid")
      .reduce((acc, f) => acc + Number(f.balance || (f.amount - (f.paidAmount || 0)) || 0), 0);
  }, [fees]);

  const paymentStatus: "Paid" | "Partially Paid" | "Pending" = useMemo(() => {
    if (pendingAmount === 0 && totalFees > 0) return "Paid";
    if (paidAmount > 0 && pendingAmount > 0) return "Partially Paid";
    return "Pending";
  }, [totalFees, paidAmount, pendingAmount]);

  const earliestDueDate = useMemo(() => {
    const pendingList = fees.filter((f) => f.paymentStatus !== "Paid" && f.dueDate);
    if (pendingList.length > 0) {
      pendingList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return pendingList[0].dueDate;
    }
    return fees[0]?.dueDate || "";
  }, [fees]);

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Switch tab callback
  const handleTabChange = (sec: StudentDashboardSection) => {
    setSelectedSection(sec);
    onNavigate(sec === "fees" ? "fees" : sec);
  };

  return (
    <div className="space-y-6">
      {/* Overview Identity Summary Card */}
      <div className="glass-card p-6 rounded-3xl border border-violet-100/70 shadow-xs bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Student Portal • {studentProfile?.department?.toUpperCase() || "CSE"} • Reg: {studentProfile?.registerNumber || "CSE-501"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {studentProfile?.name || user?.name || "Student"}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
            Access your live fee records, verify institutional profile details, ask the AI Assistant questions, or review administrative notices.
          </p>
        </div>

        {/* Quick Outstanding Due Summary Tile */}
        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-xs flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[11px] text-blue-200 uppercase font-bold block">
              Pending Fee Due
            </span>
            <p className="text-2xl font-black text-white flex items-center gap-0.5">
              <IndianRupee className="w-5 h-5 text-emerald-300" />
              {pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-blue-200">
              {pendingAmount > 0 ? `Due: ${earliestDueDate}` : "All dues settled"}
            </span>
          </div>

          {pendingAmount > 0 ? (
            <button
              onClick={() =>
                onCollectFee({
                  student: studentProfile?.name || "Student",
                  studentId: studentProfile?.registerNumber || "CSE-501",
                  grade: studentProfile?.department?.toUpperCase() || "B.Tech",
                  amount: pendingAmount,
                  id: fees[0]?.id || "INV-2026-004",
                })
              }
              className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-900 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Pay Now
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold">
              Cleared ✓
            </span>
          )}
        </div>
      </div>

      {/* The EXACT 4 Sections Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-2xs">
        {/* Section 1: Fees Details */}
        <button
          onClick={() => handleTabChange("fees")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedSection === "fees"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span>1. Fees Details</span>
        </button>

        {/* Section 2: General Student Profile */}
        <button
          onClick={() => handleTabChange("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedSection === "profile"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <User className="w-4 h-4 text-indigo-600" />
          <span>2. General Student Profile</span>
        </button>

        {/* Section 3: Chatbot */}
        <button
          onClick={() => handleTabChange("chatbot")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedSection === "chatbot"
              ? "bg-white text-violet-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-violet-600" />
          <span>3. Chatbot</span>
        </button>

        {/* Section 4: Notifications */}
        <button
          onClick={() => handleTabChange("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            selectedSection === "notifications"
              ? "bg-white text-purple-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Bell className="w-4 h-4 text-purple-600" />
          <span>4. Notifications</span>
          {unreadNotifsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </div>

      {/* RENDER SELECTED SECTION ONLY */}
      {selectedSection === "fees" && (
        <StudentFeesSection
          fees={fees}
          totalFees={totalFees}
          paidAmount={paidAmount}
          pendingAmount={pendingAmount}
          earliestDueDate={earliestDueDate}
          paymentStatus={paymentStatus}
          studentName={studentProfile?.name || user?.name || "Student"}
          department={studentProfile?.department || user?.department || "CSE"}
          registerNumber={studentProfile?.registerNumber || user?.rollNo || "CSE-501"}
          loading={loadingFees}
          onPayFee={onCollectFee}
          onViewReceipt={onViewReceipt}
          onRefresh={loadFees}
        />
      )}

      {selectedSection === "profile" && (
        <StudentProfileSection student={studentProfile} loading={loadingStudent} />
      )}

      {selectedSection === "chatbot" && (
        <StudentChatbotSection
          user={user}
          student={studentProfile}
          fees={fees}
          totalFees={totalFees}
          paidAmount={paidAmount}
          pendingAmount={pendingAmount}
          dueDate={earliestDueDate}
          onNavigateToFees={() => handleTabChange("fees")}
          onShowToast={onShowToast}
        />
      )}

      {selectedSection === "notifications" && (
        <StudentNotificationsSection
          notifications={notifications}
          studentId={studentProfile?.id || user?.id || user?.uid || ""}
          onNavigateToFees={() => handleTabChange("fees")}
          onShowToast={onShowToast}
          loading={loadingNotifs}
        />
      )}
    </div>
  );
};
