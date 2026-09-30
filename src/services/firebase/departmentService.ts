import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";

export interface Department {
  id: string; // e.g. "aids", "cse", "ece", "it", "mech", "civil"
  name: string;
  code: string;
  hodName?: string;
  hodEmail?: string;
  establishedYear?: string;
  totalStudents?: number;
  totalStaff?: number;
  createdAt?: string;
}

export const INITIAL_DEPARTMENTS: Department[] = [];

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const path = "departments";
    try {
      const snap = await getDocs(collection(db, "departments"));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (error) {
      console.error("Could not fetch remote departments:", error);
      return [];
    }
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    const path = `departments/${id}`;
    try {
      const snap = await getDoc(doc(db, "departments", id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as any) };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async initializeDefaultDepartments(): Promise<void> {
    // No-op: Dummy department seeding removed
  },

  async addDepartment(dept: Omit<Department, "createdAt">): Promise<void> {
    const normalizedId = dept.id.toLowerCase().trim();
    const path = `departments/${normalizedId}`;
    try {
      await setDoc(doc(db, "departments", normalizedId), {
        ...dept,
        id: normalizedId,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    const path = `departments/${id}`;
    try {
      await updateDoc(doc(db, "departments", id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  onDepartmentsChange(callback: (depts: Department[]) => void): () => void {
    const path = "departments";
    return onSnapshot(
      collection(db, "departments"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};
