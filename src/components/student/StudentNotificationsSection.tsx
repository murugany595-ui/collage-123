import React, { useState } from "react";
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  CheckCheck,
  Filter,
  Megaphone,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { NotificationItem, NotificationCategory, notificationService } from "../../services/firebase/notificationService";

export interface StudentNotificationsSectionProps {
  notifications: NotificationItem[];
  studentId: string;
  onNavigateToFees: () => void;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
  loading: boolean;
}

export const StudentNotificationsSection: React.FC<StudentNotificationsSectionProps> = ({
  notifications,
  studentId,
  onNavigateToFees,
  onShowToast,
  loading,
}) => {
  const [filter, setFilter] = useState<string>("all");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      setMarkingId(id);
      await notificationService.markAsRead(id, studentId);
      onShowToast("Notification marked as read", "info");
    } catch (err: any) {
      onShowToast("Could not update notification status", "error");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(studentId, notifications);
      onShowToast("All notifications marked as read", "success");
    } catch {
      onShowToast("Could not mark all notifications as read", "error");
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "fee") {
      return (
        n.category === "fee_announcement" ||
        n.category === "due_date" ||
        n.category === "pending_reminder" ||
        n.category === "fee_structure"
      );
    }
    if (filter === "admin") return n.category === "admin_announcement";
    if (filter === "payment") return n.category === "payment_confirmation";
    return true;
  });

  const getCategoryMeta = (cat: NotificationCategory) => {
    switch (cat) {
      case "due_date":
      case "pending_reminder":
        return {
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          label: "Fee Due Reminder",
          color: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "payment_confirmation":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: "Payment Confirmation",
          color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "fee_structure":
      case "fee_announcement":
        return {
          icon: <CreditCard className="w-4 h-4 text-violet-600" />,
          label: "Fee Announcement",
          color: "bg-violet-50 text-violet-800 border-violet-200",
        };
      case "admin_announcement":
      default:
        return {
          icon: <Megaphone className="w-4 h-4 text-blue-600" />,
          label: "Admin Announcement",
          color: "bg-blue-50 text-blue-800 border-blue-200",
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-blue-100/80 shadow-xs bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Bell className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Official College Notifications & Alerts
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 ml-1">
            Real-time fee updates, payment confirmations, upcoming deadlines, and administration notices from Firebase.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200/80 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200/70">
        {[
          { id: "all", label: `All Alerts (${notifications.length})` },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "fee", label: "Fee Announcements & Deadlines" },
          { id: "payment", label: "Payment Confirmations" },
          { id: "admin", label: "Administrative Notices" },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-white/80 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">No Notifications</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! New fee circulars or due-date reminders from the administration will appear here automatically.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const meta = getCategoryMeta(notif.category);
            const isUnread = !notif.read;

            return (
              <div
                key={notif.id}
                className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all ${
                  isUnread
                    ? "border-blue-300/80 bg-white/95 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/10"
                    : "border-slate-200/80 bg-white/70 shadow-2xs opacity-85 hover:opacity-100"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="p-2.5 rounded-2xl bg-slate-100/90 shrink-0 mt-0.5">
                      {meta.icon}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.color}`}
                        >
                          {meta.label}
                        </span>

                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 animate-ping" />
                        )}

                        <span className="text-[11px] font-medium text-slate-400">
                          {notif.date}
                        </span>

                        {notif.createdBy && (
                          <span className="text-[10px] text-slate-400">
                            • Issued by {notif.createdBy}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-extrabold ${
                          isUnread ? "text-slate-900 font-black" : "text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {(notif.category === "due_date" ||
                      notif.category === "pending_reminder" ||
                      notif.category === "fee_structure" ||
                      notif.category === "fee_announcement") && (
                      <button
                        onClick={onNavigateToFees}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Fees</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isUnread ? (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        disabled={markingId === notif.id}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Mark as Read</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 px-2 py-1">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Read</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
