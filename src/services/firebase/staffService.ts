import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { departmentService } from "./departmentService";

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  employeeId: string;
  joiningDate?: string;
  status: "active" | "on-leave" | "resigned";
  salary?: number;
  qualification?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const staffService = {
  async getStaffByDepartment(departmentId: string): Promise<Staff[]> {
    const path = `departments/${departmentId}/staff`;
    try {
      const snap = await getDocs(collection(db, "departments", departmentId, "staff"));
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        department: departmentId,
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getAllStaff(currentRole?: string, userDept?: string): Promise<Staff[]> {
    if (currentRole && currentRole !== "admin" && userDept && userDept !== "all") {
      return this.getStaffByDepartment(userDept);
    }

    try {
      const depts = await departmentService.getDepartments();
      const staffPromises = depts.map((d) => this.getStaffByDepartment(d.id).catch(() => []));
      const results = await Promise.all(staffPromises);
      return results.flat();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "staff");
    }
  },

  async getStaffById(departmentId: string, staffId: string): Promise<Staff | null> {
    const path = `departments/${departmentId}/staff/${staffId}`;
    try {
      const snap = await getDoc(doc(db, "departments", departmentId, "staff", staffId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as any), department: departmentId };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async createStaff(data: Omit<Staff, "id"> & { id?: string }): Promise<string> {
    const deptId = (data.department || "aids").toLowerCase().trim();
    const id = data.id || `STF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const path = `departments/${deptId}/staff/${id}`;
    try {
      const now = new Date().toISOString();
      const payload: Staff = {
        ...data,
        id,
        department: deptId,
        status: data.status || "active",
        createdAt: data.createdAt || now,
        updatedAt: now,
      };
      await setDoc(doc(db, "departments", deptId, "staff", id), payload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateStaff(departmentId: string, staffId: string, updates: Partial<Staff>): Promise<void> {
    const path = `departments/${departmentId}/staff/${staffId}`;
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "departments", departmentId, "staff", staffId), {
        ...updates,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteStaff(departmentId: string, staffId: string): Promise<void> {
    const path = `departments/${departmentId}/staff/${staffId}`;
    try {
      await deleteDoc(doc(db, "departments", departmentId, "staff", staffId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  onDepartmentStaffChange(departmentId: string, callback: (staff: Staff[]) => void): () => void {
    const path = `departments/${departmentId}/staff`;
    return onSnapshot(
      collection(db, "departments", departmentId, "staff"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          department: departmentId,
        }));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};
