import React, { useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCheck,
  CreditCard,
  CalendarPlus,
  CheckSquare,
  Layers,
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  BarChart3,
  Settings,
  User,
  LogOut,
  ChevronRight,
  BookOpen,
  X,
  Receipt,
  Sparkles,
  MessageSquare,
  Bell,
  Briefcase,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_CONFIGS, UserRole } from "../../types";

export interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const { user, logout, activeRole } = useAuth();
  const activeCurrentTab = currentTab || activeTab || "dashboard";
  const handleTabChange = setCurrentTab || setActiveTab || (() => {});
  const handleCloseMobile = useCallback(() => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  }, [setMobileOpen]);

  // Handle Escape key to close side panel and lock body scroll on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        e.preventDefault();
        handleCloseMobile();
      }
    };

    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileOpen, handleCloseMobile]);

  const getNavSections = () => {
    if (activeRole === "student") {
      return [
        {
          title: "Student Portal",
          items: [
            { id: "fees", label: "Fees Details", icon: <CreditCard className="w-4 h-4" /> },
            { id: "profile", label: "General Student Profile", icon: <User className="w-4 h-4" /> },
            { id: "chatbot", label: "AI Fee Chatbot", icon: <MessageSquare className="w-4 h-4" /> },
            { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
          ],
        },
      ];
    }

    if (activeRole === "parent") {
      return [
        {
          title: "Ward Overview",
          items: [
            { id: "dashboard", label: "Ward Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "student-fees", label: "Pay College Fees", icon: <CreditCard className="w-4 h-4" /> },
            { id: "student-attendance", label: "Attendance & Conduct", icon: <UserCheck className="w-4 h-4" /> },
            { id: "student-results", label: "Academic Progress", icon: <BarChart3 className="w-4 h-4" /> },
          ],
        },
        {
          title: "Account",
          items: [
            { id: "profile", label: "Guardian Profile", icon: <User className="w-4 h-4" /> },
          ],
        },
      ];
    }

    if (activeRole === "accountant") {
      return [
        {
          title: "Bursar Operations",
          items: [
            { id: "dashboard", label: "Finance Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "expenses", label: "Expense Management", icon: <Receipt className="w-4 h-4" /> },
            { id: "staff-management", label: "Staff & Salaries", icon: <Briefcase className="w-4 h-4" /> },
            { id: "fees", label: "Collect Student Fees", icon: <CreditCard className="w-4 h-4" /> },
            { id: "generate-monthly-fees", label: "Batch Invoicing", icon: <CalendarPlus className="w-4 h-4" /> },
            { id: "payment-approval", label: "Payment Approvals", icon: <CheckSquare className="w-4 h-4" /> },
            { id: "fee-categories", label: "Fee Structures", icon: <Layers className="w-4 h-4" /> },
            { id: "csv-import", label: "CSV Datasets & Sync", icon: <FileSpreadsheet className="w-4 h-4" /> },
          ],
        },
        {
          title: "Audit & Account",
          items: [
            { id: "reports", label: "Reconciliation Reports", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "audit-logs", label: "Audit Ledger", icon: <ShieldAlert className="w-4 h-4" /> },
            { id: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
          ],
        },
      ];
    }

    if (activeRole === "hod") {
      return [
        {
          title: "Department Management",
          items: [
            { id: "dashboard", label: "Department Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "students-list", label: "Students Registry", icon: <Users className="w-4 h-4" /> },
            { id: "academic-info", label: "Academic Structure", icon: <GraduationCap className="w-4 h-4" /> },
          ],
        },
        {
          title: "Reports & Account",
          items: [
            { id: "reports", label: "Academic Reports", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "profile", label: "HOD Profile", icon: <User className="w-4 h-4" /> },
          ],
        },
      ];
    }

    if (activeRole === "faculty") {
      return [
        {
          title: "Teaching & Classes",
          items: [
            { id: "dashboard", label: "Faculty Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "students-list", label: "Class Students", icon: <Users className="w-4 h-4" /> },
            { id: "academic-info", label: "Subjects & Curriculum", icon: <BookOpen className="w-4 h-4" /> },
          ],
        },
        {
          title: "Analytics & Profile",
          items: [
            { id: "reports", label: "Class Performance", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "profile", label: "Faculty Profile", icon: <User className="w-4 h-4" /> },
          ],
        },
      ];
    }

    // Default: Super Admin / Principal
    return [
      {
        title: "Finance & Operations",
        items: [
          { id: "dashboard", label: "Finance Analytics & Prediction", icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: "expenses", label: "Expense Management", icon: <Receipt className="w-4 h-4" /> },
          { id: "staff-management", label: "Staff & Salary Management", icon: <Briefcase className="w-4 h-4" /> },
          { id: "fees", label: "Fee Management", icon: <CreditCard className="w-4 h-4" /> },
          { id: "csv-import", label: "CSV Datasets & Sync", icon: <FileSpreadsheet className="w-4 h-4" /> },
        ],
      },
      {
        title: "Fee Billing & Accounts",
        items: [
          { id: "generate-monthly-fees", label: "Generate Monthly Fees", icon: <CalendarPlus className="w-4 h-4" /> },
          { id: "payment-approval", label: "Payment Approvals", icon: <CheckSquare className="w-4 h-4" /> },
          { id: "fee-categories", label: "Fee Categories", icon: <Layers className="w-4 h-4" /> },
        ],
      },
      {
        title: "Students & Academic",
        items: [
          { id: "students-list", label: "Students Directory", icon: <Users className="w-4 h-4" /> },
          { id: "add-student", label: "Add Student", icon: <UserPlus className="w-4 h-4" /> },
          { id: "student-details", label: "Student Profile", icon: <UserCheck className="w-4 h-4" /> },
          { id: "parents", label: "Parents / Guardians", icon: <HeartHandshake className="w-4 h-4" /> },
          { id: "academic-info", label: "Academic Structure", icon: <GraduationCap className="w-4 h-4" /> },
        ],
      },
      {
        title: "Analytics & System",
        items: [
          { id: "reports", label: "Reports & Analytics", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "users", label: "User Management", icon: <ShieldCheck className="w-4 h-4" /> },
          { id: "audit-logs", label: "Security & Audit Logs", icon: <ShieldAlert className="w-4 h-4" /> },
          { id: "settings", label: "Admin Settings", icon: <Settings className="w-4 h-4" /> },
          { id: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
        ],
      },
    ];
  };

  const navSections = getNavSections();
  const roleLabel = ROLE_CONFIGS[activeRole]?.label || "Administrator";

  return (
    <>
      {/* Mobile Backdrop with Smooth Opacity Transition */}
      <div
        id="sidebar-backdrop"
        onClick={(e) => {
          e.stopPropagation();
          handleCloseMobile();
        }}
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out lg:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        id="main-sidebar-panel"
        aria-label="Main Navigation Side Panel"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 flex-shrink-0 bg-[#1E40AF] text-white flex flex-col will-change-transform transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-blue-600/60 bg-[#1D3BB0]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white text-blue-700 flex items-center justify-center font-black shadow-md text-base flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-white text-lg tracking-tight leading-none truncate">Our College</h1>
              <p className="text-[11px] text-blue-200 mt-1 font-medium truncate">College Management ERP</p>
            </div>
          </div>

          {/* Close Button for Mobile & Tablet Side Panel */}
          <button
            type="button"
            id="sidebar-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCloseMobile();
            }}
            className="lg:hidden p-2 text-blue-200 hover:text-white hover:bg-blue-700/70 active:scale-90 active:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-white/40 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer flex-shrink-0"
            aria-label="Close side panel"
            title="Close side panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive =
                  activeCurrentTab === item.id ||
                  (activeCurrentTab === "edit-student" && item.id === "students-list");
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleTabChange(item.id);
                      handleCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white text-blue-800 shadow-md font-bold"
                        : "text-blue-100 hover:bg-blue-700/60 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-blue-700" : "text-blue-200"}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-blue-600/60 bg-[#19359B]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-800/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 border border-blue-300/40">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
                <span className="text-[10px] text-blue-200 block truncate">
                  {roleLabel}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
