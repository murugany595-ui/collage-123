import React, { useState } from "react";
import {
  Shield,
  GraduationCap,
  Calculator,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Hash,
  Loader2,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface LoginPageProps {
  onShowToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export type LoginRole = "admin" | "accountant" | "student";

export const LoginPage: React.FC<LoginPageProps> = ({ onShowToast = () => {} }) => {
  const { login, loginStudent } = useAuth();

  // Active Role tab - defaults to admin / role selection
  const [selectedRole, setSelectedRole] = useState<LoginRole>("admin");
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    registerId?: string;
    studentDob?: string;
  }>({});

  // Credentials for Email + Password (Admin, Accountancy)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Credentials for Student (Registration ID + Date of Birth)
  const [studentRegisterId, setStudentRegisterId] = useState("");
  const [studentDob, setStudentDob] = useState("");

  const roleTabs: {
    role: LoginRole;
    label: string;
    icon: React.ReactNode;
    desc: string;
    iconBg: string;
    iconColor: string;
    iconBorder: string;
    buttonBg: string;
    buttonHover: string;
    buttonText: string;
  }[] = [
    {
      role: "admin",
      label: "Admin",
      icon: <Shield className="w-3.5 h-3.5" />,
      desc: "Super Admin & Principal Institutional Portal",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
      iconBorder: "border-blue-100",
      buttonBg: "bg-blue-600",
      buttonHover: "hover:bg-blue-700",
      buttonText: "Login to Admin Dashboard",
    },
    {
      role: "accountant",
      label: "Accountancy",
      icon: <Calculator className="w-3.5 h-3.5" />,
      desc: "Bursar & Finance Office Portal",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      iconBorder: "border-emerald-100",
      buttonBg: "bg-emerald-600",
      buttonHover: "hover:bg-emerald-700",
      buttonText: "Login to Accountancy Dashboard",
    },
    {
      role: "student",
      label: "Student",
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      desc: "Sign in with Registration ID and Date of Birth",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-700",
      iconBorder: "border-purple-100",
      buttonBg: "bg-purple-600",
      buttonHover: "hover:bg-purple-700",
      buttonText: "Login to Student Dashboard",
    },
  ];

  const handleRoleChange = (role: LoginRole) => {
    setSelectedRole(role);
    try {
      localStorage.setItem("edufee_active_role", role);
    } catch {}
    setGeneralError(null);
    setFieldErrors({});
    setEmail("");
    setPassword("");
    setStudentRegisterId("");
    setStudentDob("");
  };

  const handleAdminOrAccountantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: { email?: string; password?: string } = {};

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await login(cleanEmail, password, selectedRole as any);
      const roleLabel = roleTabs.find((r) => r.role === selectedRole)?.label || selectedRole;
      onShowToast(`Signed in successfully as ${roleLabel}!`, "success");
    } catch (err: any) {
      console.error(`[LoginPage] ${selectedRole} login error:`, err);
      const errMsg =
        err?.message ||
        (selectedRole === "accountant"
          ? "Accountancy sign-in failed. Please verify your email and password."
          : "Invalid credentials or unauthorized role.");
      setGeneralError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: { registerId?: string; studentDob?: string } = {};

    const cleanReg = studentRegisterId.trim();
    const cleanDob = studentDob.trim();

    if (!cleanReg) {
      errors.registerId = "Registration ID is required.";
    }

    if (!cleanDob) {
      errors.studentDob = "Date of Birth is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await loginStudent(cleanReg, cleanDob);
      onShowToast("Signed in successfully! Opening Student Dashboard...", "success");
    } catch (err: any) {
      console.error("[Login] Student login error:", err?.message || err);
      // Requirement 12 & 13: unified error message, do not expose whether ID exists
      setGeneralError(err?.message || "Invalid Registration ID or Date of Birth.");
    } finally {
      setLoading(false);
    }
  };

  const activeTabInfo = roleTabs.find((t) => t.role === selectedRole) || roleTabs[0];

  return (
    <div className="min-h-screen bg-ambient-mesh flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans relative overflow-hidden">
      {/* Ambient background blur blobs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-violet-200/25 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-sky-200/25 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />

      <div className="max-w-md sm:max-w-lg w-full glass-card liquid-specular rounded-3xl shadow-2xl border border-white/80 p-6 sm:p-8 md:p-10 relative z-10 animate-fade-in">
        {/* 3 Role Selector Tabs */}
        <div className="p-1 bg-slate-100/80 rounded-2xl mb-6 grid grid-cols-3 gap-1.5 border border-slate-200/60 backdrop-blur-xs">
          {roleTabs.map((tab) => {
            const isActive = selectedRole === tab.role;
            return (
              <button
                key={tab.role}
                type="button"
                id={`role-tab-${tab.role}`}
                onClick={() => handleRoleChange(tab.role)}
                className={`py-2 px-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] sm:text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Role Header Banner */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-xl ${activeTabInfo.iconBg} ${activeTabInfo.iconColor} border ${activeTabInfo.iconBorder} flex-shrink-0`}
            >
              {activeTabInfo.icon}
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedRole === "admin" && "Admin Login"}
                {selectedRole === "accountant" && "Accountancy Login"}
                {selectedRole === "student" && "Student Login"}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{activeTabInfo.desc}</p>
            </div>
          </div>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            id="auth-error-alert"
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-start gap-2.5 animate-shake"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 font-semibold">{generalError}</div>
          </div>
        )}

        {/* 1. ADMIN LOGIN FORM (ONLY: Email, Password, Login button) */}
        {selectedRole === "admin" && (
          <form noValidate onSubmit={handleAdminOrAccountantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="admin-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="admin@college.edu"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    fieldErrors.email
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-hidden transition bg-white font-medium`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="admin-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    fieldErrors.password
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-hidden transition bg-white`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In as Admin...</span>
                </>
              ) : (
                <>
                  <span>Login to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. ACCOUNTANCY LOGIN FORM (ONLY: Email, Password, Login button) */}
        {selectedRole === "accountant" && (
          <form noValidate onSubmit={handleAdminOrAccountantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="accountant-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="accountant@college.edu"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    fieldErrors.email
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-hidden transition bg-white font-medium`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="accountant-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    fieldErrors.password
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-hidden transition bg-white`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <button
              id="accountant-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In as Accountancy...</span>
                </>
              ) : (
                <>
                  <span>Login to Accountancy Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. STUDENT LOGIN FORM (Registration ID + Date of Birth) */}
        {selectedRole === "student" && (
          <form noValidate onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration ID / Register Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="student-register-id-input"
                  type="text"
                  value={studentRegisterId}
                  onChange={(e) => {
                    setStudentRegisterId(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, registerId: undefined }));
                  }}
                  placeholder="e.g. 21AD045 or REG1001"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    fieldErrors.registerId
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  } outline-hidden transition bg-white font-mono uppercase font-semibold`}
                />
              </div>
              {fieldErrors.registerId && (
                <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.registerId}</span>
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-400 font-normal">
                Assigned by the institution (e.g. 21AD045, 22CS102)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth (DOB) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="student-dob-input"
                  type="date"
                  value={studentDob}
                  onChange={(e) => {
                    setStudentDob(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, studentDob: undefined }));
                  }}
                  placeholder="YYYY-MM-DD"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    fieldErrors.studentDob
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  } outline-hidden transition bg-white font-mono`}
                />
              </div>
              {fieldErrors.studentDob && (
                <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.studentDob}</span>
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-400 font-normal">
                Date of Birth assigned during registration (e.g. 2005-05-15)
              </p>
            </div>

            <button
              id="student-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In as Student...</span>
                </>
              ) : (
                <>
                  <span>Login to Student Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Note: Institutional access managed footnote */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Institutional access is strictly managed and provisioned by the College Administration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
