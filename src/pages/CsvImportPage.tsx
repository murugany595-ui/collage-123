import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Users,
  CreditCard,
  Briefcase,
  Receipt,
  FileCheck,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  getDoc,
} from "firebase/firestore";

interface CsvImportPageProps {
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
  onNavigate?: (tab: string) => void;
}

export const CsvImportPage: React.FC<CsvImportPageProps> = ({
  onShowToast = () => {},
  onNavigate = () => {},
}) => {
  // Live stats in Firestore
  const [counts, setCounts] = useState({
    students: 0,
    student_fees: 0,
    staffs: 0,
    expenses: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState<boolean>(true);

  // Import states
  const [importingCollection, setImportingCollection] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    collection: string;
    total: number;
    processed: number;
    success: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Bundled Sync Status
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);

  // Fetch current Firestore counts
  const refreshCounts = async () => {
    setLoadingCounts(true);
    try {
      // 1. Admin Expenses
      const expSnap = await getDocs(collection(db, "adminExpenses")).catch(() => ({ size: 0 } as any));
      
      // 2. Department counts
      const depts = ["aids", "cse", "ece", "eee", "mech", "civil", "it"];
      let totalStudents = 0;
      let totalFees = 0;
      let totalStaffs = 0;

      await Promise.all(
        depts.map(async (dept) => {
          try {
            const [s, f, st] = await Promise.all([
              getDocs(collection(db, "departments", dept, "students")).catch(() => ({ size: 0 })),
              getDocs(collection(db, "departments", dept, "fees")).catch(() => ({ size: 0 })),
              getDocs(collection(db, "departments", dept, "staff")).catch(() => ({ size: 0 })),
            ]);
            totalStudents += s.size;
            totalFees += f.size;
            totalStaffs += st.size;
          } catch {}
        })
      );

      // Check top level fallbacks if any
      try {
        const topStu = await getDocs(collection(db, "students")).catch(() => ({ size: 0 }));
        if (topStu.size > totalStudents) totalStudents = topStu.size;
      } catch {}
      try {
        const topFee = await getDocs(collection(db, "student_fees")).catch(() => ({ size: 0 }));
        if (topFee.size > totalFees) totalFees = topFee.size;
      } catch {}
      try {
        const topStaff = await getDocs(collection(db, "staffs")).catch(() => ({ size: 0 }));
        if (topStaff.size > totalStaffs) totalStaffs = topStaff.size;
      } catch {}

      setCounts({
        students: totalStudents,
        student_fees: totalFees,
        staffs: totalStaffs,
        expenses: expSnap.size,
      });
    } catch (err: any) {
      console.warn("Could not fetch collection counts:", err);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  // Helper CSV parser
  const parseCsvText = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] !== undefined ? values[idx] : "";
      });
      rows.push(obj);
    }

    return { headers, rows };
  };

  // Helper to validate and import rows into Firestore
  const processRowsIntoFirestore = async (
    collectionName: "students" | "student_fees" | "staffs" | "expenses",
    rows: Record<string, string>[]
  ) => {
    setImportingCollection(collectionName);
    const progress = {
      collection: collectionName,
      total: rows.length,
      processed: 0,
      success: 0,
      skipped: 0,
      errors: [] as string[],
    };
    setImportProgress({ ...progress });

    const BATCH_SIZE = 400; // Safe below Firestore 500 limit
    let batch = writeBatch(db);
    let opInBatch = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let docId = "";
      let payload: any = {};

      try {
        if (collectionName === "students") {
          docId = r.student_id;
          if (!docId) {
            progress.skipped++;
            continue;
          }
          payload = {
            student_id: r.student_id,
            id: r.student_id,
            student_name: r.student_name,
            name: r.student_name,
            department: r.department,
            year: r.year,
            register_id: r.register_id,
            registerNumber: r.register_id,
            rollNo: r.register_id,
            date_of_birth: r.date_of_birth,
            dob: r.date_of_birth,
            phone: r.phone,
            status: r.status || "Active",
            email: `${r.register_id.toLowerCase()}@student.college.edu`,
            updatedAt: new Date().toISOString(),
          };
        } else if (collectionName === "student_fees") {
          docId = r.fee_id;
          if (!docId) {
            progress.skipped++;
            continue;
          }
          const totalFee = Number(r.total_fee || 0);
          const paidAmount = Number(r.paid_amount || 0);
          const pendingAmount =
            r.pending_amount !== undefined
              ? Number(r.pending_amount)
              : Math.max(0, totalFee - paidAmount);

          payload = {
            fee_id: r.fee_id,
            id: r.fee_id,
            student_id: r.student_id,
            studentId: r.student_id,
            academic_year: r.academic_year,
            academicYear: r.academic_year,
            total_fee: totalFee,
            amount: totalFee,
            paid_amount: paidAmount,
            paidAmount: paidAmount,
            pending_amount: pendingAmount,
            balance: pendingAmount,
            due_date: r.due_date,
            dueDate: r.due_date,
            payment_status:
              r.payment_status ||
              (pendingAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending"),
            feeType: "Tuition & Academic Fee",
            updatedAt: new Date().toISOString(),
          };
        } else if (collectionName === "staffs") {
          docId = r.staff_id;
          if (!docId) {
            progress.skipped++;
            continue;
          }
          const monthlySalary = Number(r.monthly_salary || 0);
          payload = {
            staff_id: r.staff_id,
            id: r.staff_id,
            employeeId: r.staff_id,
            staff_name: r.staff_name,
            name: r.staff_name,
            department: r.department,
            designation: r.designation,
            monthly_salary: monthlySalary,
            salary: monthlySalary,
            joining_date: r.joining_date,
            joiningDate: r.joining_date,
            status: r.status || "Active",
            email: `${r.staff_id.toLowerCase()}@college.edu`,
            updatedAt: new Date().toISOString(),
          };
        } else if (collectionName === "expenses") {
          docId = r.expense_id;
          if (!docId) {
            progress.skipped++;
            continue;
          }
          const amt = Number(r.amount_inr || 0);
          payload = {
            expense_id: r.expense_id,
            id: r.expense_id,
            month: r.month,
            category: r.category,
            amount_inr: amt,
            amount: amt,
            staff_id: r.staff_id || "",
            staff_name: r.staff_name || "",
            paid_to: r.staff_name || r.category,
            title: r.description || `${r.category} - ${r.month}`,
            description: r.description || "",
            payment_status: "Paid",
            date: `${r.month}-01`,
            updatedAt: new Date().toISOString(),
          };
        }

        // Set in batch
        if (collectionName === "expenses") {
          const adminRef = doc(db, "adminExpenses", docId);
          batch.set(adminRef, payload, { merge: true });
          opInBatch++;
          try {
            const expRef = doc(db, "expenses", docId);
            batch.set(expRef, payload, { merge: true });
            opInBatch++;
          } catch {}
        } else {
          const docRef = doc(db, collectionName, docId);
          batch.set(docRef, payload, { merge: true });
          opInBatch++;
        }
        progress.success++;

        if (opInBatch >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(db);
          opInBatch = 0;
        }
      } catch (err: any) {
        progress.errors.push(`Row ${i + 1} (${docId}): ${err.message}`);
      }

      progress.processed++;
      if (i % 10 === 0 || i === rows.length - 1) {
        setImportProgress({ ...progress });
      }
    }

    if (opInBatch > 0) {
      await batch.commit();
    }

    setImportProgress({ ...progress });
    setImportingCollection(null);
    await refreshCounts();
    onShowToast(`Successfully processed ${progress.success} records into '${collectionName}'!`, "success");
  };

  // One-click Sync All Bundled Datasets
  const handleSyncBundled = async () => {
    setIsSyncingAll(true);
    try {
      // Fetch files from server or local bundled files
      const [stuRes, feeRes, staffRes, expRes] = await Promise.all([
        fetch("/data/students_50.csv"),
        fetch("/data/student_fees_50.csv"),
        fetch("/data/staffs_10.csv"),
        fetch("/data/expenses_50students_10staffs.csv"),
      ]);

      const stuText = await stuRes.text();
      const feeText = await feeRes.text();
      const staffText = await staffRes.text();
      const expText = await expRes.text();

      // Process students
      const { rows: stuRows } = parseCsvText(stuText);
      await processRowsIntoFirestore("students", stuRows);

      // Process fees
      const { rows: feeRows } = parseCsvText(feeText);
      await processRowsIntoFirestore("student_fees", feeRows);

      // Process staff
      const { rows: staffRows } = parseCsvText(staffText);
      await processRowsIntoFirestore("staffs", staffRows);

      // Process expenses
      const { rows: expRows } = parseCsvText(expText);
      await processRowsIntoFirestore("expenses", expRows);

      onShowToast("All 4 bundled datasets synced with Firebase Cloud Firestore!", "success");
    } catch (err: any) {
      onShowToast("Sync error: " + err.message, "error");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Manual File Upload Handler
  const handleFileUpload = (
    collectionName: "students" | "student_fees" | "staffs" | "expenses",
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const { headers, rows } = parseCsvText(content);

      // Validate headers
      const requiredMap: Record<string, string[]> = {
        students: ["student_id", "student_name", "department", "register_id"],
        student_fees: ["fee_id", "student_id", "academic_year", "total_fee"],
        staffs: ["staff_id", "staff_name", "department", "monthly_salary"],
        expenses: ["expense_id", "month", "category", "amount_inr"],
      };

      const required = requiredMap[collectionName];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        onShowToast(
          `Invalid CSV headers for ${collectionName}. Missing required: ${missing.join(", ")}`,
          "error"
        );
        return;
      }

      await processRowsIntoFirestore(collectionName, rows);
    };
    reader.readAsText(file);
  };

  // Export to CSV
  const handleExportCsv = async (collectionName: string) => {
    try {
      const snap = await getDocs(collection(db, collectionName));
      if (snap.empty) {
        onShowToast(`No records found in '${collectionName}' to export.`, "info");
        return;
      }

      const docs = snap.docs.map((d) => d.data());
      const keys = Object.keys(docs[0] || {}).filter(
        (k) => typeof docs[0][k] !== "object"
      );

      let csv = keys.join(",") + "\n";
      docs.forEach((docData) => {
        const row = keys.map((k) => {
          const val = docData[k] !== undefined ? String(docData[k]) : "";
          return val.includes(",") ? `"${val}"` : val;
        });
        csv += row.join(",") + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${collectionName}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast(`Exported ${docs.length} records from '${collectionName}'!`, "success");
    } catch (err: any) {
      onShowToast("Export failed: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
              <Database className="w-3.5 h-3.5" />
              <span>Firebase Cloud Firestore Dataset Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">CSV Datasets Import & Export</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Verify, validate, import, and export institutional dataset collections into Google Cloud Firestore. Automatic deduplication and type safety enabled.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refreshCounts}
              disabled={loadingCounts}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCounts ? "animate-spin" : ""}`} />
              <span>Refresh Counts</span>
            </button>
            <button
              onClick={handleSyncBundled}
              disabled={isSyncingAll || !!importingCollection}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              {isSyncingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Sync All 4 Bundled Datasets</span>
            </button>
          </div>
        </div>

        {/* Live Counts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">students Collection</span>
            <div className="text-2xl font-black text-white mt-1">
              {loadingCounts ? "..." : counts.students}
            </div>
            <span className="text-[11px] text-indigo-300 font-medium">Expected: 50 Students</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">student_fees Collection</span>
            <div className="text-2xl font-black text-white mt-1">
              {loadingCounts ? "..." : counts.student_fees}
            </div>
            <span className="text-[11px] text-indigo-300 font-medium">Expected: 50 Fee Records</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">staffs Collection</span>
            <div className="text-2xl font-black text-white mt-1">
              {loadingCounts ? "..." : counts.staffs}
            </div>
            <span className="text-[11px] text-indigo-300 font-medium">Expected: 10 Staff Records</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">expenses Collection</span>
            <div className="text-2xl font-black text-white mt-1">
              {loadingCounts ? "..." : counts.expenses}
            </div>
            <span className="text-[11px] text-indigo-300 font-medium">Expected: 135 Expenses</span>
          </div>
        </div>
      </div>

      {/* Import Progress Notification */}
      {importProgress && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-indigo-900">
              Importing into '{importProgress.collection}' ({importProgress.processed} / {importProgress.total})
            </span>
            <span className="font-bold text-indigo-700">
              {Math.round((importProgress.processed / importProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
              style={{
                width: `${Math.round((importProgress.processed / importProgress.total) * 100)}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="text-emerald-700 font-semibold">✓ {importProgress.success} Success</span>
            <span className="text-amber-700 font-semibold">⚠ {importProgress.skipped} Skipped</span>
            {importProgress.errors.length > 0 && (
              <span className="text-rose-700 font-semibold">✕ {importProgress.errors.length} Errors</span>
            )}
          </div>
        </div>
      )}

      {/* 4 Cards for Individual Collection Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Students */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {counts.students} records in Firestore
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">1. students Collection</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Required Fields: <code className="text-indigo-600 font-mono">student_id, student_name, department, year, register_id, date_of_birth, phone, status</code>.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Upload students.csv</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload("students", e.target.files[0]);
                }}
              />
            </label>

            <button
              onClick={() => handleExportCsv("students")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Student Fees */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {counts.student_fees} records in Firestore
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">2. student_fees Collection</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Required Fields: <code className="text-indigo-600 font-mono">fee_id, student_id, academic_year, total_fee, paid_amount, pending_amount, due_date, payment_status</code>.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Upload student_fees.csv</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload("student_fees", e.target.files[0]);
                }}
              />
            </label>

            <button
              onClick={() => handleExportCsv("student_fees")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 3. Staffs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {counts.staffs} records in Firestore
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">3. staffs Collection</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Required Fields: <code className="text-indigo-600 font-mono">staff_id, staff_name, department, designation, monthly_salary, joining_date, status</code>.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Upload staffs.csv</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload("staffs", e.target.files[0]);
                }}
              />
            </label>

            <button
              onClick={() => handleExportCsv("staffs")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4. Expenses */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {counts.expenses} records in Firestore
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">4. expenses Collection</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Required Fields: <code className="text-indigo-600 font-mono">expense_id, month, category, amount_inr, staff_id, staff_name, description</code>.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Upload expenses.csv</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload("expenses", e.target.files[0]);
                }}
              />
            </label>

            <button
              onClick={() => handleExportCsv("expenses")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
