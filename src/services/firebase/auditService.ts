import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { userService } from "./userService";

export interface AuditLogEntry {
  id?: string;
  logId?: string;
  userId: string;
  role: string;
  timestamp: string; // ISO 8601 string
  action: string;
  affectedDocumentId: string;
  userEmail?: string;
  collectionName?: string;
  details?: string;
  previousValue?: any;
  newValue?: any;
}

export interface LogAuditOptions {
  userId?: string;
  userEmail?: string;
  role?: string;
  action: string;
  affectedDocumentId: string;
  collectionName?: string;
  details?: string;
  previousValue?: any;
  newValue?: any;
}

/**
 * Utility function to log sensitive administrative actions like fee setting changes or expense management.
 * Guarantees capture of 'userId', 'role', 'timestamp', 'action', and 'affectedDocumentId'.
 */
export async function logAuditEvent(options: LogAuditOptions): Promise<string> {
  const currentAuthUser = auth?.currentUser;
  const resolvedUserId = options.userId || currentAuthUser?.uid || "system";
  const resolvedEmail = options.userEmail || currentAuthUser?.email || "system@college.edu";

  // Determine user role if not explicitly passed
  let resolvedRole = options.role;
  if (!resolvedRole) {
    if (currentAuthUser?.uid) {
      try {
        const profile = await userService.getUserProfile(currentAuthUser.uid);
        resolvedRole = profile?.role || "admin";
      } catch {
        resolvedRole = "admin";
      }
    } else {
      resolvedRole = "system";
    }
  }

  const timestamp = new Date().toISOString();
  const logId = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const payload: AuditLogEntry = {
    id: logId,
    logId,
    userId: resolvedUserId,
    userEmail: resolvedEmail,
    role: resolvedRole,
    timestamp,
    action: options.action,
    affectedDocumentId: options.affectedDocumentId,
    collectionName: options.collectionName || "",
    details: options.details || "",
    previousValue:
      options.previousValue !== undefined
        ? typeof options.previousValue === "object"
          ? JSON.stringify(options.previousValue)
          : String(options.previousValue)
        : null,
    newValue:
      options.newValue !== undefined
        ? typeof options.newValue === "object"
          ? JSON.stringify(options.newValue)
          : String(options.newValue)
        : null,
  };

  try {
    await setDoc(doc(db, "auditLogs", logId), payload);
    return logId;
  } catch (error: any) {
    console.error("[AuditService] Firestore write failed:", error?.message || error);
    return logId;
  }
}

export const auditService = {
  log: logAuditEvent,

  async getRecentLogs(maxCount: number = 50): Promise<AuditLogEntry[]> {
    try {
      const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(maxCount));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as AuditLogEntry[];
    } catch (error: any) {
      console.error("[AuditService] Error fetching audit logs:", error?.message || error);
      return [];
    }
  },

  subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void, maxCount: number = 50) {
    let unsubscribeSnapshot = () => {};
    try {
      const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(maxCount));
      unsubscribeSnapshot = onSnapshot(
        q,
        (snap) => {
          const remoteLogs = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as AuditLogEntry[];
          callback(remoteLogs);
        },
        (error) => {
          console.error("[AuditService] Snapshot listener error:", error?.message || error);
          callback([]);
        }
      );
    } catch (err: any) {
      console.error("[AuditService] Snapshot init error:", err?.message || err);
      callback([]);
    }

    return () => {
      unsubscribeSnapshot();
    };
  },
};
