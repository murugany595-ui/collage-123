import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Plus,
  Shield,
  GraduationCap,
  Users,
  Calculator,
  Edit2,
  Trash2,
  Lock,
  X,
  CheckCircle2,
  Layers,
  BookOpen,
  Mail,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole, ROLE_CONFIGS } from "../types";
import { api } from "../services/api";
import { PasswordStrengthIndicator } from "../components/common/PasswordStrengthIndicator";

export interface UsersPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onShowToast = () => {} }) => {
  const { resetPassword } = useAuth();
  const [activeRoleTab, setActiveRoleTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [users, setUsers] = useState<any[]>([]);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("faculty");
  const [newDept, setNewDept] = useState("Computer Science & Engineering");

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.users.getAll();
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.warn("Could not load users from Firestore:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const uid = `USR-${Date.now().toString().slice(-6)}`;
      const newU = {
        uid,
        id: uid,
        name: newName,
        email: newEmail,
        role: newRole,
        department: newDept,
        status: "Active",
      };
      await api.users.create(newU);
      setShowAddModal(false);
      onShowToast(`User account record for ${newName} created in Firebase!`, "success");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      loadUsers();
    } catch (err: any) {
      onShowToast(err.message || "Failed to create user account.", "error");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await api.users.delete(uid);
      onShowToast("User account deleted successfully.", "success");
      loadUsers();
    } catch (err: any) {
      onShowToast(err.message || "Failed to delete user.", "error");
    }
  };

  const handleSendReset = async (email: string) => {
    try {
      await resetPassword(email);
      onShowToast(`Password reset link dispatched to ${email}`, "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to dispatch password reset", "error");
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-blue-50 text-blue-700 border-blue-200",
    hod: "bg-indigo-50 text-indigo-700 border-indigo-200",
    accountant: "bg-emerald-50 text-emerald-700 border-emerald-200",
    faculty: "bg-sky-50 text-sky-700 border-sky-200",
    student: "bg-purple-50 text-purple-700 border-purple-200",
    parent: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const filtered = users.filter((u) => {
    const matchesRole = activeRoleTab === "ALL" || u.role.toLowerCase() === activeRoleTab.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">User & Role Management</h1>
            <p className="text-xs text-slate-400">
              Institutional User Accounts & Role Permissions Directory
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add System User</span>
          </button>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-1 overflow-x-auto">
          {[
            { id: "ALL", label: "All Users" },
            { id: "admin", label: "Super Admin / Principal" },
            { id: "hod", label: "HOD" },
            { id: "accountant", label: "Accountant" },
            { id: "faculty", label: "Faculty" },
            { id: "student", label: "Students" },
            { id: "parent", label: "Parents" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRoleTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeRoleTab === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
            />
          </div>
          <span className="text-xs text-slate-400">
            {filtered.length} Users Found • Institutional Directory
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Department / Affiliation</th>
                <th className="px-6 py-4">Role Permission</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {loadingUsers ? "Loading users from Firestore..." : "No user accounts found."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const roleKey = u.role?.toLowerCase() || "student";
                  const roleConfig = ROLE_CONFIGS[roleKey as UserRole] || ROLE_CONFIGS.student;
                  const uid = u.uid || u.id;
                  return (
                    <tr key={uid} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {u.name ? u.name.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <span className="font-mono text-[10px] text-slate-400">
                              {uid ? `UID: ${uid.slice(0, 8)}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{u.email}</td>
                      <td className="px-6 py-4 text-slate-600">{u.department || "Academic"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            roleColors[roleKey] || roleColors.student
                          }`}
                        >
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {u.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Send Password Reset Email via Firebase"
                            onClick={() => handleSendReset(u.email)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete User from Firestore"
                            onClick={() => handleDeleteUser(uid)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800">Create Institutional User</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Eleanor Vance"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@ourcollege.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  placeholder="Set initial password (optional)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="admin">Super Admin / Principal</option>
                  <option value="hod">HOD (Head of Department)</option>
                  <option value="accountant">Accountant / Bursar</option>
                  <option value="faculty">Faculty / Professor</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent / Guardian</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department / Branch</label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
