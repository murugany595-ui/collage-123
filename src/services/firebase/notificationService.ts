import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";

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

export const INITIAL_NOTIFICATIONS: Array<Omit<NotificationItem, "id">> = [];

export const notificationService = {
  async getAllNotifications(): Promise<NotificationItem[]> {
    try {
      const snap = await getDocs(collection(db, "notifications"));
      const items: NotificationItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err) {
      console.warn("[NotificationService] Error reading notifications from Firestore:", err);
      return [];
    }
  },

  async getNotificationsForStudent(
    studentId?: string,
    department?: string,
    registerNumber?: string
  ): Promise<NotificationItem[]> {
    const all = await this.getAllNotifications();
    const currentUid = auth?.currentUser?.uid || studentId || "";
    const deptNormalized = (department || "").toLowerCase().trim();
    const regNormalized = (registerNumber || "").toUpperCase().trim();

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
      const isRead = currentUid ? readBy.includes(currentUid) : !!item.read;
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
    const currentUid = auth?.currentUser?.uid || studentId || "";
    const deptNormalized = (department || "").toLowerCase().trim();
    const regNormalized = (registerNumber || "").toUpperCase().trim();

    try {
      return onSnapshot(
        collection(db, "notifications"),
        (snapshot) => {
          const all: NotificationItem[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));

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
            const isRead = currentUid ? readBy.includes(currentUid) : !!item.read;
            return {
              ...item,
              read: isRead,
            };
          });

          callback(mapped.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
        },
        (error) => {
          console.warn("[NotificationService] Firestore snapshot error:", error);
          callback([]);
        }
      );
    } catch (e) {
      console.warn("[NotificationService] Error setting up listener:", e);
      callback([]);
      return () => {};
    }
  },

  async markAsRead(notificationId: string, studentId?: string): Promise<void> {
    const uid = auth?.currentUser?.uid || studentId || "";
    if (!uid) return;
    try {
      const docRef = doc(db, "notifications", notificationId);
      await updateDoc(docRef, {
        readBy: arrayUnion(uid),
        read: true,
      });
    } catch (err) {
      console.warn("[NotificationService] Error marking notification as read:", err);
    }
  },

  async markAllAsRead(studentId: string, notifications: NotificationItem[]): Promise<void> {
    const uid = auth?.currentUser?.uid || studentId || "";
    if (!uid) return;
    for (const notif of notifications) {
      try {
        const docRef = doc(db, "notifications", notif.id);
        await updateDoc(docRef, {
          readBy: arrayUnion(uid),
          read: true,
        });
      } catch (err) {
        // continue
      }
    }
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

    await setDoc(doc(db, "notifications", id), payload);
    return id;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, "notifications", notificationId));
  },
};
