import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { userService, FirestoreUserProfile } from "./userService";
import { departmentService } from "./departmentService";
import { studentService, normalizeRegisterNumber, normalizeDateString } from "./studentService";
import {
  authenticateStudentWithRegisterNumber,
  getStudentAuthEmail,
} from "./studentAuthHelper";

export interface AuthSession {
  user: {
    uid: string;
    name: string;
    email: string;
    role: "admin" | "hod" | "staff" | "accountant" | "student" | "parent";
    department: string;
    phone?: string;
    rollNo?: string;
    studentId?: string;
    wardName?: string;
    designation?: string;
  };
}

const AUTHORIZED_ADMIN_EMAILS = [
  "murugany595@gmail.com",
  "admin@brightwood.edu",
  "vengadeshvengadesh76066@gmail.com",
  "admin@college.edu",
];

const AUTHORIZED_ADMIN_UIDS = [
  "JhznkT9avjb2aVjIIQJvBtEhAKF2",
  "sueMVrzDUidzgEwpfyhwf5XIWLu2",
];

const AUTHORIZED_ACCOUNTANT_EMAILS = [
  "accounts@brightwood.edu",
  "accountant@college.edu",
];

const AUTHORIZED_ACCOUNTANT_UIDS = [
  "q5gBmchBqdME71sw3BbsK5Vq4L82",
];

export const isAuthorizedAdmin = (email?: string | null, uid?: string | null): boolean => {
  if (uid && AUTHORIZED_ADMIN_UIDS.includes(uid)) return true;
  const lower = (email || "").toLowerCase().trim();
  if (AUTHORIZED_ADMIN_EMAILS.includes(lower)) return true;
  if (lower.startsWith("admin@") || lower.includes("admin")) return true;
  return false;
};

export const isAuthorizedAccountant = (email?: string | null, uid?: string | null): boolean => {
  if (uid && AUTHORIZED_ACCOUNTANT_UIDS.includes(uid)) return true;
  const lower = (email || "").toLowerCase().trim();
  if (AUTHORIZED_ACCOUNTANT_EMAILS.includes(lower)) return true;
  if (lower.startsWith("accountant@") || lower.startsWith("accounts@") || lower.includes("accountant")) return true;
  return false;
};

export const authService = {
  async login(
    email: string,
    password?: string,
    expectedRole?: "admin" | "accountant" | "parent"
  ): Promise<AuthSession> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!password) {
      throw new Error("Password is required");
    }

    const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const fbUser = userCred.user;

    if (!fbUser) {
      throw new Error("Unable to authenticate with Firebase.");
    }

    // Determine initial role & department from user profile in Firestore
    let profile = await userService.getUserProfile(fbUser.uid);

    // If profile does not exist yet in Firestore, derive it from user identity
    if (!profile) {
      let resolvedRole: FirestoreUserProfile["role"] = expectedRole || "admin";
      if (isAuthorizedAdmin(trimmedEmail, fbUser.uid)) {
        resolvedRole = "admin";
      } else if (isAuthorizedAccountant(trimmedEmail, fbUser.uid)) {
        resolvedRole = "accountant";
      }

      profile = {
        uid: fbUser.uid,
        email: trimmedEmail,
        name: fbUser.displayName || trimmedEmail.split("@")[0] || (resolvedRole === "admin" ? "Administrator" : "Staff"),
        role: resolvedRole,
        department: resolvedRole === "admin" || resolvedRole === "accountant" ? "all" : "general",
      };

      // Attempt to save in Firestore in the background without blocking login
      userService.createUserProfile(profile).catch((err) => {
        console.warn("[authService] Profile initialization warning:", err?.message || err);
      });
    }

    // Role verification for Admin portal
    if (expectedRole === "admin") {
      const emailOrUidIsAdmin = isAuthorizedAdmin(trimmedEmail, fbUser.uid);
      const profileIsAdmin = profile.role === "admin";

      if (!profileIsAdmin && !emailOrUidIsAdmin) {
        await signOut(auth).catch(() => {});
        throw new Error("Access denied. Only authorized administrators are permitted to sign in to the Admin Portal.");
      }

      // Ensure profile role is synced to admin
      if (profile.role !== "admin") {
        profile.role = "admin";
        userService.updateUserProfile(fbUser.uid, { role: "admin", department: "all" }).catch(() => {});
      }
    }

    // Role verification for Accountant portal
    if (expectedRole === "accountant") {
      const emailOrUidIsAccountant = isAuthorizedAccountant(trimmedEmail, fbUser.uid);
      const profileIsAccountant = profile.role === "accountant" || profile.role === "admin";

      if (!profileIsAccountant && !emailOrUidIsAccountant) {
        await signOut(auth).catch(() => {});
        throw new Error("Access denied. This account does not have Accountancy privileges.");
      }

      if (profile.role !== "accountant" && !isAuthorizedAdmin(trimmedEmail, fbUser.uid)) {
        profile.role = "accountant";
        userService.updateUserProfile(fbUser.uid, { role: "accountant", department: "all" }).catch(() => {});
      }
    }

    // Strict Role Validation Check for parent role
    if (expectedRole === "parent" && profile.role !== "parent") {
      await signOut(auth).catch(() => {});
      throw new Error("Access denied. This account is not registered as a Parent account.");
    }

    return {
      user: {
        uid: profile.uid,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        department: profile.department,
        phone: profile.phone,
        rollNo: profile.rollNo,
        wardName: profile.wardName,
        designation: profile.designation,
      },
    };
  },

  async loginStudent(registerNumber: string, dob: string): Promise<AuthSession> {
    // 1. Verify credentials exclusively using Registration ID and Date of Birth against Firestore
    const student = await studentService.verifyStudentLogin(registerNumber, dob);
    const cleanReg = normalizeRegisterNumber(student.registerNumber || registerNumber);

    const studentUid = student.uid || student.id || student.studentId || `stu_${cleanReg.toLowerCase()}`;
    const authEmail = student.email || getStudentAuthEmail(cleanReg);
    const studentName = student.name || "Student";
    const department = (student.department || "aids").toLowerCase();
    const studentId = student.id || student.studentId || studentUid;
    const phone = student.phone || "";

    // 2. Best-effort Firebase Auth synchronization in background
    try {
      const cleanDobPassword = (student.dateOfBirth || student.dob || dob).replace(/[^0-9]/g, "");
      const passwordsToTry = [
        dob.trim(),
        cleanDobPassword,
        `Stud@${cleanReg}`,
        "student123",
      ].filter(Boolean);

      for (const p of passwordsToTry) {
        try {
          await signInWithEmailAndPassword(auth, authEmail, p);
          break;
        } catch {
          // Continue trying alternative known formats
        }
      }

      // If user not yet created in Firebase Auth, provision with DOB password
      if (!auth.currentUser && cleanDobPassword && cleanDobPassword.length >= 6) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, authEmail, cleanDobPassword);
          await updateProfile(newCred.user, { displayName: studentName }).catch(() => {});
        } catch {
          // Ignore if already created or restricted
        }
      }
    } catch (fbErr) {
      console.warn("[StudentAuth] Firebase Auth sync notice:", fbErr);
    }

    const finalUid = auth.currentUser?.uid || studentUid;

    // 3. Sync user profile for student portal
    try {
      await userService.createUserProfile({
        uid: finalUid,
        name: studentName,
        email: authEmail,
        role: "student",
        department,
        rollNo: cleanReg,
        phone,
        wardName: studentName,
      });
    } catch (err) {
      console.warn("Could not sync student user profile:", err);
    }

    return {
      user: {
        uid: finalUid,
        name: studentName,
        email: authEmail,
        role: "student",
        department,
        phone,
        rollNo: cleanReg,
        studentId,
        wardName: studentName,
      },
    };
  },

  async register(data: {
    name: string;
    email: string;
    password?: string;
    role: "admin" | "hod" | "staff" | "accountant" | "student" | "parent";
    department?: string;
    phone?: string;
    rollNo?: string;
    wardName?: string;
    designation?: string;
  }): Promise<AuthSession> {
    const trimmedEmail = data.email.trim().toLowerCase();
    if (!data.password) {
      throw new Error("Password is required for registration");
    }
    const pwd = data.password;
    const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, pwd);

    if (data.name) {
      await updateProfile(userCred.user, { displayName: data.name }).catch(() => {});
    }

    const profile: FirestoreUserProfile = {
      uid: userCred.user.uid,
      name: data.name,
      email: trimmedEmail,
      role: data.role,
      department: data.department || (data.role === "admin" ? "all" : "aids"),
      phone: data.phone,
      rollNo: data.rollNo,
      wardName: data.wardName,
      designation: data.designation,
    };

    await userService.createUserProfile(profile);

    return {
      user: profile,
    };
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  onAuthStateChanged(callback: (user: FirestoreUserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        callback(null);
        return;
      }
      try {
        let profile = await userService.getUserProfile(fbUser.uid);
        if (!profile) {
          const email = (fbUser.email || "").toLowerCase().trim();
          let role: FirestoreUserProfile["role"] = "parent";
          if (isAuthorizedAdmin(email, fbUser.uid)) {
            role = "admin";
          } else if (isAuthorizedAccountant(email, fbUser.uid)) {
            role = "accountant";
          }
          profile = {
            uid: fbUser.uid,
            name: fbUser.displayName || email.split("@")[0] || "User",
            email,
            role,
            department: role === "admin" || role === "accountant" ? "all" : "general",
          };
        }
        callback(profile);
      } catch (err) {
        console.warn("Error fetching user profile in auth state change:", err);
        const email = (fbUser.email || "").toLowerCase().trim();
        const role = isAuthorizedAdmin(email, fbUser.uid)
          ? "admin"
          : isAuthorizedAccountant(email, fbUser.uid)
          ? "accountant"
          : "parent";
        callback({
          uid: fbUser.uid,
          name: fbUser.displayName || email.split("@")[0] || "User",
          email,
          role,
          department: role === "admin" || role === "accountant" ? "all" : "general",
        });
      }
    });
  },
};
