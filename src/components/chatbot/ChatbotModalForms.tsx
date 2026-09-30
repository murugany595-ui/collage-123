import React, { useState } from "react";
import {
  X,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  UserCheck,
  Building,
  CreditCard,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { requestService, StudentRequest } from "../../services/firebase/requestService";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  role: string;
  onSuccess: (message: string, reqId?: string) => void;
}

// 1. FEE EXTENSION REQUEST MODAL
export const FeeExtensionModal: React.FC<
  BaseModalProps & { defaultDueDate?: string }
> = ({ isOpen, onClose, user, role, onSuccess, defaultDueDate }) => {
  const [studentName, setStudentName] = useState(user?.name || "Kavitha R");
  const [registerNumber, setRegisterNumber] = useState(
    user?.rollNo || user?.registerNumber || "21AD045"
  );
  const [department, setDepartment] = useState(
    user?.department?.toUpperCase() || "AIDS"
  );
  const [year, setYear] = useState(user?.year || "3rd Year (Semester 6)");
  const [currentFeeDueDate, setCurrentFeeDueDate] = useState(
    defaultDueDate || "2026-08-30"
  );
  const [requestedExtensionDate, setRequestedExtensionDate] = useState("2026-09-30");
  const [reasonCategory, setReasonCategory] = useState("Financial Difficulty");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [supportingDocName, setSupportingDocName] = useState<string>("");
  const [signature, setSignature] = useState(user?.name || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      setError("Please confirm and acknowledge the declaration checkbox.");
      return;
    }
    if (!requestedExtensionDate) {
      setError("Please specify the requested extension date.");
      return;
    }
    if (!signature.trim()) {
      setError("Please enter your signature / name confirmation.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const reqId = await requestService.createRequest({
        category: "fee_extension",
        userId: user?.id || user?.uid || "",
        userRole: role,
        userEmail: user?.email || "",
        studentId: user?.id || user?.uid,
        studentName,
        registerNumber,
        department,
        year,
        currentFeeDueDate,
        requestedExtensionDate,
        reason: `${reasonCategory}: ${reason || "Extension requested for college fee balance"}`,
        remarks,
        supportingDocName,
        signature,
        status: "Pending",
      });

      onSuccess(
        `Fee extension request submitted successfully! (Reference: ${reqId}). The Accounts and Admin department will review your request.`,
        reqId
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit fee extension request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Fee Extension Request Form</h3>
              <p className="text-xs text-slate-500">Official request for extension of fee payment deadline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info Card */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              Student Information (Auto-populated)
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500">Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500">Register Number</label>
                <input
                  type="text"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500">Year / Semester</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-medium">Current Fee Due Date</label>
              <input
                type="date"
                value={currentFeeDueDate}
                onChange={(e) => setCurrentFeeDueDate(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                required
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium">Requested Extension Date *</label>
              <input
                type="date"
                value={requestedExtensionDate}
                onChange={(e) => setRequestedExtensionDate(e.target.value)}
                className="w-full mt-1 p-2 bg-white border border-blue-300 focus:border-blue-500 rounded-lg text-slate-800 font-semibold"
                required
              />
            </div>
          </div>

          {/* Reason Category */}
          <div>
            <label className="text-slate-700 font-medium">Reason for Extension *</label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="Financial Difficulty">Financial Hardship / Budget Constraints</option>
              <option value="Bank Loan in Process">Educational Bank Loan Under Processing</option>
              <option value="Government Scholarship Awaited">State/Central Govt Scholarship Pending</option>
              <option value="Family Emergency">Family Emergency / Medical Expenses</option>
              <option value="Remittance Delay">Parent Outstation / Wire Transfer Delay</option>
              <option value="Other">Other Specific Reason</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-medium">Detailed Explanation</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly state why the extension is required and the expected date of settlement..."
              className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Supporting Document */}
          <div>
            <label className="text-slate-700 font-medium">Supporting Document (Optional)</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="cursor-pointer px-3 py-2 border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 rounded-lg text-slate-600 flex items-center gap-2 transition">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>{supportingDocName || "Attach parent letter / bank loan letter"}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSupportingDocName(file.name);
                  }}
                />
              </label>
              {supportingDocName && (
                <button
                  type="button"
                  onClick={() => setSupportingDocName("")}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Optional: Proof of educational loan, parent declaration letter or medical certificate.
            </p>
          </div>

          {/* Signature & Declaration */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div>
              <label className="text-slate-700 font-medium">Applicant Signature (Full Name) *</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full legal name to sign digitally"
                className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                required
              />
            </div>
            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-600 leading-tight">
                I declare that the information provided is true to the best of my knowledge. I commit to clearing the full outstanding college fee balance on or before the requested extension date.
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. LEAVE REQUEST MODAL
export const LeaveRequestModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  user,
  role,
  onSuccess,
}) => {
  const [name, setName] = useState(user?.name || "Student");
  const [idNumber, setIdNumber] = useState(user?.rollNo || user?.employeeId || "21AD045");
  const [leaveType, setLeaveType] = useState("Medical Leave");
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please enter the reason for leave.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const reqId = await requestService.createRequest({
        category: "leave",
        userId: user?.id || user?.uid || "",
        userRole: role,
        userEmail: user?.email || "",
        studentId: user?.id || user?.uid,
        studentName: name,
        registerNumber: idNumber,
        department: user?.department || "AIDS",
        leaveType,
        fromDate,
        toDate,
        reason,
        remarks,
        status: "Pending",
      });
      onSuccess(`Leave application submitted successfully! (Reference: ${reqId})`, reqId);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Apply Leave Request</h3>
              <p className="text-xs text-slate-500">Student & Staff Leave Application</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600">Applicant Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-slate-600">Register / ID</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
            >
              <option value="Medical Leave">Medical / Sick Leave</option>
              <option value="On Duty (OD)">On Duty (OD) - Academic / Project / Sports</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Family Function">Family Function / Personal</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-slate-600">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600">Reason for Leave *</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State reason..."
              className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {submitting ? "Submitting..." : "Submit Leave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. ATTENDANCE CORRECTION MODAL
export const AttendanceCorrectionModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  user,
  role,
  onSuccess,
}) => {
  const [studentName, setStudentName] = useState(user?.name || "Kavitha R");
  const [registerNumber, setRegisterNumber] = useState(user?.rollNo || "21AD045");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState("Absent");
  const [requestedCorrection, setRequestedCorrection] = useState("Present");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const reqId = await requestService.createRequest({
        category: "attendance_correction",
        userId: user?.id || user?.uid || "",
        userRole: role,
        studentName,
        registerNumber,
        department: user?.department || "AIDS",
        attendanceDate,
        currentAttendanceStatus,
        requestedCorrection,
        reason,
        status: "Pending",
      });
      onSuccess(`Attendance correction request submitted! (Reference: ${reqId})`, reqId);
      onClose();
    } catch {
      alert("Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <h3 className="font-bold text-slate-900 text-base">Attendance Correction Request</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600">Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-slate-600">Register Number</label>
              <input
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-600">Date of Discrepancy</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600">Marked Status</label>
              <select
                value={currentAttendanceStatus}
                onChange={(e) => setCurrentAttendanceStatus(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              >
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600">Requested Correction</label>
              <select
                value={requestedCorrection}
                onChange={(e) => setRequestedCorrection(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              >
                <option value="Present">Present</option>
                <option value="On Duty (OD)">On Duty (OD)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-600">Reason / Proof</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attended symposium with OD sanction, or biometric mismatch..."
              className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              {submitting ? "Submitting..." : "Submit Correction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. PAYMENT ISSUE MODAL
export const PaymentIssueModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  user,
  role,
  onSuccess,
}) => {
  const [studentName, setStudentName] = useState(user?.name || "Student");
  const [registerNumber, setRegisterNumber] = useState(user?.rollNo || "21AD045");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("1250");
  const [issueDescription, setIssueDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const reqId = await requestService.createRequest({
        category: "payment_issue",
        userId: user?.id || user?.uid || "",
        userRole: role,
        studentName,
        registerNumber,
        paymentReference,
        paymentDate,
        amount: Number(amount),
        issueDescription,
        status: "Pending",
      });
      onSuccess(`Payment issue ticket submitted! (Reference: ${reqId})`, reqId);
      onClose();
    } catch {
      alert("Failed to submit payment issue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <h3 className="font-bold text-slate-900 text-base">Report Fee Payment Issue</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600">Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-slate-600">UTR / Reference No *</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. UTR12345678"
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600">Transaction Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-slate-600">Debited Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-600">Issue Description</label>
            <textarea
              rows={2}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="e.g. Money was debited from bank account, but portal status still shows Pending..."
              className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              {submitting ? "Submitting..." : "Report Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 5. VIEW ALL REQUESTS & ADMIN/ACCOUNTANT APPROVAL MODAL
export const RequestStatusViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: any;
  role: string;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
}> = ({ isOpen, onClose, user, role, onShowToast }) => {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<StudentRequest | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [approvedDate, setApprovedDate] = useState("2026-09-30");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canManage = role === "admin" || role === "accountant";

  const loadRequests = async () => {
    try {
      setLoading(true);
      const items = await requestService.getAllRequests(
        role,
        user?.id || user?.uid
      );
      setRequests(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, role, user?.id]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (
    reqId: string,
    status: StudentRequest["status"]
  ) => {
    try {
      setProcessingId(reqId);
      await requestService.updateRequestStatus(reqId, {
        status,
        adminRemarks: adminRemarks || (status === "Approved" ? "Approved by Accounts Office" : "Rejected"),
        approvedExtensionDate: status === "Approved" ? approvedDate : undefined,
        reviewedBy: user?.name || role,
      });
      onShowToast(`Request ${reqId} marked as ${status}!`, "success");
      setSelectedReq(null);
      await loadRequests();
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update request", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {canManage ? "Manage Submitted Requests" : "My Requests & Application Status"}
            </h3>
            <p className="text-xs text-slate-500">
              {canManage
                ? "Review and approve/reject fee extensions and student requests"
                : "Live tracking of your fee extensions, leave, and service applications"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No requests found in the system.
            </div>
          ) : (
            requests.map((r) => {
              const isFeeExt = r.category === "fee_extension";
              const isPending = r.status === "Pending";
              const isApproved = r.status === "Approved";

              return (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white space-y-2.5 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 capitalize">
                          {r.category.replace("_", " ")} Request
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">#{r.id}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {r.studentName} ({r.registerNumber}) • {r.department} • {r.year}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isPending
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {isFeeExt && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Original Due Date</span>
                        <span className="font-medium text-slate-700">{r.currentFeeDueDate || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Requested Date</span>
                        <span className="font-semibold text-blue-600">{r.requestedExtensionDate || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Approved Due Date</span>
                        <span className="font-bold text-emerald-600">{r.approvedExtensionDate || "Pending Review"}</span>
                      </div>
                    </div>
                  )}

                  {r.reason && (
                    <p className="text-slate-600 text-[11px] bg-slate-50/50 p-2 rounded-md">
                      <strong className="text-slate-700">Reason:</strong> {r.reason}
                    </p>
                  )}

                  {r.adminRemarks && (
                    <p className="text-slate-700 text-[11px] bg-blue-50/60 border border-blue-100 p-2 rounded-md">
                      <strong className="text-blue-800">Admin Remarks:</strong> {r.adminRemarks}{" "}
                      {r.reviewedBy ? `(by ${r.reviewedBy})` : ""}
                    </p>
                  )}

                  {/* Actions for Accountant / Admin */}
                  {canManage && isPending && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-slate-500 text-[11px]">Approved Date:</label>
                        <input
                          type="date"
                          defaultValue={r.requestedExtensionDate || approvedDate}
                          onChange={(e) => setApprovedDate(e.target.value)}
                          className="p-1 border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(r.id, "Approved")}
                          disabled={processingId === r.id}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-xs transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r.id, "Rejected")}
                          disabled={processingId === r.id}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium text-xs transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
