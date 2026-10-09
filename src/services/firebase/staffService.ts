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
    try {
      const staffMap = new Map<string, Staff>();

      // 1. Fetch from canonical department subcollections
      const depts = await departmentService.getDepartments().catch(() => []);
      const staffPromises = depts.map((d) => this.getStaffByDepartment(d.id).catch(() => []));
      const results = await Promise.all(staffPromises);
      results.flat().forEach((st) => {
        staffMap.set(st.id || (st as any).staff_id, st);
      });

      // 2. Also check top-level staffs collection if available
      try {
        const topSnap = await getDocs(collection(db, "staffs"));
        topSnap.docs.forEach((d) => {
          const data = d.data();
          const salary = Number(data.monthly_salary !== undefined ? data.monthly_salary : (data.salary || 0));
          const sObj: Staff = {
            id: d.id,
            staff_id: data.staff_id || d.id,
            employeeId: data.staff_id || data.employeeId || d.id,
            name: data.staff_name || data.name || "Staff Member",
            staff_name: data.staff_name || data.name || "Staff Member",
            department: data.department || "General",
            designation: data.designation || "Faculty",
            monthly_salary: salary,
            salary: salary,
            joining_date: data.joining_date || data.joiningDate || "",
            joiningDate: data.joining_date || data.joiningDate || "",
            status: data.status || "Active",
            email: data.email || `${d.id.toLowerCase()}@college.edu`,
            ...data,
          } as Staff;
          if (!staffMap.has(d.id)) {
            staffMap.set(d.id, sObj);
          }
        });
      } catch {}

      let list = Array.from(staffMap.values());
      if (currentRole && currentRole !== "admin" && userDept && userDept !== "all") {
        list = list.filter((s) => s.department?.toLowerCase() === userDept.toLowerCase());
      }
      return list;
    } catch (error) {
      console.warn("Could not fetch remote staff from Firestore:", error);
      return [];
    }
  },

  subscribeStaff(callback: (staffList: Staff[]) => void): () => void {
    const colRef = collection(db, "staffs");
    return onSnapshot(
      colRef,
      (snap) => {
        const list: Staff[] = snap.docs.map((d) => {
          const data = d.data();
          const salary = Number(data.monthly_salary !== undefined ? data.monthly_salary : (data.salary || 0));
          return {
            id: d.id,
            staff_id: data.staff_id || d.id,
            employeeId: data.staff_id || data.employeeId || d.id,
            name: data.staff_name || data.name || "Staff Member",
            staff_name: data.staff_name || data.name || "Staff Member",
            department: data.department || "General",
            designation: data.designation || "Faculty",
            monthly_salary: salary,
            salary: salary,
            joining_date: data.joining_date || data.joiningDate || "",
            joiningDate: data.joining_date || data.joiningDate || "",
            status: data.status || "Active",
            email: data.email || `${d.id.toLowerCase()}@college.edu`,
            ...data,
          } as Staff;
        });
        callback(list);
      },
      (error) => {
        console.warn("Staff subscription error:", error);
      }
    );
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
