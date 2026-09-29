import { auth } from "../../config/firebase";

export type NotificationCategory =
  | "fee_announcement"
  | "due_date"
  | "pending_reminder"
  | "payment_confirmation"
  | "fee_structure"
  | "admin_announcement";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetType: "all" | "student" | "department";
  targetStudentId?: string;
  targetRegisterNumber?: string;
  targetDepartment?: string;
  date: string;
  createdAt: string;
  read: boolean;
  readBy?: string[];
  createdBy?: string;
  priority?: "normal" | "high" | "urgent";
}

const STORAGE_KEY = "college_notifications_v1";
const BROADCAST_CHANNEL_NAME = "college_notifications_channel";

export const INITIAL_NOTIFICATIONS: Array<Omit<NotificationItem, "id">> = [
  {
    title: "Semester 5 Fee Structure & Tuition Schedule Published",
    message: "The administrative office has released the revised fee schedule for Academic Year 2025-2026. Tuition fee invoices are now reflected in your portal.",
    category: "fee_structure",
    targetType: "all",
    date: "Sep 25, 2026",
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    read: false,
    readBy: [],
    createdBy: "Administration Office",
    priority: "high",
  },
  {
    title: "Upcoming Tuition Fee Due Date Reminder",
    message: "Please ensure your tuition fee balance of Semester 5 is cleared before October 15, 2026 to avoid examination hall-ticket holds.",
    category: "due_date",
    targetType: "all",
    date: "Sep 27, 2026",
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    read: false,
    readBy: [],
    createdBy: "Bursar & Accounts",
    priority: "urgent",
  },
  {
    title: "Semester Examination Registration Fee Window Open",
    message: "Autonomous & university examination registrations are now active. Students can verify cleared dues and download payment vouchers directly.",
    category: "fee_announcement",
    targetType: "all",
    date: "Sep 28, 2026",
    createdAt: new Date().toISOString(),
    read: false,
    readBy: [],
    createdBy: "Controller of Examinations",
    priority: "normal",
  },
  {
    title: "Fee Extension & Installment Request Notice",
    message: "Students experiencing financial difficulties may submit a formal fee extension request via the AI Chatbot or contact the Accounts Department before the due date.",
    category: "admin_announcement",
    targetType: "all",
    date: "Sep 28, 2026",
    createdAt: new Date().toISOString(),
    read: false,
    readBy: [],
    createdBy: "Dean of Student Affairs",
    priority: "normal",
  },
];

function getStoredNotifications(): NotificationItem[] {
  if (typeof window === "undefined") {
    return INITIAL_NOTIFICATIONS.map((item, idx) => ({
      ...item,
      id: `NOTIF-INIT-${idx + 1}`,
    }));
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[NotificationService] Error reading stored notifications:", e);
  }

  // Initialize with INITIAL_NOTIFICATIONS
  const initial: NotificationItem[] = INITIAL_NOTIFICATIONS.map((item, idx) => ({
    ...item,
    id: `NOTIF-INIT-${idx + 1}`,
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

function saveStoredNotifications(items: NotificationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Dispatch local custom event for same-tab reactive updates
    window.dispatchEvent(new CustomEvent("college_notifications_updated", { detail: items }));
    // Broadcast for multi-tab synchronization
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: "UPDATED", timestamp: Date.now() });
      channel.close();
    }
  } catch (e) {
    console.warn("[NotificationService] Error saving notifications to storage:", e);
  }
}

export const notificationService = {
  getFallbackNotifications(
    studentId?: string,
    department?: string,
    registerNumber?: string
  ): NotificationItem[] {
    return this.getNotificationsForStudent(studentId, department, registerNumber);
  },

  async seedInitialNotificationsIfEmpty(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = INITIAL_NOTIFICATIONS.map((item, idx) => ({
          ...item,
          id: `NOTIF-INIT-${idx + 1}`,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch {}
  },

  getNotificationsForStudent(
    studentId?: string,
    department?: string,
    registerNumber?: string
  ): NotificationItem[] {
    const all = getStoredNotifications();
    const currentUid = auth?.currentUser?.uid || studentId || "";
    const deptNormalized = (department || "").toLowerCase().trim();
    const regNormalized = (registerNumber || "").toUpperCase().trim();

    // Check individual read overrides from localStorage
    let readIds = new Set<string>();
    if (currentUid && typeof window !== "undefined") {
      try {
        const key = `read_notifs_${currentUid}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          readIds = new Set<string>(JSON.parse(raw));
        }
      } catch {}
    }

    const relevant = all.filter((item) => {
      if (item.targetType === "all") return true;
      if (item.targetType === "department") {
        return item.targetDepartment && item.targetDepartment.toLowerCase().trim() === deptNormalized;
      }
      if (item.targetType === "student") {
        return (
          (studentId && item.targetStudentId === studentId) ||
          (regNormalized && item.targetRegisterNumber?.toUpperCase().trim() === regNormalized)
        );
      }
      return true;
    });

    const mapped = relevant.map((item) => {
      const readBy = item.readBy || [];
      const isRead = currentUid ? readBy.includes(currentUid) || readIds.has(item.id) : !!item.read;
      return {
        ...item,
        read: isRead,
      };
    });

    return mapped.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  subscribeToStudentNotifications(
    studentId: string,
    department: string,
    registerNumber: string,
    callback: (items: NotificationItem[]) => void
  ): () => void {
    let isSubscribed = true;

    const emit = () => {
      if (!isSubscribed) return;
      const items = this.getNotificationsForStudent(studentId, department, registerNumber);
      callback(items);
    };

    // Immediately push notifications
    emit();

    // Listen for local custom events (same-window updates)
    const handleLocalUpdate = () => {
      emit();
    };

    // Listen for storage events (cross-window storage updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || (studentId && e.key === `read_notifs_${studentId}`)) {
        emit();
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined") {
      window.addEventListener("college_notifications_updated", handleLocalUpdate);
      window.addEventListener("storage", handleStorage);

      if (typeof BroadcastChannel !== "undefined") {
        try {
          channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          channel.onmessage = () => {
            emit();
          };
        } catch {}
      }
    }

    return () => {
      isSubscribed = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("college_notifications_updated", handleLocalUpdate);
        window.removeEventListener("storage", handleStorage);
      }
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    };
  },

  async markAsRead(notificationId: string, studentId?: string): Promise<void> {
    const uid = auth?.currentUser?.uid || studentId || "";
    if (uid && typeof window !== "undefined") {
      try {
        const key = `read_notifs_${uid}`;
        const raw = localStorage.getItem(key);
        const set = new Set<string>(raw ? JSON.parse(raw) : []);
        set.add(notificationId);
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
      } catch {}
    }

    const items = getStoredNotifications();
    const updated = items.map((item) => {
      if (item.id === notificationId) {
        const readBy = new Set(item.readBy || []);
        if (uid) readBy.add(uid);
        return {
          ...item,
          read: true,
          readBy: Array.from(readBy),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveStoredNotifications(updated);
  },

  async markAllAsRead(studentId: string, notifications: NotificationItem[]): Promise<void> {
    const uid = auth?.currentUser?.uid || studentId || "";
    if (uid && typeof window !== "undefined") {
      try {
        const key = `read_notifs_${uid}`;
        const raw = localStorage.getItem(key);
        const set = new Set<string>(raw ? JSON.parse(raw) : []);
        notifications.forEach((n) => set.add(n.id));
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
      } catch {}
    }

    const notifIds = new Set(notifications.map((n) => n.id));
    const items = getStoredNotifications();
    const updated = items.map((item) => {
      if (notifIds.has(item.id)) {
        const readBy = new Set(item.readBy || []);
        if (uid) readBy.add(uid);
        return {
          ...item,
          read: true,
          readBy: Array.from(readBy),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveStoredNotifications(updated);
  },

  async createNotification(
    data: Omit<NotificationItem, "id" | "createdAt" | "read" | "readBy">
  ): Promise<string> {
    const id = `NOTIF-${Date.now()}`;
    const now = new Date().toISOString();
    const payload: NotificationItem = {
      ...data,
      id,
      createdAt: now,
      date: data.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      read: false,
      readBy: [],
      createdBy: auth?.currentUser?.email || data.createdBy || "Administration",
    };

    const items = getStoredNotifications();
    const updated = [payload, ...items];
    saveStoredNotifications(updated);
    return id;
  },
};
