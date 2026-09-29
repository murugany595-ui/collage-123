import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";

export type RequestCategory =
  | "fee_extension"
  | "leave"
  | "attendance_correction"
  | "payment_issue"
  | "general";

export interface StudentRequest {
  id: string;
  category: RequestCategory;
  userId: string;
  userRole?: string;
  userEmail?: string;
  studentId?: string;
  studentName?: string;
  registerNumber?: string;
  department?: string;
  year?: string;

  // Fee Extension specific
  currentFeeDueDate?: string;
  requestedExtensionDate?: string;
  reason?: string;
  remarks?: string;
  supportingDocName?: string;
  signature?: string;
  approvedExtensionDate?: string;

  // Leave specific
  leaveType?: string;
  fromDate?: string;
  toDate?: string;

  // Attendance correction specific
  attendanceDate?: string;
  currentAttendanceStatus?: string;
  requestedCorrection?: string;

  // Payment issue specific
  paymentReference?: string;
  paymentDate?: string;
  amount?: number;
  issueDescription?: string;

  // General request specific
  requestType?: string;
  description?: string;

  // Administrative review
  status: "Pending" | "Approved" | "Rejected" | "Resolved" | "Under Review";
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const requestService = {
  async createRequest(data: Omit<StudentRequest, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<string> {
    const id = data.id || `REQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const now = new Date().toISOString();
    const currentUid = auth.currentUser?.uid;
    const payload: StudentRequest = {
      ...data,
      userId: data.userId || currentUid || "demo-uid",
      id,
      status: data.status || "Pending",
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, "requests", id), payload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${id}`);
    }
  },

  async getAllRequests(userRole?: string, userId?: string): Promise<StudentRequest[]> {
    try {
      const snap = await getDocs(collection(db, "requests"));
      let items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as StudentRequest[];

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // If student or parent, restrict strictly to their requests
      if (userRole === "student" || userRole === "parent") {
        if (userId) {
          items = items.filter(
            (r) => r.userId === userId || r.studentId === userId
          );
        }
      }

      return items;
    } catch (error) {
      console.warn("Could not fetch requests from Firestore:", error);
      return [];
    }
  },

  async getUserRequests(userId: string): Promise<StudentRequest[]> {
    try {
      const snap = await getDocs(collection(db, "requests"));
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) })) as StudentRequest[];

      return items
        .filter((r) => r.userId === userId || r.studentId === userId)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (error) {
      console.warn("Could not fetch user requests from Firestore:", error);
      return [];
    }
  },

  async getFeeExtensionStatus(userId: string, registerNumber?: string): Promise<StudentRequest | null> {
    try {
      const all = await this.getUserRequests(userId);
      const feeExts = all.filter(
        (r) =>
          r.category === "fee_extension" &&
          (r.userId === userId || (registerNumber && r.registerNumber === registerNumber))
      );
      return feeExts.length > 0 ? feeExts[0] : null;
    } catch {
      return null;
    }
  },

  async updateRequestStatus(
    id: string,
    updates: {
      status: StudentRequest["status"];
      adminRemarks?: string;
      approvedExtensionDate?: string;
      reviewedBy?: string;
    }
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "requests", id), {
        ...updates,
        reviewedAt: now,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  },

  async deleteRequest(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "requests", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `requests/${id}`);
    }
  },
};
