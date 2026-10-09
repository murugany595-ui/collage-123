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
    name: "Artificial Intelligence & Data Science",
    code: "AI&DS",
    hodName: "Dr. K. Senthil Kumar",
    hodEmail: "hod.aids@ourcollege.edu",
    establishedYear: "2021",
    totalStudents: 120,
    totalStaff: 14,
  },
  {
    id: "cse",
    name: "Computer Science & Engineering",
    code: "CSE",
    hodName: "Dr. R. Meenakshi",
    hodEmail: "hod.cse@ourcollege.edu",
    establishedYear: "2010",
    totalStudents: 180,
    totalStaff: 18,
  },
  {
    id: "ece",
    name: "Electronics & Communication Engineering",
    code: "ECE",
    hodName: "Dr. S. Karthikeyan",
    hodEmail: "hod.ece@ourcollege.edu",
    establishedYear: "2012",
    totalStudents: 140,
    totalStaff: 15,
  },
  {
    id: "mech",
    name: "Mechanical Engineering",
    code: "MECH",
    hodName: "Dr. P. Rajendran",
    hodEmail: "hod.mech@ourcollege.edu",
    establishedYear: "2010",
    totalStudents: 110,
    totalStaff: 12,
  },
];

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const path = "departments";
    try {
      const snap = await getDocs(collection(db, "departments"));
      if (snap.empty) {
        // Initialize default departments including AI&DS
        try {
          await Promise.all(
            INITIAL_DEPARTMENTS.map((dept) =>
              setDoc(
                doc(db, "departments", dept.id),
                {
                  ...dept,
                  createdAt: new Date().toISOString(),
                },
                { merge: true }
              )
            )
          );
        } catch (initErr) {
          console.warn("Could not auto-seed departments in Firestore:", initErr);
        }
        return INITIAL_DEPARTMENTS;
      }

      const depts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const hasAids = depts.some(
        (d) =>
          d.id?.toLowerCase() === "aids" ||
          d.code?.toUpperCase() === "AI&DS" ||
          d.name?.toLowerCase().includes("data science")
      );

      if (!hasAids) {
        const aidsDept = INITIAL_DEPARTMENTS[0];
        try {
          await setDoc(
            doc(db, "departments", "aids"),
            {
              ...aidsDept,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("Could not save AI&DS department to Firestore:", e);
        }
        depts.unshift(aidsDept);
      }

      return depts;
    } catch (error) {
      console.error("Could not fetch remote departments:", error);
      return INITIAL_DEPARTMENTS;
    }
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    const path = `departments/${id}`;
    try {
      const snap = await getDoc(doc(db, "departments", id));
      if (!snap.exists()) {
        const fallback = INITIAL_DEPARTMENTS.find((d) => d.id === id);
        return fallback || null;
      }
      return { id: snap.id, ...(snap.data() as any) };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async initializeDefaultDepartments(): Promise<void> {
    try {
      await Promise.all(
        INITIAL_DEPARTMENTS.map((dept) =>
          setDoc(
            doc(db, "departments", dept.id),
            {
              ...dept,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          )
        )
      );
    } catch (error) {
      console.warn("Failed to initialize default departments:", error);
    }
  },

  async addDepartment(dept: Omit<Department, "createdAt">): Promise<void> {
    const normalizedId = (dept.id || dept.code || "dept")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .trim();
    const path = `departments/${normalizedId}`;
    try {
      await setDoc(
        doc(db, "departments", normalizedId),
        {
          ...dept,
          id: normalizedId,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
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

  async deleteDepartment(id: string): Promise<void> {
    const path = `departments/${id}`;
    try {
      await deleteDoc(doc(db, "departments", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  onDepartmentsChange(callback: (depts: Department[]) => void): () => void {
    const path = "departments";
    return onSnapshot(
      collection(db, "departments"),
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_DEPARTMENTS);
          return;
        }
        const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};
