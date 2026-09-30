import React, { useState, useEffect } from "react";
import {
  HeartHandshake,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  GraduationCap,
  Users2,
  X,
} from "lucide-react";
import { api } from "../services/api";

export interface ParentsPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  onNavigate?: (tab: string, studentId?: string) => void;
}

export const ParentsPage: React.FC<ParentsPageProps> = ({
  onShowToast = () => {},
  onNavigate = () => {},
}) => {
  const [parents, setParents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newChild, setNewChild] = useState("");
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    fetchParents();
  }, [search]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getParents(search);
      if (res.success && res.data) {
        setParents(res.data);
      } else {
        setParents([]);
      }
    } catch {
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createParent({
        name: newName,
        email: newEmail,
        phone: newPhone,
        studentName: newChild,
        address: newAddress,
      });
      setShowAddModal(false);
      onShowToast(`Parent record for ${newName} created in Firebase!`, "success");
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewChild("");
      setNewAddress("");
      fetchParents();
    } catch (err: any) {
      onShowToast(err.message || "Failed to create parent record.", "error");
    }
  };

  const handleDeleteParent = async (id: string) => {
    try {
      await api.admin.deleteParent(id);
      onShowToast("Parent record removed successfully.", "success");
      fetchParents();
    } catch (err: any) {
      onShowToast(err.message || "Failed to delete parent.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search parent name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Parent / Guardian</span>
        </button>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Parent Name</th>
                <th className="px-6 py-4">Contact Phone</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Linked Student(s)</th>
                <th className="px-6 py-4">Residential Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    {loading ? "Loading parent records from Firestore..." : "No parent records found in Firestore."}
                  </td>
                </tr>
              ) : (
                parents.map((p) => {
                  const parentId = p.parentId || p.id;
                  const studentId = p.linkedStudentId || p.studentId;
                  return (
                    <tr key={parentId} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {p.name ? p.name.slice(0, 2).toUpperCase() : "P"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <span className="font-mono text-[10px] text-slate-400">{parentId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{p.phone || "—"}</td>
                      <td className="px-6 py-4 text-slate-600">{p.email || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{p.studentName || p.student_name || "—"}</span>
                          {(p.studentRegisterNumber || p.grade) && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                              {p.studentRegisterNumber || p.grade}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{p.address || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {studentId && (
                            <button
                              onClick={() => onNavigate("student-details", studentId)}
                              title="View Child Record"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            title="Delete Parent Record"
                            onClick={() => handleDeleteParent(parentId)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800">Add Parent / Guardian</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mark Thompson"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Linked Student Name</label>
                <input
                  type="text"
                  value={newChild}
                  onChange={(e) => setNewChild(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
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
                  Register Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
