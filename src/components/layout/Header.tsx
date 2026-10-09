import React, { useState } from "react";
import {
  Menu,
  Bell,
  Search,
  Calendar,
  Clock,
  Shield,
  GraduationCap,
  Users2,
  Calculator,
  Layers,
  BookOpen,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_CONFIGS, UserRole } from "../../types";

export interface HeaderProps {
  currentTab?: string;
  activeTab?: string;
  setMobileOpen?: (open: boolean) => void;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeTab,
  setMobileOpen,
  onNavigate = () => {},
}) => {
  const { user, activeRole, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const activeTabName = currentTab || activeTab || "dashboard";

  const notifications = [
    { id: 1, title: "Semester Tuition Ledger Synchronized", time: "Just now", type: "success" },
    { id: 2, title: "Firebase Authentication Active", time: "Connected", type: "info" },
    { id: 3, title: "Campus Attendance Logs Verified", time: "Today, 9:00 AM", type: "info" },
  ];

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case "admin":
        return <Shield className="w-3.5 h-3.5 text-blue-600" />;
      case "hod":
        return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      case "accountant":
        return <Calculator className="w-3.5 h-3.5 text-emerald-600" />;
      case "faculty":
        return <BookOpen className="w-3.5 h-3.5 text-sky-600" />;
      case "student":
        return <GraduationCap className="w-3.5 h-3.5 text-purple-600" />;
      case "parent":
        return <Users2 className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const getTabTitle = (tab: string, role: UserRole) => {
    if (role === "student") {
      switch (tab) {
        case "dashboard":
          return { title: "Student Academic Dashboard", category: "My Portal" };
        case "student-fees":
          return { title: "My Semester Fees & Payment History", category: "Finance" };
        case "student-results":
          return { title: "Academic Grades & Semester Results", category: "Academics" };
        case "student-attendance":
          return { title: "Class Attendance & Logs", category: "Academics" };
        case "student-schedule":
          return { title: "Weekly Class Schedule & Exams", category: "Academics" };
        case "profile":
          return { title: "My Student Profile", category: "Account" };
        default:
          return { title: "Student Portal Overview", category: "My Portal" };
      }
    }

    if (role === "parent") {
      switch (tab) {
        case "dashboard":
          return { title: "Ward Progress & Fee Dashboard", category: "Parent Portal" };
        case "student-fees":
          return { title: "Pay College Fees & Invoices", category: "Finance" };
        case "student-attendance":
          return { title: "Ward Attendance Records", category: "Academics" };
        case "student-results":
          return { title: "Ward Grades & Report Cards", category: "Academics" };
        case "profile":
          return { title: "Guardian Profile", category: "Account" };
        default:
          return { title: "Parent Portal", category: "Parent Portal" };
      }
    }

    if (role === "faculty" || role === "hod") {
      switch (tab) {
        case "dashboard":
          return { title: role === "hod" ? "Departmental Academic Overview" : "Faculty Teaching Portal", category: "Academics" };
        case "academic-info":
          return { title: "Curriculum & Course Allocations", category: "Academics" };
        case "students-list":
          return { title: "Department Student Registry", category: "Students" };
        case "reports":
          return { title: "Academic Performance Analytics", category: "Analytics" };
        case "profile":
          return { title: "Faculty Profile", category: "Account" };
        default:
          return { title: "Academic Management", category: "Academics" };
      }
    }

    const tabTitles: Record<string, { title: string; category: string }> = {
      dashboard: { title: "Executive Dashboard", category: "Core Operations" },
      "students-list": { title: "Student Directory", category: "Students" },
      "add-student": { title: "Add New Student", category: "Students" },
      "edit-student": { title: "Edit Student Details", category: "Students" },
      "student-details": { title: "Student Profile & Ledger", category: "Students" },
      fees: { title: "Fee Management & Invoices", category: "Finance" },
      "generate-monthly-fees": { title: "Generate Monthly Fees", category: "Finance" },
      "payment-approval": { title: "Payment Approvals Queue", category: "Finance" },
      "fee-categories": { title: "Fee Category Structures", category: "Finance" },
      parents: { title: "Parents & Guardians", category: "People" },
      users: { title: "User & Role Management", category: "Security" },
      "academic-info": { title: "Academic Structure & Classes", category: "Academic" },
      reports: { title: "Reports & Financial Analytics", category: "Analytics" },
      settings: { title: "Admin System & Fees Settings", category: "Configuration" },
      "fees-settings": { title: "Institutional Fees Settings", category: "Configuration" },
      profile: { title: "Institutional Profile", category: "Account" },
    };

    return tabTitles[tab] || { title: "College Finance & ERP", category: "Portal" };
  };

  const activeTitle = getTabTitle(activeTabName, activeRole);
  const roleInfo = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.admin;

  return (
    <header className="sticky top-0 z-30 glass-header px-4 sm:px-6 py-3.5 liquid-specular">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile toggle + Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="sidebar-open-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (setMobileOpen) setMobileOpen(true);
            }}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 rounded-xl lg:hidden transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            aria-label="Open side navigation panel"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <span>Finance ERP</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600 font-semibold">{activeTitle.category}</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              {activeTitle.title}
            </h2>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Academic Session */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/70 backdrop-blur-md text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/60 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>AY 2025–2026</span>
          </div>

          {/* Current Role Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md text-slate-800 rounded-xl text-xs font-bold border border-slate-200/80 shadow-xs">
            {getRoleIcon(activeRole)}
            <span className="capitalize">{roleInfo.label}</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl transition border border-transparent hover:border-slate-200/60 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl shadow-2xl border border-slate-200/80 p-4 z-50 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/50">Active</span>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-white/70 hover:bg-white transition text-xs border border-slate-100">
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-85 transition text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-indigo-600/20">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">
                  {user?.name || "User"}
                </p>
                <span className="text-[10px] text-slate-400 truncate block max-w-[130px] mt-0.5">
                  {user?.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                    {roleInfo.label}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onNavigate("profile");
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-700 transition font-medium cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile & Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition font-bold border-t border-slate-100 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
