import React, { useState } from "react";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface AdminLoginPageProps {
  onShowToast?: (msg: string, type?: "success" | "error" | "info") => void;
  onSuccess?: () => void;
  onGoToStudentPortal?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onShowToast = () => {},
  onSuccess = () => {},
  onGoToStudentPortal,
}) => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Administrator Email Address is required.";
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
      await login(email.trim(), password, "admin");
      onShowToast("Administrator authentication verified! Opening Admin Dashboard...", "success");
      onSuccess();
    } catch (err: any) {
      setGeneralError(err?.message || "Invalid administrator credentials or unauthorized account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-800">
        {/* Left Branding Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-10 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-slate-800">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">Our College</span>
                <p className="text-[10px] text-blue-300 font-semibold tracking-wider uppercase">
                  Institutional Admin Gateway
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-full mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Restricted Access</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Administration Portal
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed">
                Authorized management console for college administrators, principal office, and institutional finance directors.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                "Institutional Fee Ledger & Structure Control",
                "Student Enrollment, Profiles & Department Records",
                "Real-time Payment Approvals & Receipt Issuance",
                "Financial Audit Trails & Analytics Reporting",
                "Role-Based Access Control via Firebase Auth",
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-slate-800 mt-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>ABAC Protected</span>
              </span>
              <span className="font-semibold text-slate-300">Port 443 Encrypted</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="md:col-span-7 p-6 sm:p-10 bg-slate-900/60 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure Administrative Route</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Admin Login</h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Enter your administrative credentials to access the institution dashboard.
              </p>
            </div>

            {/* Error Banner */}
            {generalError && (
              <div
                id="admin-auth-error-alert"
                className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium flex items-start gap-2.5 animate-shake"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1 font-semibold">{generalError}</div>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Administrator Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="admin-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="admin@college.edu"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-800/80 text-white placeholder-slate-500 ${
                      fieldErrors.email
                        ? "border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    } outline-hidden transition font-medium`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="admin-password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-800/80 text-white placeholder-slate-500 ${
                      fieldErrors.password
                        ? "border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    } outline-hidden transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              <button
                id="admin-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Admin Authorization...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Admin Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col items-center gap-3">
              <p className="text-[11px] text-slate-500 text-center">
                Unauthorized access attempts are logged and reported. Only authorized college administrators are permitted.
              </p>

              {onGoToStudentPortal && (
                <button
                  type="button"
                  onClick={onGoToStudentPortal}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Are you a student? Go to Student Portal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
