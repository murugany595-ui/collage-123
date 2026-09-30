import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  Key,
  Building2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_CONFIGS } from "../types";

export interface ProfilePageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onShowToast = () => {} }) => {
  const { user, profile, activeRole, updateUserProfileData, changePassword } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [designation, setDesignation] = useState(user?.designation || "");
  const [rollNo, setRollNo] = useState(user?.rollNo || "");
  const [wardName, setWardName] = useState(user?.wardName || "");

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setDepartment(user.department || "");
      setDesignation(user.designation || "");
      setRollNo(user.rollNo || "");
      setWardName(user.wardName || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateUserProfileData({
        name,
        phone,
        department,
        designation,
        rollNo,
        wardName,
      });
      onShowToast("Profile details updated successfully!", "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) {
      onShowToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPw !== confirmPw) {
      onShowToast("New passwords do not match!", "error");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(newPw);
      setNewPw("");
      setConfirmPw("");
      onShowToast("Account password changed successfully!", "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to update password", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const roleInfo = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.admin;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Profile Summary Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {name ? name.slice(0, 2).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{name || "User Account"}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {roleInfo.label}
              </span>
              <span className="text-xs text-slate-400">
                {department ? `${department}` : "Our College ERP User"}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/70 sm:text-right">
          <p className="font-semibold text-slate-700">Account Identity</p>
          <p className="font-mono text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
            ID: {user?.id || user?.uid || "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" /> Personal Profile Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                title="Email is managed via institutional identity"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {activeRole === "student" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Roll Number</label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="Roll / Register Number"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {activeRole === "parent" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Student Name</label>
                <input
                  type="text"
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  placeholder="Ward student full name"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {(activeRole === "faculty" || activeRole === "hod" || activeRole === "admin") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-3 border-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" /> Account Security
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isUpdatingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>

          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your password and authentication session are securely verified and stored via our institutional database with encrypted hashing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
