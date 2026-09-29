import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { UserRole, UserProfile } from "../types";
import { User } from "../services/api";
import { authService, userService, FirestoreUserProfile } from "../services/firebase";

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  rollNo?: string;
  wardName?: string;
  phone?: string;
  designation?: string;
}

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  activeRole: UserRole;
  login: (email: string, password: string, requiredRole?: UserRole) => Promise<void>;
  loginStudent: (registerNumber: string, dateOfBirth: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function formatAuthError(error: any, isSignUp = false): string {
  const code = error?.code || "";
  const msg = error?.message || "";

  if (isSignUp) {
    if (
      code === "auth/email-already-in-use" ||
      msg.includes("email-already-in-use") ||
      msg.includes("EMAIL_EXISTS")
    ) {
      return "User already exists. Please sign in";
    }
    if (code === "auth/weak-password" || msg.includes("weak-password")) {
      return "Password is too weak. Minimum 6 characters required.";
    }
    if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
      return "Please enter a valid email address.";
    }
  }

  // Sign In / General credentials check
  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-login-credentials" ||
    msg.includes("invalid-credential") ||
    msg.includes("user-not-found") ||
    msg.includes("wrong-password") ||
    msg.includes("INVALID_LOGIN_CREDENTIALS") ||
    msg.includes("INVALID_CREDENTIALS") ||
    msg.includes("INVALID_PASSWORD") ||
    msg.includes("EMAIL_NOT_FOUND")
  ) {
    return "Email or password is incorrect";
  }

  if (
    code === "auth/email-already-in-use" ||
    msg.includes("email-already-in-use") ||
    msg.includes("EMAIL_EXISTS")
  ) {
    return "User already exists. Please sign in";
  }

  if (code === "auth/too-many-requests" || msg.includes("too-many-requests")) {
    return "Too many attempts. Please try again later.";
  }

  if (code === "auth/network-request-failed" || msg.includes("network")) {
    return "Network error. Please check your internet connection.";
  }

  return msg || "Email or password is incorrect";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("edufee_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("edufee_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("edufee_token") || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem("edufee_token") && !localStorage.getItem("edufee_user");
    } catch {
      return false;
    }
  });
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return (localStorage.getItem("edufee_active_role") as UserRole) || "admin";
  });

  // Sync state from Firebase Auth and Firestore users/{uid}
  const syncAuthState = async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      setFirebaseUser(fbUser);
      try {
        const idToken = await fbUser.getIdToken().catch(() => fbUser.uid);
        setToken(idToken);
        localStorage.setItem("edufee_token", idToken);

        const email = fbUser.email || "";
        let firestoreProfile: any = null;

        try {
          firestoreProfile = await userService.getUserProfile(fbUser.uid);
        } catch (profileErr) {
          console.warn("Could not fetch remote profile immediately (using local fallback if available):", profileErr);
        }

        if (!firestoreProfile) {
          // Check local storage for cached profile matching current user
          try {
            const savedProfile = localStorage.getItem("edufee_profile");
            if (savedProfile) {
              const parsed = JSON.parse(savedProfile);
              if (parsed.uid === fbUser.uid || parsed.email === email) {
                firestoreProfile = parsed;
              }
            }
          } catch {
            // Ignore parse errors
          }
        }

        if (!firestoreProfile) {
          // Provision initial Firestore profile
          const savedRole = (localStorage.getItem("edufee_active_role") as UserRole) || 
            (email.includes("admin") ? "admin" :
             email.includes("hod") ? "hod" :
             email.includes("account") ? "accountant" :
             email.includes("student") ? "student" :
             email.includes("parent") ? "parent" : "staff");
          const displayName = fbUser.displayName || email.split("@")[0] || "User";
          const dept = savedRole === "admin" ? "all" : "aids";

          firestoreProfile = {
            uid: fbUser.uid,
            name: displayName,
            email,
            role: savedRole as any,
            department: dept,
          };

          try {
            await userService.createUserProfile(firestoreProfile);
          } catch (createErr) {
            console.warn("Could not write initial profile to Firestore immediately:", createErr);
          }
        }

        const role = (firestoreProfile.role as UserRole) || "admin";
        setActiveRole(role);
        localStorage.setItem("edufee_active_role", role);

        const userObj: User = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: firestoreProfile.name,
          email: firestoreProfile.email,
          role,
          department: firestoreProfile.department,
          phone: firestoreProfile.phone,
          rollNo: firestoreProfile.rollNo,
          wardName: firestoreProfile.wardName,
          designation: firestoreProfile.designation,
        };

        setUser(userObj);
        setProfile({
          id: fbUser.uid,
          uid: fbUser.uid,
          email: firestoreProfile.email,
          name: firestoreProfile.name,
          role,
          department: firestoreProfile.department,
          phone: firestoreProfile.phone,
          rollNo: firestoreProfile.rollNo,
          wardName: firestoreProfile.wardName,
          designation: firestoreProfile.designation,
        });

        localStorage.setItem("edufee_user", JSON.stringify(userObj));
        localStorage.setItem("edufee_profile", JSON.stringify(userObj));
      } catch (err) {
        console.error("Error retrieving user profile from Firestore:", err);
        // Fallback user object so the app never hangs or crashes
        const email = fbUser.email || "";
        const fallbackRole = (localStorage.getItem("edufee_active_role") as UserRole) || (email.includes("admin") ? "admin" : "staff");
        const fallbackUser: User = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: fbUser.displayName || email.split("@")[0] || "User",
          email,
          role: fallbackRole,
          department: fallbackRole === "admin" ? "all" : "aids",
        };
        setUser(fallbackUser);
        setProfile(fallbackUser as any);
        setActiveRole(fallbackRole);
      }
    } else {
      setFirebaseUser(null);
      setUser(null);
      setProfile(null);
      setToken(null);
      localStorage.removeItem("edufee_token");
      localStorage.removeItem("edufee_active_role");
      localStorage.removeItem("edufee_user");
      localStorage.removeItem("edufee_profile");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout to avoid hanging if network/Firebase is slow
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 400);

    let unsubscribe = () => {};
    if (auth) {
      try {
        unsubscribe = onAuthStateChanged(
          auth,
          async (fbUser) => {
            if (isMounted) {
              clearTimeout(timeoutId);
              await syncAuthState(fbUser);
            }
          },
          (error) => {
            console.warn("Firebase onAuthStateChanged warning:", error);
            if (isMounted) {
              clearTimeout(timeoutId);
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        console.warn("Firebase auth subscription error:", err);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    if (auth?.currentUser) {
      await syncAuthState(auth.currentUser);
    }
  };

  const login = async (email: string, password: string, requiredRole?: UserRole) => {
    try {
      setIsLoading(true);
      const session = await authService.login(email, password, requiredRole as any);
      localStorage.setItem("edufee_token", session.user.uid);
      localStorage.setItem("edufee_active_role", session.user.role);
      setActiveRole(session.user.role as UserRole);

      const userObj: User = {
        id: session.user.uid,
        uid: session.user.uid,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as UserRole,
        department: session.user.department,
        phone: session.user.phone,
        rollNo: session.user.rollNo,
        wardName: session.user.wardName,
        designation: session.user.designation,
      };

      setUser(userObj);
      setProfile(userObj as any);
      localStorage.setItem("edufee_user", JSON.stringify(userObj));
      localStorage.setItem("edufee_profile", JSON.stringify(userObj));
      if (auth.currentUser) {
        setFirebaseUser(auth.currentUser);
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Access denied")) {
        throw new Error(msg);
      }
      throw new Error(formatAuthError(err, false));
    } finally {
      setIsLoading(false);
    }
  };

  const loginStudent = async (registerNumber: string, dateOfBirth: string) => {
    try {
      setIsLoading(true);
      const session = await authService.loginStudent(registerNumber, dateOfBirth);
      localStorage.setItem("edufee_token", session.user.uid);
      localStorage.setItem("edufee_active_role", "student");
      setActiveRole("student");

      const userObj: User = {
        id: session.user.uid,
        uid: session.user.uid,
        name: session.user.name,
        email: session.user.email,
        role: "student",
        department: session.user.department,
        phone: session.user.phone,
        rollNo: session.user.rollNo,
        wardName: session.user.wardName,
      };

      setUser(userObj);
      setProfile(userObj as any);
      localStorage.setItem("edufee_user", JSON.stringify(userObj));
      localStorage.setItem("edufee_profile", JSON.stringify(userObj));
      if (auth.currentUser) {
        setFirebaseUser(auth.currentUser);
      }
    } catch (err: any) {
      throw new Error(err?.message || "Invalid Register ID or Date of Birth");
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: SignUpParams) => {
    try {
      setIsLoading(true);
      const session = await authService.register({
        name: params.name,
        email: params.email,
        password: params.password,
        role: params.role as any,
        department: params.department || (params.role === "admin" ? "all" : "aids"),
        phone: params.phone,
        rollNo: params.rollNo,
        wardName: params.wardName,
        designation: params.designation,
      });

      localStorage.setItem("edufee_token", session.user.uid);
      localStorage.setItem("edufee_active_role", session.user.role);
      setActiveRole(session.user.role as UserRole);

      const userObj: User = {
        id: session.user.uid,
        uid: session.user.uid,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as UserRole,
        department: session.user.department,
        phone: session.user.phone,
        rollNo: session.user.rollNo,
        wardName: session.user.wardName,
        designation: session.user.designation,
      };

      setUser(userObj);
      setProfile(userObj as any);
      localStorage.setItem("edufee_user", JSON.stringify(userObj));
      localStorage.setItem("edufee_profile", JSON.stringify(userObj));
      if (auth.currentUser) {
        setFirebaseUser(auth.currentUser);
      }
    } catch (err: any) {
      throw new Error(formatAuthError(err, true));
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email.trim());
    } catch (err: any) {
      throw new Error(formatAuthError(err, false));
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Firebase sign out warning:", err);
    } finally {
      localStorage.removeItem("edufee_token");
      localStorage.removeItem("edufee_active_role");
      localStorage.removeItem("edufee_user");
      localStorage.removeItem("edufee_profile");
      setFirebaseUser(null);
      setUser(null);
      setProfile(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    try {
      const currentUid = auth.currentUser?.uid || user?.uid;
      if (!currentUid) throw new Error("No active user session");

      if (data.name && auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.name }).catch(() => {});
      }

      await userService.updateUserProfile(currentUid, data as any);

      if (data.role) {
        localStorage.setItem("edufee_active_role", data.role);
        setActiveRole(data.role);
      }

      if (user) {
        const updated = { ...user, ...data };
        setUser(updated as User);
        localStorage.setItem("edufee_user", JSON.stringify(updated));
      }
      await refreshUser();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update profile in Firestore");
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!auth?.currentUser) {
      throw new Error("User must be signed in to change password");
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (err: any) {
      throw new Error(formatAuthError(err, false));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        profile,
        token,
        isLoading,
        activeRole,
        login,
        loginStudent,
        signUp,
        resetPassword,
        logout,
        updateUserProfileData,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
