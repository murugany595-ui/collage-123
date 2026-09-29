import React, { useState } from "react";
import {
  Shield,
  GraduationCap,
  Users,
  Calculator,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Hash,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface LoginPageProps {
  onShowToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export type LoginRole = "admin" | "accountant" | "student" | "parent";

export const LoginPage: React.FC<LoginPageProps> = ({ onShowToast = () => {} }) => {
  const { login, loginStudent } = useAuth();

  // Active Role tab
  const [selectedRole, setSelectedRole] = useState<LoginRole>("admin");
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    registerId?: string;
    dateOfBirth?: string;
  }>({});

  // Credentials for Email + Password (Admin, Accountancy, Parent)
  const [email, setEmail] = useState("admin@brightwood.edu");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);

  // Credentials for Student (Register ID + Date of Birth ONLY)
  const [studentRegisterId, setStudentRegisterId] = useState("CSE-501");
  const [studentDob, setStudentDob] = useState("2005-05-14");

  const roleTabs: { role: LoginRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: "admin",
      label: "Admin",
      icon: <Shield className="w-3.5 h-3.5" />,
      desc: "Super Admin & Principal Institutional Portal",
    },
    {
      role: "accountant",
      label: "Accountancy",
      icon: <Calculator className="w-3.5 h-3.5" />,
      desc: "Bursar & Finance Office Portal",
    },
    {
      role: "student",
      label: "Student",
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      desc: "Sign in with Register ID and Date of Birth",
    },
    {
      role: "parent",
      label: "Parent",
      icon: <Users className="w-3.5 h-3.5" />,
      desc: "Access student ward records & fee invoices",
    },
  ];

  const handleRoleChange = (role: LoginRole) => {
    setSelectedRole(role);
    setGeneralError(null);
    setFieldErrors({});

    // Populate role-appropriate sample defaults
    if (role === "admin") {
      setEmail("admin@brightwood.edu");
      setPassword("Password123!");
    } else if (role === "accountant") {
      setEmail("accounts@brightwood.edu");
      setPassword("Password123!");
    } else if (role === "parent") {
      setEmail("mark.t@mail.com");
      setPassword("Password123!");
    } else if (role === "student") {
      setStudentRegisterId("CSE-501");
      setStudentDob("2005-05-14");
    }
  };

  const handleAdminOrAccountantOrParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
      await login(email.trim(), password, selectedRole as any);
      const roleLabel = roleTabs.find((r) => r.role === selectedRole)?.label || selectedRole;
      onShowToast(`Signed in successfully as ${roleLabel}!`, "success");
    } catch (err: any) {
      setGeneralError(err?.message || "Invalid credentials or unauthorized role.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: { registerId?: string; dateOfBirth?: string } = {};

    if (!studentRegisterId.trim()) {
      errors.registerId = "Register ID / Register Number is required.";
    }

    if (!studentDob.trim()) {
      errors.dateOfBirth = "Date of Birth is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await loginStudent(studentRegisterId.trim(), studentDob.trim());
      onShowToast("Student verified successfully! Opening Student Dashboard...", "success");
    } catch (err: any) {
      setGeneralError(err?.message || "Invalid Register ID or Date of Birth.");
    } finally {
      setLoading(false);
    }
  };

  const activeTabInfo = roleTabs.find((t) => t.role === selectedRole) || roleTabs[0];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-200">
        {/* Left Institutional Branding Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-blue-700 flex items-center justify-center shadow-lg font-black text-lg">
                <GraduationCap className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight">Our College</span>
                <p className="text-[10px] text-blue-200 font-medium">ERP & Campus Portal</p>
              </div>
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-semibold rounded-full mb-3">
                Role-Based Authentication
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                College & Fee Management System
              </h2>
              <p className="text-blue-100/80 text-xs sm:text-sm mt-3 leading-relaxed">
                Institutional role-based access for Administrators, Bursar / Accountancy, Students, and Parents.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                "Admin: Email + Password Authentication",
                "Accountancy: Email + Password Bursar Access",
                "Student: Register ID + Date of Birth Verification",
                "Parent: Email + Password Ward Management",
                "Enforced Role-Based Dashboard Protection",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-blue-100 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-blue-600/50 mt-6">
            <div className="flex items-center justify-between text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-300" />
                Institutional Security & Auth
              </span>
              <span className="font-semibold text-white/90">RBAC Secured</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-10 bg-white flex flex-col justify-center max-h-[92vh] overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            {/* 4 Role Selector Tabs */}
            <div className="p-1 bg-slate-100 rounded-2xl mb-6 grid grid-cols-4 gap-1">
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
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
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
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                  {activeTabInfo.icon}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedRole === "admin" && "Admin Login"}
                  {selectedRole === "accountant" && "Accountancy Login"}
                  {selectedRole === "student" && "Student Login"}
                  {selectedRole === "parent" && "Parent Login"}
                </h3>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">{activeTabInfo.desc}</p>
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
              <form noValidate onSubmit={handleAdminOrAccountantOrParentSubmit} className="space-y-4">
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
                      placeholder="admin@brightwood.edu"
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
              <form noValidate onSubmit={handleAdminOrAccountantOrParentSubmit} className="space-y-4">
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
                      placeholder="accounts@brightwood.edu"
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

            {/* 3. STUDENT LOGIN FORM (ONLY: Register ID, Date of Birth, Login button - NO email, NO password) */}
            {selectedRole === "student" && (
              <form noValidate onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Register ID / Register Number <span className="text-rose-500">*</span>
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
                      placeholder="e.g. CSE-501 or 21AD045"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                        fieldErrors.registerId
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                    Assigned by the institution (e.g. CSE-501, 21AD045, ECE-302)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="student-dob-input"
                      type="date"
                      value={studentDob}
                      onChange={(e) => {
                        setStudentDob(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                        fieldErrors.dateOfBirth
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      } outline-hidden transition bg-white font-medium`}
                    />
                  </div>
                  {fieldErrors.dateOfBirth && (
                    <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{fieldErrors.dateOfBirth}</span>
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400 font-normal">
                    Must match your official college admission record
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
                      <span>Verifying Student Record...</span>
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

            {/* 4. PARENT LOGIN FORM (ONLY: Email, Password, Login button) */}
            {selectedRole === "parent" && (
              <form noValidate onSubmit={handleAdminOrAccountantOrParentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="parent-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="mark.t@mail.com"
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
                  <p className="mt-1 text-[11px] text-slate-400 font-normal">
                    Email address provided during your student ward's enrollment
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="parent-password-input"
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
                  id="parent-login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In as Parent...</span>
                    </>
                  ) : (
                    <>
                      <span>Login to Parent Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Access Bar for effortless testing of all 4 flows */}
            <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-between">
                <span>⚡ Quick Demo Portals:</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-fills credentials</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="demo-admin-btn"
                  onClick={() => {
                    handleRoleChange("admin");
                    setEmail("admin@brightwood.edu");
                    setPassword("Password123!");
                  }}
                  className={`text-left px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                    selectedRole === "admin"
                      ? "bg-blue-50 border-blue-300 text-blue-700 font-bold"
                      : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  id="demo-accountant-btn"
                  onClick={() => {
                    handleRoleChange("accountant");
                    setEmail("accounts@brightwood.edu");
                    setPassword("Password123!");
                  }}
                  className={`text-left px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                    selectedRole === "accountant"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                      : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Accountancy</span>
                </button>
                <button
                  type="button"
                  id="demo-student-btn"
                  onClick={() => {
                    handleRoleChange("student");
                    setStudentRegisterId("CSE-501");
                    setStudentDob("2005-05-14");
                  }}
                  className={`text-left px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                    selectedRole === "student"
                      ? "bg-purple-50 border-purple-300 text-purple-700 font-bold"
                      : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Student (Reg+DOB)</span>
                </button>
                <button
                  type="button"
                  id="demo-parent-btn"
                  onClick={() => {
                    handleRoleChange("parent");
                    setEmail("mark.t@mail.com");
                    setPassword("Password123!");
                  }}
                  className={`text-left px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                    selectedRole === "parent"
                      ? "bg-amber-50 border-amber-300 text-amber-700 font-bold"
                      : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Parent</span>
                </button>
              </div>
            </div>

            {/* Note: All manual registration removed per requirements */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Institutional access is strictly managed and provisioned by the College Administration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
