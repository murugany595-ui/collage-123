import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { handleFirestoreError, OperationType } from "./firestoreErrors";

export interface FirestoreUserProfile {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "hod" | "staff" | "accountant" | "student" | "parent";
  department: string;
  phone?: string;
  rollNo?: string;
  wardName?: string;
  designation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const userService = {
  async getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return null;
    }
    const cleanUid = uid.trim();
    try {
      const snap = await getDoc(doc(db, "users", cleanUid));
      if (!snap || !snap.exists()) {
        return null;
      }
      const data = snap.data() as FirestoreUserProfile;
      return {
        ...data,
        uid: cleanUid,
      };
    } catch (error: any) {
      console.warn(`[userService] Safe profile lookup warning for uid: ${cleanUid}:`, error?.message || error);
      return null;
    }
  },

  async createUserProfile(profile: FirestoreUserProfile): Promise<void> {
    if (!profile || !profile.uid || typeof profile.uid !== "string" || !profile.uid.trim()) {
      return;
    }
    const cleanUid = profile.uid.trim();
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, "users", cleanUid), {
        ...profile,
        uid: cleanUid,
        createdAt: profile.createdAt || now,
        updatedAt: now,
      }, { merge: true });

      // If user is admin, maintain admins/{uid} with required adminId
      if (profile.role === "admin") {
        await setDoc(
          doc(db, "admins", cleanUid),
          {
            adminId: cleanUid,
            uid: cleanUid,
            email: profile.email,
            name: profile.name,
            role: "admin",
            createdAt: profile.createdAt || now,
            updatedAt: now,
          },
          { merge: true }
        ).catch((adminErr) => {
          console.warn("[userService] Admin mirror write notice:", adminErr?.message || adminErr);
        });
      }
    } catch (error: any) {
      console.warn(`[userService] Profile write notice for uid: ${cleanUid}:`, error?.message || error);
    }
  },

  async updateUserProfile(uid: string, updates: Partial<FirestoreUserProfile>): Promise<void> {
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return;
    }
    const cleanUid = uid.trim();
    const path = `users/${cleanUid}`;
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "users", cleanUid), {
        ...updates,
        updatedAt: now,
      });

      if (updates.role === "admin") {
        await setDoc(
          doc(db, "admins", cleanUid),
          {
            uid: cleanUid,
            role: "admin",
            updatedAt: now,
          },
          { merge: true }
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getAllUsers(): Promise<FirestoreUserProfile[]> {
    const path = "users";
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async deleteUser(uid: string): Promise<void> {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "admins", uid)).catch(() => {});
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  },
};
