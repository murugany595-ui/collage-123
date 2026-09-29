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
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { studentService } from "./studentService";

export interface ParentRecord {
  parentId: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  studentId: string;
  linkedStudentId: string;
  studentRegisterNumber: string;
  studentName?: string;
  department?: string;
  address?: string;
  role: "parent";
  status?: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

export const parentService = {
  /**
   * Dedicated parents collection: 'parents'
   * Each document contains: parentId, name, email, studentId/linkedStudentId, studentRegisterNumber, role, createdAt
   */
  async getParents(searchQuery?: string): Promise<ParentRecord[]> {
    try {
      // 1. Fetch directly from dedicated 'parents' collection
      const snap = await getDocs(collection(db, "parents"));
      let list: ParentRecord[] = snap.docs.map((d) => {
        const data = d.data();
        const pId = data.parentId || d.id;
        const stuId = data.linkedStudentId || data.studentId || "";
        return {
          id: pId,
          parentId: pId,
          name: data.name || "Parent Guardian",
          email: data.email || "",
          phone: data.phone || "",
          studentId: stuId,
          linkedStudentId: stuId,
          studentRegisterNumber: data.studentRegisterNumber || "",
          studentName: data.studentName || data.name,
          department: data.department || "",
          address: data.address || "",
          role: "parent",
          status: data.status || "Active",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      // 2. Fallback / migration if parents collection is empty:
      if (list.length === 0) {
        // Check users collection where role == 'parent'
        const qUsers = query(collection(db, "users"), where("role", "==", "parent"));
        const userSnap = await getDocs(qUsers);
        const migrated: ParentRecord[] = [];

        for (const uDoc of userSnap.docs) {
          const uData = uDoc.data();
          const pId = uData.parentId || uDoc.id;
          const sId = uData.studentId || uData.linkedStudentId || "";
          const pRecord: ParentRecord = {
            id: pId,
            parentId: pId,
            name: uData.name || "Parent",
            email: uData.email || "",
            phone: uData.phone || "",
            studentId: sId,
            linkedStudentId: sId,
            studentRegisterNumber: uData.rollNo || uData.studentRegisterNumber || "",
            studentName: uData.wardName || uData.studentName || "",
            department: uData.department || "",
            address: uData.address || "",
            role: "parent",
            status: "Active",
            createdAt: uData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(doc(db, "parents", pId), pRecord);
          migrated.push(pRecord);
        }

        if (migrated.length > 0) {
          list = migrated;
        } else {
          // Sync from department students
          const students = await studentService.getAllStudents();
          for (const s of students.filter((st) => st.parentName || st.parentEmail)) {
            const pId = s.parentId || `PAR-${s.id}`;
            const pEmail = s.parentEmail || `parent.${s.registerNumber.toLowerCase()}@brightwood.edu`;
            const parentDoc: ParentRecord = {
              id: pId,
              parentId: pId,
              name: s.parentName || `Guardian of ${s.name}`,
              email: pEmail,
              phone: s.parentPhone || s.phone || "+91 98401 23456",
              studentId: s.id,
              linkedStudentId: s.id,
              studentRegisterNumber: s.registerNumber,
              studentName: s.name,
              department: s.department,
              address: s.address || "",
              role: "parent",
              status: "Active",
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(doc(db, "parents", pId), parentDoc);
              await setDoc(doc(db, "users", pId), { uid: pId, ...parentDoc }, { merge: true });
              list.push(parentDoc);
            } catch (e) {
              list.push(parentDoc);
            }
          }
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.studentName?.toLowerCase().includes(q) ||
            p.studentRegisterNumber?.toLowerCase().includes(q) ||
            p.phone?.includes(q)
        );
      }

      return list;
    } catch (error) {
      console.warn("ParentService getParents error:", error);
      return [];
    }
  },

  async getParentByStudentId(studentId: string): Promise<ParentRecord | null> {
    try {
      const q = query(collection(db, "parents"), where("linkedStudentId", "==", studentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...(d.data() as any) } as ParentRecord;
      }
      return null;
    } catch (e) {
      console.warn("Error fetching parent by studentId:", e);
      return null;
    }
  },

  async createParent(data: Partial<ParentRecord> & { password?: string }): Promise<string> {
    const parentId = data.parentId || `PAR-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const payload: ParentRecord = {
      id: parentId,
      parentId,
      name: data.name || "Parent Guardian",
      email: data.email || `parent.${parentId}@brightwood.edu`,
      phone: data.phone || "",
      studentId: data.linkedStudentId || data.studentId || "",
      linkedStudentId: data.linkedStudentId || data.studentId || "",
      studentRegisterNumber: data.studentRegisterNumber || "",
      studentName: data.studentName || "",
      department: data.department || "",
      address: data.address || "",
      role: "parent",
      status: data.status || "Active",
      createdAt: now,
      updatedAt: now,
    };

    // 1. Write to dedicated parents collection
    await setDoc(doc(db, "parents", parentId), payload);

    // 2. Also register in users collection for authentication
    await setDoc(doc(db, "users", parentId), {
      uid: parentId,
      ...payload,
      wardName: payload.studentName,
      rollNo: payload.studentRegisterNumber,
    }, { merge: true });

    // 3. If password provided or default, attempt Firebase Auth user creation
    if (payload.email) {
      try {
        const pwd = data.password || "Parent@123";
        await createUserWithEmailAndPassword(auth, payload.email.trim().toLowerCase(), pwd).catch(() => {});
      } catch (authErr) {
        console.warn("Parent account auth provision note:", authErr);
      }
    }

    return parentId;
  },

  async updateParent(parentId: string, updates: Partial<ParentRecord>): Promise<void> {
    const now = new Date().toISOString();
    await updateDoc(doc(db, "parents", parentId), {
      ...updates,
      updatedAt: now,
    });
    try {
      await updateDoc(doc(db, "users", parentId), {
        ...updates,
        updatedAt: now,
      });
    } catch {
      // Ignore if not present in users
    }
  },

  async deleteParent(parentId: string): Promise<void> {
    await deleteDoc(doc(db, "parents", parentId));
    try {
      await deleteDoc(doc(db, "users", parentId));
    } catch {
      // Ignore
    }
  },
};
