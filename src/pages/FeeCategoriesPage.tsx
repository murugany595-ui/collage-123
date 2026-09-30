import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Calendar,
  IndianRupee,
  X,
  ShieldCheck,
  Lock,
  Save,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FeeCategory } from "../services/firebase/feesService";

export interface FeeCategoriesPageProps {
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
  onNavigate?: (tab: string) => void;
}

export const FeeCategoriesPage: React.FC<FeeCategoriesPageProps> = ({
  onShowToast = () => {},
  onNavigate = () => {},
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isUserAdmin = user?.role === "admin";

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.fees.getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat: FeeCategory) => {
    if (!isUserAdmin) {
      onShowToast("Permission Denied: Only Administrator accounts can edit fee amounts.", "error");
      return;
    }
    setEditingId(cat.id);
    setEditAmount(Number(cat.amount));
  };

  const handleSaveEdit = async (cat: FeeCategory) => {
    if (!isUserAdmin) {
      onShowToast("Permission Denied: Only Administrator accounts can edit fee amounts.", "error");
      return;
    }

    try {
      setSavingId(cat.id);
      const res = await api.fees.updateCategory(cat.id, { amount: editAmount }, user?.role);
      if (res.success) {
        onShowToast(`Fee rate for "${cat.name}" updated to ₹${editAmount.toLocaleString()} in Firebase!`, "success");
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, amount: editAmount } : c))
        );
        setEditingId(null);
      }
    } catch (err: any) {
      onShowToast(err.message || "Failed to update fee rate.", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Institutional Fee Structures</h1>
            {isUserAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Admin Editable
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Read-Only Tariff
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isUserAdmin
              ? "Official tuition, lab facilities, and amenities rates stored in Firebase"
              : "Official college tariffs governed by College Administration"}
          </p>
        </div>

        {isUserAdmin && (
          <button
            onClick={() => onNavigate("settings")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-auto"
          >
            <Sliders className="w-4 h-4" />
            <span>Manage in Fee Settings</span>
          </button>
        )}
      </div>

      {/* Permission Info Banner for Non-Admin */}
      {!isUserAdmin && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Accountancy Read-Only View:</strong> Fee amounts are defined by College Administration. Accountants can view and apply these tariffs to student invoices, but cannot edit rates.
            </span>
          </div>
        </div>
      )}

      {/* Grid of Category Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-xs">Loading fee structures from Firebase...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <p className="text-sm font-bold text-slate-700">No Fee Categories Configured</p>
          <p className="text-xs text-slate-400">
            No institutional fee categories found in Firestore. Click "Manage in Fee Settings" above to create fee categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {categories.map((cat, idx) => (
            <div
              key={cat.id || idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    {cat.code || `FEE-${idx + 1}`}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {cat.frequency || "Per Semester"}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3 leading-snug">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{cat.description || "Core standard academic fee category"}</p>

                {editingId === cat.id ? (
                  <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">New Amount (₹)</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={editAmount}
                          onChange={(e) => setEditAmount(Number(e.target.value))}
                          className="w-full pl-6 pr-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveEdit(cat)}
                        disabled={savingId === cat.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        {savingId === cat.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-blue-700">₹{Number(cat.amount).toLocaleString()}</span>
                    <span className="text-xs font-medium text-slate-400">/ {cat.frequency}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Synced with Firebase</span>
                </div>
                {isUserAdmin && editingId !== cat.id && (
                  <button
                    onClick={() => startEdit(cat)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Amount</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
