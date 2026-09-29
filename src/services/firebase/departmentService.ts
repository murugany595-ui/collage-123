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

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "aids",
    name: "Artificial Intelligence and Data Science",
    code: "AIDS",
    hodName: "Dr. K. Senthil Kumar",
    hodEmail: "hod.aids@brightwood.edu",
    establishedYear: "2021",
  },
  {
    id: "cse",
    name: "Computer Science and Engineering",
    code: "CSE",
    hodName: "Dr. Priya Sundaram",
    hodEmail: "hod.cse@brightwood.edu",
    establishedYear: "2008",
  },
  {
    id: "ece",
    name: "Electronics and Communication Engineering",
    code: "ECE",
    hodName: "Dr. R. Venkatraman",
    hodEmail: "hod.ece@brightwood.edu",
    establishedYear: "2009",
  },
  {
    id: "it",
    name: "Information Technology",
    code: "IT",
    hodName: "Dr. M. Deepa",
    hodEmail: "hod.it@brightwood.edu",
    establishedYear: "2010",
  },
  {
    id: "mech",
    name: "Mechanical Engineering",
    code: "MECH",
    hodName: "Dr. A. Nagarajan",
    hodEmail: "hod.mech@brightwood.edu",
    establishedYear: "2008",
  },
  {
    id: "civil",
    name: "Civil Engineering",
    code: "CIVIL",
    hodName: "Dr. S. Ramesh",
    hodEmail: "hod.civil@brightwood.edu",
    establishedYear: "2011",
  },
];

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const path = "departments";
    try {
      const snap = await getDocs(collection(db, "departments"));
      if (snap.empty) {
        // Initialize default 6 departments directly in Firestore if authenticated
        if (auth.currentUser) {
          this.initializeDefaultDepartments().catch(() => {});
        }
        return INITIAL_DEPARTMENTS;
      }
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (error) {
      console.warn("Could not fetch remote departments, falling back to INITIAL_DEPARTMENTS:", error);
      return INITIAL_DEPARTMENTS;
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
    }
  },

  async initializeDefaultDepartments(): Promise<void> {
    for (const dept of INITIAL_DEPARTMENTS) {
      const path = `departments/${dept.id}`;
      try {
        await setDoc(doc(db, "departments", dept.id), {
          ...dept,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
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
