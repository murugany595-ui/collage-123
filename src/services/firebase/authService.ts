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

export const authService = {
  async login(
    email: string,
    password?: string,
    expectedRole?: "admin" | "accountant" | "parent"
  ): Promise<AuthSession> {
    const trimmedEmail = email.trim().toLowerCase();
    const pwd = password || "College@123";

    let fbUser: FirebaseUser | null = null;
    try {
      const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, pwd);
      fbUser = userCred.user;
    } catch (authError: any) {
      // If user not found, bootstrap the Firebase Auth account for system/admin credentials
      if (
        authError.code === "auth/user-not-found" ||
        authError.code === "auth/invalid-credential"
      ) {
        try {
          const createCred = await createUserWithEmailAndPassword(auth, trimmedEmail, pwd);
          fbUser = createCred.user;
        } catch (createErr) {
          // If creation fails (e.g. wrong password on existing account), re-throw original
          throw authError;
        }
      } else {
        throw authError;
      }
    }

    if (!fbUser) {
      throw new Error("Unable to authenticate with Firebase.");
    }

    // Determine initial role & department from email/profile if first time
    let profile = await userService.getUserProfile(fbUser.uid);
    if (!profile) {
      let role: FirestoreUserProfile["role"] = "staff";
      let department = "aids";
      let name = fbUser.displayName || trimmedEmail.split("@")[0];
      let studentId = "";
      let rollNo = "";
      let wardName = "";

      if (trimmedEmail.includes("admin") || trimmedEmail === "principal@brightwood.edu") {
        role = "admin";
        department = "all";
        name = "System Administrator";
      } else if (trimmedEmail.includes("account") || trimmedEmail.includes("finance") || trimmedEmail === "bursar@brightwood.edu") {
        role = "accountant";
        department = "all";
        name = "Chief Accountant";
      } else if (trimmedEmail.includes("mark.t@mail.com") || trimmedEmail.includes("parent")) {
        role = "parent";
        department = "cse";
        name = "Mark Thompson (Parent)";
        wardName = "Ava Thompson";
        studentId = "STU-1042";
        rollNo = "CSE-501";
      } else if (trimmedEmail.includes("ramasamy") || trimmedEmail.includes("sanjay") || trimmedEmail.includes("chen")) {
        role = "parent";
        department = "aids";
        name = "Parent Guardian";
      }

      // If an expectedRole is explicitly requested for this login, ensure profile matches
      if (expectedRole && (role === "staff" || !role)) {
        role = expectedRole;
        if (role === "admin" || role === "accountant") department = "all";
      }

      profile = {
        uid: fbUser.uid,
        email: trimmedEmail,
        name,
        role,
        department,
        rollNo,
        wardName,
      };

      await userService.createUserProfile(profile);
    }

    // Strict Role Validation Check
    if (expectedRole) {
      const actualRole = profile.role;
      if (expectedRole === "admin" && actualRole !== "admin") {
        await signOut(auth);
        throw new Error("Access denied. This account does not have Admin privileges.");
      }
      if (expectedRole === "accountant" && actualRole !== "accountant" && actualRole !== "admin") {
        await signOut(auth);
        throw new Error("Access denied. This account does not have Accountancy privileges.");
      }
      if (expectedRole === "parent" && actualRole !== "parent") {
        await signOut(auth);
        throw new Error("Access denied. This account is not registered as a Parent account.");
      }
    }

    // Make sure initial departments exist
    departmentService.initializeDefaultDepartments().catch(() => {});

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

  async loginStudent(registerNumber: string, dateOfBirth: string): Promise<AuthSession> {
    // 1. Verify credentials against Firebase student records
    const verifiedStudent = await studentService.verifyStudentLogin(registerNumber, dateOfBirth);

    const cleanReg = normalizeRegisterNumber(verifiedStudent.registerNumber || registerNumber);
    const internalEmail = `student_${cleanReg.toLowerCase().replace(/[^a-z0-9]/g, "")}@brightwood.internal`;
    const internalSecret = `Std#${cleanReg}#${normalizeDateString(dateOfBirth).replace(/[^0-9]/g, "")}`;

    // 2. Establish authenticated Firebase Auth session
    let fbUser: FirebaseUser | null = null;
    try {
      const userCred = await signInWithEmailAndPassword(auth, internalEmail, internalSecret);
      fbUser = userCred.user;
    } catch (authError: any) {
      if (
        authError.code === "auth/user-not-found" ||
        authError.code === "auth/invalid-credential"
      ) {
        try {
          const createCred = await createUserWithEmailAndPassword(auth, internalEmail, internalSecret);
          fbUser = createCred.user;
          if (verifiedStudent.name) {
            await updateProfile(createCred.user, { displayName: verifiedStudent.name }).catch(() => {});
          }
        } catch (createErr) {
          console.warn("Student account provision notice:", createErr);
        }
      }
    }

    const uid = fbUser?.uid || `stu-${cleanReg}`;

    // 3. Ensure Firestore user profile is synced
    try {
      await userService.createUserProfile({
        uid,
        name: verifiedStudent.name,
        email: verifiedStudent.email || internalEmail,
        role: "student",
        department: verifiedStudent.department,
        rollNo: verifiedStudent.registerNumber,
        phone: verifiedStudent.phone,
        wardName: verifiedStudent.name,
      });
    } catch (err) {
      console.warn("Could not sync student user profile:", err);
    }

    return {
      user: {
        uid,
        name: verifiedStudent.name,
        email: verifiedStudent.email || `${cleanReg.toLowerCase()}@brightwood.edu`,
        role: "student",
        department: verifiedStudent.department,
        phone: verifiedStudent.phone,
        rollNo: verifiedStudent.registerNumber,
        studentId: verifiedStudent.id,
        wardName: verifiedStudent.name,
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
    const pwd = data.password || "College@123";
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
        const profile = await userService.getUserProfile(fbUser.uid);
        callback(profile);
      } catch (err) {
        console.error("Error fetching user profile in auth state change:", err);
        callback(null);
      }
    });
  },
};
