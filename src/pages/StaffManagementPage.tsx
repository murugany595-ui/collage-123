import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Briefcase,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  CreditCard,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { staffService, Staff } from "../services/firebase/staffService";
import { expenseService, AdminExpense } from "../services/firebase/expenseService";

interface StaffManagementPageProps {
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
  onNavigate?: (tab: string) => void;
}

export const StaffManagementPage: React.FC<StaffManagementPageProps> = ({
  onShowToast = () => {},
  onNavigate = () => {},
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    staff_id: "",
    staff_name: "",
    department: "AI&DS",
    designation: "Assistant Professor",
    monthly_salary: "60000",
    joining_date: new Date().toISOString().slice(0, 10),
    status: "Active",
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [processingSalaryId, setProcessingSalaryId] = useState<string | null>(null);

  // 1. Subscribe to Live Firestore Staff and Expenses
  useEffect(() => {
    let unsubStaff: (() => void) | null = null;
    let unsubExpenses: (() => void) | null = null;

    const loadData = async () => {
      setLoading(true);
      try {
        const [staffs, exps] = await Promise.all([
          staffService.getAllStaff(),
          expenseService.getAdminExpenses(),
        ]);
        setStaffList(staffs);
        setExpenses(exps);

        unsubStaff = staffService.subscribeStaff((liveStaffs) => {
          setStaffList(liveStaffs);
        });

        unsubExpenses = expenseService.subscribeAdminExpenses((liveExps) => {
          setExpenses(liveExps);
        });
      } catch (err: any) {
        console.warn("Staff data loading notice:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubStaff) unsubStaff();
      if (unsubExpenses) unsubExpenses();
    };
  }, []);

  // Compute available months from expenses or fallback
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const m = e.month || (e.date ? e.date.slice(0, 7) : null);
      if (m && /^\d{4}-\d{2}$/.test(m)) set.add(m);
    });
    if (set.size === 0) {
      set.add("2026-09");
      set.add("2026-08");
      set.add("2026-07");
    }
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Salary expense records for selected month
  const monthlySalaryExpenses = useMemo(() => {
    return expenses.filter(
      (e) =>
        e.category === "Staff Salary" &&
        (e.month === selectedMonth || (e.date && e.date.startsWith(selectedMonth)))
    );
  }, [expenses, selectedMonth]);

  // Map of staff_id -> paid salary record in this selected month
  const paidStaffSalaryMap = useMemo(() => {
    const map = new Map<string, AdminExpense>();
    monthlySalaryExpenses.forEach((e) => {
      if (e.staff_id) {
        map.set(e.staff_id, e);
      }
    });
    return map;
  }, [monthlySalaryExpenses]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const name = (s.staff_name || s.name || "").toLowerCase();
      const id = (s.staff_id || s.id || s.employeeId || "").toLowerCase();
      const dept = (s.department || "").toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === "All" || dept === selectedDept.toLowerCase();
      const matchesStatus =
        selectedStatus === "All" ||
        (s.status || "Active").toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [staffList, searchQuery, selectedDept, selectedStatus]);

  // Total payroll stats
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((s) => (s.status || "Active").toLowerCase() === "active").length;
  const totalMonthlyPayroll = staffList
    .filter((s) => (s.status || "Active").toLowerCase() === "active")
    .reduce((sum, s) => sum + Number(s.monthly_salary || s.salary || 0), 0);
  const totalPaidThisMonth = monthlySalaryExpenses.reduce(
    (sum, e) => sum + Number(e.amount_inr || e.amount || 0),
    0
  );

  // Departments list for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    staffList.forEach((s) => {
      if (s.department) depts.add(s.department.toUpperCase());
    });
    return Array.from(depts);
  }, [staffList]);

  // Open Add/Edit Modal
  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      staff_id: `STAFF${String(staffList.length + 1).padStart(3, "0")}`,
      staff_name: "",
      department: "AI&DS",
      designation: "Assistant Professor",
      monthly_salary: "60000",
      joining_date: new Date().toISOString().slice(0, 10),
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      staff_id: staff.staff_id || staff.id,
      staff_name: staff.staff_name || staff.name,
      department: staff.department || "AI&DS",
      designation: staff.designation || "Assistant Professor",
      monthly_salary: String(staff.monthly_salary || staff.salary || 0),
      joining_date: staff.joining_date || staff.joiningDate || new Date().toISOString().slice(0, 10),
      status: staff.status || "Active",
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staff_name.trim()) {
      onShowToast("Staff name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaff) {
        await staffService.updateStaff(formData.department, editingStaff.staff_id || editingStaff.id, {
          staff_name: formData.staff_name,
          name: formData.staff_name,
          department: formData.department,
          designation: formData.designation,
          monthly_salary: Number(formData.monthly_salary || 0),
          salary: Number(formData.monthly_salary || 0),
          joining_date: formData.joining_date,
          status: formData.status as any,
        });
        onShowToast(`Staff member '${formData.staff_name}' updated successfully!`, "success");
      } else {
        await staffService.createStaff({
          id: formData.staff_id,
          employeeId: formData.staff_id,
          name: formData.staff_name,
          email: `${formData.staff_id.toLowerCase()}@college.edu`,
          department: formData.department,
          designation: formData.designation,
          salary: Number(formData.monthly_salary || 0),
          joiningDate: formData.joining_date,
          status: (formData.status || "active").toLowerCase() as any,
        });
        onShowToast(`Staff member '${formData.staff_name}' added to Firestore!`, "success");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      onShowToast("Error saving staff: " + (err?.message || "Unknown error"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Deactivate Staff
  const handleToggleStatus = async (staff: Staff) => {
    const currentStatus = (staff.status || "Active").toLowerCase();
    const newStatus = currentStatus === "active" ? "Inactive" : "Active";
    try {
      await staffService.updateStaff(staff.department, staff.staff_id || staff.id, {
        status: newStatus as any,
      });
      onShowToast(`Staff status set to ${newStatus}.`, "info");
    } catch (err: any) {
      onShowToast("Failed to update status: " + err.message, "error");
    }
  };

  // Record/Connect Monthly Staff Salary Expense
  const handleProcessSalary = async (staff: Staff) => {
    const sId = staff.staff_id || staff.id;
    // Check if salary already exists for this staff and month
    if (paidStaffSalaryMap.has(sId)) {
      onShowToast(
        `Salary for ${staff.staff_name || staff.name} is already logged for ${selectedMonth}!`,
        "info"
      );
      return;
    }

    setProcessingSalaryId(sId);
    try {
      const salaryAmount = Number(staff.monthly_salary || staff.salary || 0);
      const expId = `SAL-${selectedMonth}-${sId}`;

      await expenseService.createAdminExpense({
        id: expId,
        title: `Monthly Staff Salary - ${staff.staff_name || staff.name} (${selectedMonth})`,
        category: "Staff Salary",
        amount: salaryAmount,
        amount_inr: salaryAmount,
        month: selectedMonth,
        date: `${selectedMonth}-01`,
        staff_id: sId,
        staff_name: staff.staff_name || staff.name,
        paid_to: staff.staff_name || staff.name,
        payment_status: "Paid",
        description: `Staff salary disbursed for ${staff.designation} (${staff.department})`,
      });

      onShowToast(
        `Salary ₹${salaryAmount.toLocaleString()} recorded for ${staff.staff_name || staff.name} (${selectedMonth})!`,
        "success"
      );
    } catch (err: any) {
      onShowToast("Failed to record salary: " + err.message, "error");
    } finally {
      setProcessingSalaryId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Firebase Cloud Firestore • staffs Collection</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Staff & Salary Management</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Institutional staff directory, department allocations, monthly compensation ledgers, and verified salary expense tracking connected via staff_id.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("csv-import")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import / Export CSV</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">Total Staff</span>
            <div className="text-2xl font-black text-white mt-1">{totalStaffCount}</div>
            <span className="text-[11px] text-emerald-400 font-medium">{activeStaffCount} Active Members</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">Total Monthly Salary</span>
            <div className="text-2xl font-black text-white mt-1">₹{totalMonthlyPayroll.toLocaleString()}</div>
            <span className="text-[11px] text-indigo-300 font-medium">Standard Monthly Commitment</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">Salary Disbursed ({selectedMonth})</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalPaidThisMonth.toLocaleString()}</div>
            <span className="text-[11px] text-slate-400 font-medium">
              {monthlySalaryExpenses.length} of {activeStaffCount} Processed
            </span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">Select Payroll Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-bold py-1.5 px-2 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400">Month filter for salary checks</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name or staff_id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-4 px-6">Staff Member</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Designation</th>
                <th className="py-4 px-6">Monthly Salary</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Salary in {selectedMonth}</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-500" />
                    <span>Loading staff records from Firebase Firestore...</span>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No staff members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const sId = staff.staff_id || staff.id;
                  const isPaid = paidStaffSalaryMap.has(sId);
                  const isProcessing = processingSalaryId === sId;
                  const isActive = (staff.status || "Active").toLowerCase() === "active";

                  return (
                    <tr key={sId} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center border border-indigo-100">
                            {(staff.staff_name || staff.name || "S").charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {staff.staff_name || staff.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {sId} • Joined: {staff.joining_date || staff.joiningDate || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200/60">
                          {staff.department}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-semibold">
                        {staff.designation}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{Number(staff.monthly_salary || staff.salary || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                          title="Click to toggle Active/Inactive"
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-6">
                        {isPaid ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Paid in {selectedMonth}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleProcessSalary(staff)}
                            disabled={!isActive || isProcessing}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              isActive
                                ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            }`}
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CreditCard className="w-3 h-3" />
                            )}
                            <span>Record Salary</span>
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            className={`p-1.5 rounded-lg transition ${
                              isActive
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-600"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                            }`}
                            title={isActive ? "Deactivate Staff" : "Activate Staff"}
                          >
                            <XCircle className="w-3.5 h-3.5" />
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

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative">
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff ID</label>
                <input
                  type="text"
                  disabled={!!editingStaff}
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.staff_name}
                  onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                  placeholder="e.g. Dr. S. Rajendran"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="AI&DS">AI&DS</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Professor / Assistant Professor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.monthly_salary}
                    onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingStaff ? "Update Staff" : "Add Staff Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
