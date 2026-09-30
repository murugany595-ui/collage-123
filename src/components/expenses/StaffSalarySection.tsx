import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building2,
  Trash2,
  Edit2,
  Eye,
  FileSpreadsheet,
  X,
  TrendingDown,
} from "lucide-react";
import { StaffSalaryItem } from "../../types";

interface StaffSalarySectionProps {
  salaries: StaffSalaryItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateSalary: (data: any) => Promise<boolean | void>;
  onUpdateSalary: (id: string, data: any) => Promise<boolean | void>;
  onDeleteSalary: (id: string) => Promise<boolean | void>;
}

export const StaffSalarySection: React.FC<StaffSalarySectionProps> = ({
  salaries,
  isLoading,
  onRefresh,
  onCreateSalary,
  onUpdateSalary,
  onDeleteSalary,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<StaffSalaryItem | null>(null);
  const [editingSalary, setEditingSalary] = useState<StaffSalaryItem | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  const [realStaff, setRealStaff] = useState<any[]>([]);

  // Form State
  const [staffName, setStaffName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [basicSalary, setBasicSalary] = useState<string>("");
  const [allowances, setAllowances] = useState<string>("0");
  const [deductions, setDeductions] = useState<string>("0");
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [referenceNo, setReferenceNo] = useState(`NEFT-${Date.now().toString().slice(-6)}`);
  const [remarks, setRemarks] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    import("../../services/firebase/staffService").then(({ staffService }) => {
      staffService.getAllStaff().then((list) => {
        if (list) setRealStaff(list);
      }).catch(() => {});
    });
  }, []);

  // Automated Net Salary Calculation
  const basicNum = Number(basicSalary) || 0;
  const allowNum = Number(allowances) || 0;
  const dedNum = Number(deductions) || 0;
  const calculatedNetSalary = Math.max(0, basicNum + allowNum - dedNum);

  const handleSelectStaff = (stf: any) => {
    setStaffName(stf.name || "");
    setStaffId(stf.employeeId || stf.id || "");
    setDesignation(stf.designation || "");
    setDepartment(stf.department || "");
    setBasicSalary(stf.salary ? String(stf.salary) : "");
    setAllowances("0");
    setDeductions("0");
  };

  const handleOpenCreateModal = () => {
    setEditingSalary(null);
    setStaffName("");
    setStaffId("");
    setDesignation("");
    setDepartment("");
    setBasicSalary("");
    setAllowances("0");
    setDeductions("0");
    setSalaryMonth(new Date().toISOString().slice(0, 7));
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentStatus("Paid");
    setPaymentMethod("Bank Transfer");
    setReferenceNo(`NEFT-${Date.now().toString().slice(-6)}`);
    setRemarks("Monthly payroll remittance approved by Accounts Wing");
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (sal: StaffSalaryItem) => {
    setEditingSalary(sal);
    setStaffName(sal.staff_name);
    setStaffId(sal.staff_id);
    setDesignation(sal.designation);
    setDepartment(sal.department);
    setBasicSalary(String(sal.basic_salary));
    setAllowances(String(sal.allowances));
    setDeductions(String(sal.deductions));
    setSalaryMonth(sal.salary_month);
    setPaymentDate(sal.payment_date);
    setPaymentStatus(sal.payment_status);
    setPaymentMethod(sal.payment_method);
    setReferenceNo(sal.reference_no || "");
    setRemarks(sal.remarks || "");
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenSlip = (sal: StaffSalaryItem) => {
    setSelectedSlip(sal);
    setSlipModalOpen(true);
  };

  const handleSubmitSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!staffName.trim()) errs.staffName = "Staff name is required";
    if (!staffId.trim()) errs.staffId = "Staff ID is required";
    if (!basicSalary || basicNum <= 0) errs.basicSalary = "Enter valid basic salary (₹)";

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        staff_name: staffName.trim(),
        staff_id: staffId.trim(),
        designation,
        department,
        basic_salary: basicNum,
        allowances: allowNum,
        deductions: dedNum,
        salary_month: salaryMonth,
        payment_date: paymentDate,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        reference_no: referenceNo.trim(),
        remarks: remarks.trim(),
      };

      if (editingSalary) {
        await onUpdateSalary(editingSalary.id, payload);
      } else {
        await onCreateSalary(payload);
      }
      setModalOpen(false);
    } catch (err: any) {
      let displayMsg = err.message || "Failed to save salary record";
      if (
        displayMsg.includes("Missing or insufficient permissions") ||
        displayMsg.includes("PERMISSION_DENIED")
      ) {
        displayMsg =
          "Permission Denied: Only authorized Admin and Accountant accounts are permitted to process staff salaries.";
      }
      setFormErrors({ form: displayMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Salaries
  const filteredSalaries = salaries.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !q ||
      s.staff_name?.toLowerCase().includes(q) ||
      s.staff_id?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.designation?.toLowerCase().includes(q);
    const matchesDept = selectedDepartment === "All" || s.department === selectedDepartment;
    const matchesMonth = !selectedMonth || s.salary_month === selectedMonth;
    return matchesQ && matchesDept && matchesMonth;
  });

  const totalPayroll = filteredSalaries.reduce((sum, s) => sum + Number(s.net_salary || 0), 0);
  const paidCount = filteredSalaries.filter((s) => s.payment_status === "Paid").length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Payroll Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600">
              Staff Payroll Sub-Module
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Staff & Faculty Salary Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Compute automated net salaries, allowances, statutory deductions, and sync with central expenses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Process New Salary
          </button>
        </div>
      </div>

      {/* 2. Payroll Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Filtered Total Payroll
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalPayroll.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{filteredSalaries.length} staff salary records in view</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Disbursement Status
          </span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {paidCount} / {filteredSalaries.length} Disbursed
          </h3>
          <p className="text-xs text-emerald-600 mt-0.5 font-medium">Synced into Central Expenses ledger</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Active Payroll Month
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {selectedMonth || "All Months"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Automated Basic + DA + HRA − PF formula</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty name, staff ID, designation, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-hidden"
          />
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedMonth("");
              setSelectedDepartment("All");
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 4. Staff Salaries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Basic Salary</th>
                <th className="py-3.5 px-4">Allowances</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Month / Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading payroll records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Users className="w-7 h-7 text-slate-300" />
                      <p className="font-bold text-slate-700">No staff salary records found</p>
                      <p className="text-[11px] text-slate-400">Click "Process New Salary" to disburse payroll</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{sal.staff_name}</p>
                      <p className="text-[11px] font-mono text-blue-600 font-semibold">{sal.staff_id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{sal.designation}</p>
                      <p className="text-[11px] text-slate-500">{sal.department}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      ₹{Number(sal.basic_salary).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">
                      +₹{Number(sal.allowances).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-rose-600 font-semibold">
                      -₹{Number(sal.deductions).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 text-sm bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        ₹{Number(sal.net_salary).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{sal.salary_month}</p>
                      <p className="text-[11px] text-slate-500">{sal.payment_date}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          sal.payment_status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {sal.payment_status === "Paid" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                        )}
                        {sal.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSlip(sal)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Payslip"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(sal)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Salary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSalary(sal.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Salary Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Process / Edit Salary Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {editingSalary ? "Edit Staff Salary Entry" : "Process Staff Salary & Payroll"}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Automated Net Salary Calculation: Basic + Allowances − Deductions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSalary} className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto">
              {/* Real Staff Picker */}
              {!editingSalary && realStaff.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Quick Select Faculty Member
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {realStaff.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectStaff(p)}
                        className={`p-2 rounded-xl text-left border text-xs transition-all ${
                          staffId === (p.employeeId || p.id)
                            ? "bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.employeeId || p.id} • {p.designation}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Staff Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
                  />
                  {formErrors.staffName && <p className="text-xs text-rose-600 mt-1">{formErrors.staffName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Staff Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-mono font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
                  />
                  {formErrors.staffId && <p className="text-xs text-rose-600 mt-1">{formErrors.staffId}</p>}
                </div>
              </div>

              {/* Designation & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Formula & Numbers Calculator Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Salary Breakup & Automated Computation
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-700">Net = Basic + DA/HRA − PF/Tax</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Basic Salary (₹) *</label>
                    <input
                      type="number"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">+ Allowances (₹)</label>
                    <input
                      type="number"
                      value={allowances}
                      onChange={(e) => setAllowances(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">− Deductions (₹)</label>
                    <input
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs font-bold text-rose-700 focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                </div>

                {/* Net Salary Calculation Callout */}
                <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950">Automated Net Payable:</span>
                  <span className="text-lg font-black text-blue-900">
                    ₹{calculatedNetSalary.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Month, Date, Method, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Salary Month
                  </label>
                  <input
                    type="month"
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-bold text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-bold text-slate-800 focus:bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Reference & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bank UTR / NEFT Reference #
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-mono font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Remarks / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Regular monthly faculty remittance"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : editingSalary ? "Update Salary Record" : "Confirm & Save Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Payslip Modal (Printable) */}
      {slipModalOpen && selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Faculty / Staff Payslip</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Payslip
                </button>
                <button
                  onClick={() => setSlipModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-slate-200">
                <h2 className="text-sm font-black text-slate-900 uppercase">Our College of Engineering</h2>
                <p className="text-[11px] text-slate-500">Autonomous Institution • Payroll Statement for {selectedSlip.salary_month}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block">Staff Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedSlip.staff_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Employee ID</span>
                  <span className="font-mono font-bold text-blue-700">{selectedSlip.staff_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Designation</span>
                  <span className="font-semibold text-slate-800">{selectedSlip.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Department</span>
                  <span className="font-semibold text-slate-800">{selectedSlip.department}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">Earnings / Additions</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                      <th className="py-2 px-3 text-left">Deductions</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-2 px-3 font-medium">Basic Pay</td>
                      <td className="py-2 px-3 text-right font-bold">₹{Number(selectedSlip.basic_salary).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 font-medium text-rose-700">Provident Fund (PF)</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">₹{(Number(selectedSlip.deductions) * 0.6).toFixed(0)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-emerald-700">DA & HRA Allowances</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">₹{Number(selectedSlip.allowances).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 font-medium text-rose-700">Professional Tax / TDS</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">₹{(Number(selectedSlip.deductions) * 0.4).toFixed(0)}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="py-2 px-3">Total Earnings</td>
                      <td className="py-2 px-3 text-right">₹{(Number(selectedSlip.basic_salary) + Number(selectedSlip.allowances)).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3">Total Deductions</td>
                      <td className="py-2 px-3 text-right text-rose-700">₹{Number(selectedSlip.deductions).toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-blue-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-200 uppercase font-bold block">Net Salary Paid</span>
                  <span className="text-xl font-black">₹{Number(selectedSlip.net_salary).toLocaleString("en-IN")}</span>
                </div>
                <div className="text-right text-[11px] text-blue-200">
                  <p>Paid via: {selectedSlip.payment_method}</p>
                  <p className="font-mono">Ref: {selectedSlip.reference_no || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSlipModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
