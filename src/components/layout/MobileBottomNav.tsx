import React from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  User,
  MessageSquare,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";

export interface MobileBottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onNavigate,
}) => {
  const { activeRole } = useAuth();

  const getNavItems = () => {
    if (activeRole === "student") {
      return [
        { id: "fees", label: "Fees", icon: <CreditCard className="w-5 h-5" /> },
        { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
        { id: "chatbot", label: "Chatbot", icon: <MessageSquare className="w-5 h-5" /> },
        { id: "notifications", label: "Alerts", icon: <Bell className="w-5 h-5" /> },
      ];
    }

    if (activeRole === "parent") {
      return [
        { id: "dashboard", label: "Ward", icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: "student-fees", label: "Pay Fees", icon: <CreditCard className="w-5 h-5" /> },
        { id: "student-results", label: "Report Card", icon: <BarChart3 className="w-5 h-5" /> },
        { id: "student-attendance", label: "Attendance", icon: <UserCheck className="w-5 h-5" /> },
        { id: "profile", label: "Profile", icon: <GraduationCap className="w-5 h-5" /> },
      ];
    }

    if (activeRole === "accountant") {
      return [
        { id: "dashboard", label: "Finance", icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: "fees", label: "Fees", icon: <CreditCard className="w-5 h-5" /> },
        { id: "expenses", label: "Expenses", icon: <Receipt className="w-5 h-5" /> },
        { id: "payment-approval", label: "Approvals", icon: <ShieldCheck className="w-5 h-5" /> },
        { id: "reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
      ];
    }

    // Default: Admin / Principal / HOD / Faculty
    return [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: "students-list", label: "Students", icon: <Users className="w-5 h-5" /> },
      { id: "fees", label: "Fees", icon: <CreditCard className="w-5 h-5" /> },
      { id: "expenses", label: "Expenses", icon: <Receipt className="w-5 h-5" /> },
      { id: "reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
      { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-bottom-nav px-2 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-200 relative ${
                isActive
                  ? "text-violet-700 font-bold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 bg-gradient-to-r from-violet-600 to-pink-500 rounded-full" />
              )}
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? "bg-violet-100/80 text-violet-700 scale-110 shadow-xs"
                    : "text-slate-500"
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
