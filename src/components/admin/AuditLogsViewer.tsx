import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  User,
  Activity,
  Search,
  Filter,
  RefreshCw,
  FileText,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
} from "lucide-react";
import { auditService, AuditLogEntry } from "../../services/firebase/auditService";

export const AuditLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [activeLog, setActiveLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getRecentLogs(100);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const unsubscribe = auditService.subscribeToAuditLogs((liveLogs) => {
      setLogs(liveLogs);
      setLoading(false);
    }, 100);
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.affectedDocumentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = selectedRole === "all" || log.role === selectedRole;
    const matchesAction = selectedAction === "all" || log.action === selectedAction;

    return matchesSearch && matchesRole && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("DELETE")) return "bg-rose-100 text-rose-800 border-rose-200";
    if (action.includes("UPDATE") || action.includes("SAVE")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (action.includes("CREATE") || action.includes("COLLECT")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-400/30">
                <ShieldAlert className="w-4 h-4 text-violet-300" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                Immutable Firestore Trail
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-violet-800/80 text-violet-200 border border-violet-700">
                auditLogs/{`{logId}`}
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Administrative & Financial Audit Logs
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Cryptographically timestamped operational trace recording fee setting updates, expense disbursements, and payment receipts.
            </p>
          </div>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-violet-400" : ""}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, user email, document ID, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="accountant">Accountant</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700"
          >
            <option value="all">All Operations</option>
            <option value="CREATE_STUDENT">Student Creation</option>
            <option value="UPDATE_STUDENT">Student Update</option>
            <option value="DELETE_STUDENT">Student Deletion</option>
            <option value="CREATE_FEE_INVOICE">Fee Invoice Creation</option>
            <option value="UPDATE_FEE_INVOICE">Fee Invoice Edit</option>
            <option value="DELETE_FEE_INVOICE">Fee Invoice Deletion</option>
            <option value="FEE_PAYMENT_COLLECT">Fee Payment Collection</option>
            <option value="BATCH_GENERATE_FEES">Batch Fees Generation</option>
            <option value="FEE_SETTING_UPDATE">Fee Setting Update</option>
            <option value="FEE_CATEGORY_DELETE">Fee Category Delete</option>
            <option value="EXPENSE_CREATE">Expense Creation</option>
            <option value="EXPENSE_UPDATE">Expense Update</option>
            <option value="EXPENSE_DELETE">Expense Deletion</option>
          </select>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-violet-500 mb-2" />
            Loading audit security logs from Firestore...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No audit log entries matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Affected Document</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr key={log.id || log.logId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {log.userEmail || log.userId}
                        </div>
                        <span className="text-[10px] font-bold text-violet-600 uppercase">
                          {log.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {log.affectedDocumentId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {log.details || "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 font-bold transition text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-violet-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Audit Record Inspection</h3>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Operation</span>
                  <span className="font-black text-slate-900 text-sm">{activeLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Role</span>
                  <span className="font-black text-violet-700 uppercase">{activeLog.role}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">User ID / Email</span>
                  <span className="font-medium text-slate-700">{activeLog.userEmail || activeLog.userId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Affected ID</span>
                  <span className="font-mono font-bold text-slate-900">{activeLog.affectedDocumentId}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Details</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {activeLog.details || "No narrative details attached."}
                </p>
              </div>

              {activeLog.previousValue && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Previous Value</span>
                  <pre className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto">
                    {activeLog.previousValue}
                  </pre>
                </div>
              )}

              {activeLog.newValue && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">New Value</span>
                  <pre className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto">
                    {activeLog.newValue}
                  </pre>
                </div>
              )}

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Timestamp: {new Date(activeLog.timestamp).toISOString()}</span>
                <span>Log ID: {activeLog.logId || activeLog.id}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveLog(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
