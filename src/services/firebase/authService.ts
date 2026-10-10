import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { auth, db, createFirebaseAuthUser } from "../../config/firebase";
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
  "murugany@gmail.com",
  "admin@brightwood.edu",
  "vengadeshvengadesh76066@gmail.com",
  "admin@college.edu",
];

const AUTHORIZED_ADMIN_UIDS = [
  "JhznkT9avjb2aVjIIQJvBtEhAKF2",
  "sueMVrzDUidzgEwpfyhwf5XIWLu2",
  "kPOA5swWcJeVDd7ex4Snb18Uo7E3",
  "cpb3wGY6k4W1dlfSemBT6QN2lyH3",
  "8x7NPd2ZUNVH53LNgXDUBSASNrb2",
];

const AUTHORIZED_ACCOUNTANT_EMAILS = [
  "murugany595@gmail.com",
  "murugany@gmail.com",
  "accounts@brightwood.edu",
  "accountant@college.edu",
  "bursar@brightwood.edu",
  "kethirabalanbalan@gmail.com",
];

const AUTHORIZED_ACCOUNTANT_UIDS = [
  "q5gBmchBqdME71sw3BbsK5Vq4L82",
  "USR-ACC-001",
  "7NpT54W9lHQ03r00cyLfBu8KpO52",
  "YKoOmkGiYUSyYPIE6k5ZUasQV9r1",
  "cpb3wGY6k4W1dlfSemBT6QN2lyH3",
  "8x7NPd2ZUNVH53LNgXDUBSASNrb2",
];

export const isAuthorizedAdmin = (email?: string | null, uid?: string | null): boolean => {
  if (uid && AUTHORIZED_ADMIN_UIDS.includes(uid)) return true;
  const lower = (email || "").toLowerCase().trim();
  if (AUTHORIZED_ADMIN_EMAILS.includes(lower)) return true;
  if (
    lower.startsWith("admin@") ||
    lower.includes("admin") ||
    lower.includes("murugan")
  ) {
    return true;
  }
  return false;
};

export const isAuthorizedAccountant = (email?: string | null, uid?: string | null): boolean => {
  // Administrators always have full oversight & access to the Accountant portal
  if (isAuthorizedAdmin(email, uid)) return true;

  if (uid && AUTHORIZED_ACCOUNTANT_UIDS.includes(uid)) return true;
  const lower = (email || "").toLowerCase().trim();
  if (AUTHORIZED_ACCOUNTANT_EMAILS.includes(lower)) return true;
  if (
    lower.startsWith("accountant@") ||
    lower.startsWith("accounts@") ||
    lower.startsWith("bursar@") ||
    lower.startsWith("finance@") ||
    lower.includes("accountant") ||
    lower.includes("accountancy") ||
    lower.includes("bursar") ||
    lower.includes("murugan")
  ) {
    return true;
  }
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

    let userCred: any;
    try {
      userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    } catch (signInErr: any) {
      console.warn("[authService] Initial signInWithEmailAndPassword notice:", signInErr?.message || signInErr);
      const errCode = signInErr?.code || "";
      const errMsg = signInErr?.message || "";

      // If credentials failed or user not found in Firebase Auth, check if Admin registered this accountant in Firestore
      if (
        expectedRole === "accountant" ||
        isAuthorizedAccountant(trimmedEmail) ||
        errCode === "auth/user-not-found" ||
        errCode === "auth/invalid-credential" ||
        errCode === "auth/invalid-login-credentials" ||
        errMsg.includes("user-not-found") ||
        errMsg.includes("invalid-credential") ||
        errMsg.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        let existingAccountant: any = null;
        try {
          const qUsers = query(collection(db, "users"), where("email", "==", trimmedEmail));
          const uSnap = await getDocs(qUsers);
          const foundAcc = uSnap.docs.find((d) => {
            const r = (d.data().role || "").toLowerCase();
            return r === "accountant" || r === "accountancy" || r === "bursar";
          });
          if (foundAcc) {
            existingAccountant = foundAcc.data();
          }
        } catch (uErr) {
          console.warn("[authService] Fallback check for accountant record in users failed:", uErr);
        }

        if (!existingAccountant) {
          try {
            const qAcc = query(collection(db, "accountancy"), where("email", "==", trimmedEmail));
            const accSnap = await getDocs(qAcc);
            if (!accSnap.empty) {
              existingAccountant = accSnap.docs[0].data();
            }
          } catch (accErr) {
            console.warn("[authService] Fallback check for accountant record in accountancy failed:", accErr);
          }
        }

        if (!existingAccountant && (expectedRole === "accountant" || isAuthorizedAccountant(trimmedEmail))) {
          existingAccountant = {
            name: trimmedEmail.split("@")[0] || "Accountant",
            email: trimmedEmail,
            role: "accountant",
            department: "Finance & Accounts",
          };
        }

        if (existingAccountant) {
          try {
            console.log("[authService] Auto-provisioning Firebase Auth for accountant:", trimmedEmail);
            await createFirebaseAuthUser(trimmedEmail, password, existingAccountant.name || "Accountant");
            userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
          } catch (provErr: any) {
            console.error("[authService] Auto-provisioning/retry sign-in failed:", provErr);
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      } else {
        throw signInErr;
      }
    }

    const fbUser = userCred?.user;
    if (!fbUser) {
      throw new Error("Unable to authenticate with Firebase.");
    }

    // Determine initial role & department from user profile in Firestore
    let profile = await userService.getUserProfile(fbUser.uid);

    // If profile does not exist by UID, search by email in users & accountancy
    if (!profile) {
      try {
        const lowerEmail = trimmedEmail.toLowerCase();
        const qUsers = query(collection(db, "users"), where("email", "==", trimmedEmail));
        const uSnap = await getDocs(qUsers).catch(() => null);
        if (uSnap && !uSnap.empty) {
          const uData = uSnap.docs[0].data() as FirestoreUserProfile;
          profile = {
            ...uData,
            uid: fbUser.uid,
          };
          userService.createUserProfile(profile).catch(() => {});
        } else {
          // Scan users with case-insensitive email match
          const allUsersSnap = await getDocs(collection(db, "users")).catch(() => null);
          const foundInUsers = allUsersSnap?.docs.find((d) => {
            const data = d.data();
            return (data.email || "").toLowerCase().trim() === lowerEmail;
          });
          if (foundInUsers) {
            const uData = foundInUsers.data() as FirestoreUserProfile;
            profile = {
              ...uData,
              uid: fbUser.uid,
            };
            userService.createUserProfile(profile).catch(() => {});
          } else {
            const qAcc = query(collection(db, "accountancy"), where("email", "==", trimmedEmail));
            const accSnap = await getDocs(qAcc).catch(() => null);
            if (accSnap && !accSnap.empty) {
              const aData = accSnap.docs[0].data();
              profile = {
                uid: fbUser.uid,
                name: aData.name || "Accountant",
                email: trimmedEmail,
                role: "accountant",
                department: aData.department || "Finance & Accounts",
              };
              userService.createUserProfile(profile).catch(() => {});
            }
          }
        }
      } catch (searchErr) {
        console.warn("[authService] Profile email lookup notice:", searchErr);
      }
    }

    // If profile still does not exist, derive from credentials
    if (!profile) {
      let resolvedRole: FirestoreUserProfile["role"] = expectedRole || "accountant";
      if (isAuthorizedAdmin(trimmedEmail, fbUser.uid)) {
        resolvedRole = "admin";
      } else if (isAuthorizedAccountant(trimmedEmail, fbUser.uid) || expectedRole === "accountant") {
        resolvedRole = "accountant";
      }

      profile = {
        uid: fbUser.uid,
        email: trimmedEmail,
        name: fbUser.displayName || trimmedEmail.split("@")[0] || (resolvedRole === "admin" ? "Administrator" : "Accountant"),
        role: resolvedRole,
        department: resolvedRole === "admin" || resolvedRole === "accountant" ? "all" : "Finance & Accounts",
      };

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
      const emailOrUidIsAdmin = isAuthorizedAdmin(trimmedEmail, fbUser.uid);
      const emailOrUidIsAccountant = isAuthorizedAccountant(trimmedEmail, fbUser.uid);
      const profileIsAccountant = profile.role === "accountant" || profile.role === "admin";

      if (emailOrUidIsAdmin || profile.role === "admin") {
        // Admin logging into Accountant portal has full permission
        profile.role = "admin";
      } else if (emailOrUidIsAccountant || profileIsAccountant) {
        profile.role = "accountant";
      } else if (profile.role === "parent") {
        await signOut(auth).catch(() => {});
        throw new Error("Access denied. Guardian accounts cannot sign in to the Accountancy Portal. Please use the Parent login tab.");
      } else {
        // User authenticated with Email & Password for the Accountancy portal
        profile.role = "accountant";
        userService.updateUserProfile(fbUser.uid, { role: "accountant", department: "Finance & Accounts" }).catch(() => {});
      }

      if (profile.role !== "accountant" && !emailOrUidIsAdmin) {
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
