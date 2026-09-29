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

export interface AccountancyUser {
  accountancyId: string;
  id?: string;
  name: string;
  email: string;
  role: "accountant";
  department?: string;
  phone?: string;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

export const accountancyService = {
  /**
   * Dedicated accountancy collection: 'accountancy'
   * Each document has: accountancyId, name, email, role, createdAt
   */
  async getAccountants(searchQuery?: string): Promise<AccountancyUser[]> {
    try {
      // 1. Fetch from dedicated 'accountancy' collection
      const snap = await getDocs(collection(db, "accountancy"));
      let list: AccountancyUser[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          accountancyId: data.accountancyId || d.id,
          name: data.name || "Bursar Officer",
          email: data.email || "",
          role: "accountant",
          department: data.department || "Finance & Accounts",
          phone: data.phone || "",
          status: data.status || "Active",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      // 2. Migration/fallback: If accountancy collection is empty, populate from users collection or defaults
      if (list.length === 0) {
        try {
          const qUsers = query(collection(db, "users"), where("role", "==", "accountant"));
          const userSnap = await getDocs(qUsers);
          const migrated: AccountancyUser[] = [];
          for (const uDoc of userSnap.docs) {
            const uData = uDoc.data();
            const accId = uData.accountancyId || uDoc.id;
            const now = new Date().toISOString();
            const record: AccountancyUser = {
              id: accId,
              accountancyId: accId,
              name: uData.name || "Finance Officer",
              email: uData.email || "",
              role: "accountant",
              department: uData.department || "Finance & Accounts",
              phone: uData.phone || "+91 98401 11223",
              status: uData.status || "Active",
              createdAt: uData.createdAt || now,
              updatedAt: now,
            };
            await setDoc(doc(db, "accountancy", accId), record);
            migrated.push(record);
          }

          if (migrated.length > 0) {
            list = migrated;
          } else {
            // Seed initial accountancy record controlled by Admin
            const now = new Date().toISOString();
            const defaultAcc: AccountancyUser = {
              id: "ACC-101",
              accountancyId: "ACC-101",
              name: "Rita Álvarez",
              email: "bursar@brightwood.edu",
              role: "accountant",
              department: "Finance & Accounts",
              phone: "+91 98401 11223",
              status: "Active",
              createdAt: now,
              updatedAt: now,
            };
            await setDoc(doc(db, "accountancy", "ACC-101"), defaultAcc);
            // Also ensure in users collection for authentication
            await setDoc(doc(db, "users", "ACC-101"), {
              uid: "ACC-101",
              ...defaultAcc,
            }, { merge: true });
            list = [defaultAcc];
          }
        } catch (migErr) {
          console.warn("Could not check/migrate existing accountancy users:", migErr);
        }
      }

      if (searchQuery) {
        const term = searchQuery.toLowerCase().trim();
        list = list.filter(
          (a) =>
            a.name.toLowerCase().includes(term) ||
            a.email.toLowerCase().includes(term) ||
            a.accountancyId.toLowerCase().includes(term)
        );
      }

      return list;
    } catch (err) {
      console.warn("AccountancyService getAccountants error:", err);
      return [];
    }
  },

  async createAccountant(data: Partial<AccountancyUser> & { password?: string }): Promise<string> {
    const accountancyId = data.accountancyId || `ACC-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();
    const payload: AccountancyUser = {
      id: accountancyId,
      accountancyId,
      name: data.name || "Accountant",
      email: data.email || `bursar.${accountancyId}@brightwood.edu`,
      role: "accountant",
      department: data.department || "Finance & Accounts",
      phone: data.phone || "",
      status: data.status || "Active",
      createdAt: now,
      updatedAt: now,
    };

    // 1. Store in dedicated 'accountancy' collection
    await setDoc(doc(db, "accountancy", accountancyId), payload);

    // 2. Also ensure in users collection so login/auth recognizes the role
    await setDoc(doc(db, "users", accountancyId), {
      uid: accountancyId,
      ...payload,
    }, { merge: true });

    // 3. If password provided or default, attempt to provision Firebase Auth account
    if (payload.email) {
      try {
        const passwordToUse = data.password || "Accountant@123";
        await createUserWithEmailAndPassword(auth, payload.email.trim().toLowerCase(), passwordToUse).catch(() => {});
      } catch (authErr) {
        // May already exist in Firebase Auth
        console.warn("Accountancy user auth provisioning notice:", authErr);
      }
    }

    return accountancyId;
  },

  async updateAccountant(accountancyId: string, data: Partial<AccountancyUser>): Promise<void> {
    const now = new Date().toISOString();
    await updateDoc(doc(db, "accountancy", accountancyId), {
      ...data,
      updatedAt: now,
    });
    // Also update users collection if present
    try {
      await updateDoc(doc(db, "users", accountancyId), {
        ...data,
        updatedAt: now,
      });
    } catch {
      // Ignore if not present
    }
  },

  async deleteAccountant(accountancyId: string): Promise<void> {
    await deleteDoc(doc(db, "accountancy", accountancyId));
    try {
      await deleteDoc(doc(db, "users", accountancyId));
    } catch {
      // Ignore
    }
  },
};
