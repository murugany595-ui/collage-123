const fs = require("fs");
const path = require("path");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  writeBatch,
  collection,
  getDocs,
} = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

const appletConfig = require("../firebase-applet-config.json");
const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
};

const app = initializeApp(firebaseConfig, "importer_app");
const auth = getAuth(app);
const db = getFirestore(app, appletConfig.firestoreDatabaseId || "(default)");

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] !== undefined ? cols[idx] : "";
    });
    rows.push(obj);
  }
  return rows;
}

function normalizeDept(raw) {
  if (!raw) return "aids";
  const s = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s.includes("ai") || s.includes("data")) return "aids";
  if (s.includes("cse") || s.includes("computer")) return "cse";
  if (s.includes("ece") || s.includes("communication")) return "ece";
  if (s.includes("eee") || s.includes("electrical")) return "eee";
  if (s.includes("mech") || s.includes("mechanical")) return "mech";
  if (s.includes("civil")) return "civil";
  if (s.includes("it") || s.includes("info")) return "it";
  return s || "aids";
}

async function runImport() {
  console.log("Starting Firebase CSV Import Process...");

  // Sign in as admin
  try {
    await signInWithEmailAndPassword(auth, "admin@college.edu", "Admin@123");
    console.log("Authenticated as admin@college.edu successfully.");
  } catch (err) {
    try {
      await signInWithEmailAndPassword(auth, "admin@college.edu", "Admin@123456");
      console.log("Authenticated with Admin@123456");
    } catch (e2) {
      console.log("Proceeding with direct connection...", err.message);
    }
  }

  // 0. Ensure Department records exist
  const deptConfigs = [
    { id: "aids", code: "AIDS", name: "Artificial Intelligence and Data Science" },
    { id: "cse", code: "CSE", name: "Computer Science and Engineering" },
    { id: "ece", code: "ECE", name: "Electronics and Communication Engineering" },
    { id: "eee", code: "EEE", name: "Electrical and Electronics Engineering" },
    { id: "mech", code: "MECH", name: "Mechanical Engineering" },
    { id: "civil", code: "CIVIL", name: "Civil Engineering" },
    { id: "it", code: "IT", name: "Information Technology" },
  ];
  for (const d of deptConfigs) {
    await setDoc(doc(db, "departments", d.id), {
      id: d.id,
      code: d.code,
      name: d.name,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  console.log("Departments verified/initialized in Firestore.");

  // 1. IMPORT EXPENSES (135 records into adminExpenses)
  const expensesPath = path.join(__dirname, "../data/expenses_50students_10staffs.csv");
  if (fs.existsSync(expensesPath)) {
    const raw = fs.readFileSync(expensesPath, "utf-8");
    const records = parseCsv(raw);
    console.log(`Found ${records.length} expense records in CSV.`);

    let batch = writeBatch(db);
    let count = 0;
    for (const r of records) {
      if (!r.expense_id) continue;
      const amount = Number(r.amount_inr || 0);
      const monthStr = r.month || "2026-01";
      const yearNum = parseInt(monthStr.slice(0, 4), 10) || 2026;
      
      const expData = {
        id: r.expense_id,
        expenseId: r.expense_id,
        expense_id: r.expense_id,
        month: monthStr,
        date: `${monthStr}-01`,
        year: yearNum,
        category: r.category,
        amount_inr: amount,
        amount: amount,
        staff_id: r.staff_id || "",
        staff_name: r.staff_name || "",
        paid_to: r.staff_name || r.category,
        title: r.description || (r.staff_name ? `Salary: ${r.staff_name} (${monthStr})` : `${r.category} - ${monthStr}`),
        description: r.description || "",
        payment_status: "Paid",
        createdBy: "admin",
        createdAt: `${monthStr}-05T10:00:00.000Z`,
        updatedAt: new Date().toISOString(),
      };

      // Primary collection: adminExpenses
      const adminRef = doc(db, "adminExpenses", r.expense_id);
      batch.set(adminRef, expData, { merge: true });
      count++;
    }
    await batch.commit();
    console.log(`Successfully imported ${count} expense records into 'adminExpenses' collection!`);
  }

  // Map student_id to department for fee mapping
  const studentDeptMap = {};

  // 2. IMPORT STUDENTS (50 records into departments/{dept}/students/{id})
  const studentsPath = path.join(__dirname, "../data/students_50.csv");
  if (fs.existsSync(studentsPath)) {
    const raw = fs.readFileSync(studentsPath, "utf-8");
    const records = parseCsv(raw);
    console.log(`Found ${records.length} student records in CSV.`);

    let batch = writeBatch(db);
    let count = 0;
    for (const r of records) {
      if (!r.student_id) continue;
      const deptId = normalizeDept(r.department);
      studentDeptMap[r.student_id] = deptId;

      const studentData = {
        id: r.student_id,
        studentId: r.student_id,
        student_id: r.student_id,
        name: r.student_name,
        student_name: r.student_name,
        department: deptId,
        year: r.year,
        registerNumber: r.register_id,
        register_id: r.register_id,
        rollNo: r.register_id,
        dateOfBirth: r.date_of_birth,
        dob: r.date_of_birth,
        phone: r.phone,
        status: (r.status || "active").toLowerCase(),
        email: `${r.register_id.toLowerCase()}@student.college.edu`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const deptStuRef = doc(db, "departments", deptId, "students", r.student_id);
      batch.set(deptStuRef, studentData, { merge: true });
      count++;
    }
    await batch.commit();
    console.log(`Successfully imported ${count} students into department subcollections!`);
  }

  // 3. IMPORT STUDENT FEES (50 records into departments/{dept}/fees/{id})
  const feesPath = path.join(__dirname, "../data/student_fees_50.csv");
  if (fs.existsSync(feesPath)) {
    const raw = fs.readFileSync(feesPath, "utf-8");
    const records = parseCsv(raw);
    console.log(`Found ${records.length} fee records in CSV.`);

    let batch = writeBatch(db);
    let count = 0;
    for (const r of records) {
      if (!r.fee_id) continue;
      const deptId = studentDeptMap[r.student_id] || "aids";
      const totalFee = Number(r.total_fee || 0);
      const paidAmount = Number(r.paid_amount || 0);
      const pendingAmount = Number(r.pending_amount !== undefined ? r.pending_amount : (totalFee - paidAmount));

      const feeData = {
        id: r.fee_id,
        feeId: r.fee_id,
        fee_id: r.fee_id,
        studentId: r.student_id,
        student_id: r.student_id,
        department: deptId,
        academicYear: r.academic_year,
        academic_year: r.academic_year,
        amount: totalFee,
        total_fee: totalFee,
        paidAmount: paidAmount,
        paid_amount: paidAmount,
        balance: pendingAmount,
        pending_amount: pendingAmount,
        dueDate: r.due_date,
        due_date: r.due_date,
        paymentStatus: r.payment_status || (pendingAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending"),
        payment_status: r.payment_status || (pendingAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending"),
        feeType: "Tuition & Academic Fee",
        updatedAt: new Date().toISOString(),
      };

      const deptFeeRef = doc(db, "departments", deptId, "fees", r.fee_id);
      batch.set(deptFeeRef, feeData, { merge: true });
      count++;
    }
    await batch.commit();
    console.log(`Successfully imported ${count} fee records into department subcollections!`);
  }

  // 4. IMPORT STAFF (10 records into departments/{dept}/staff/{id})
  const staffsPath = path.join(__dirname, "../data/staffs_10.csv");
  if (fs.existsSync(staffsPath)) {
    const raw = fs.readFileSync(staffsPath, "utf-8");
    const records = parseCsv(raw);
    console.log(`Found ${records.length} staff records in CSV.`);

    let batch = writeBatch(db);
    let count = 0;
    for (const r of records) {
      if (!r.staff_id) continue;
      const deptId = normalizeDept(r.department);
      const salary = Number(r.monthly_salary || 0);

      const staffData = {
        id: r.staff_id,
        staff_id: r.staff_id,
        employeeId: r.staff_id,
        name: r.staff_name,
        staff_name: r.staff_name,
        department: deptId,
        designation: r.designation,
        salary: salary,
        monthly_salary: salary,
        joiningDate: r.joining_date,
        joining_date: r.joining_date,
        status: r.status || "Active",
        email: `${r.staff_id.toLowerCase()}@college.edu`,
        updatedAt: new Date().toISOString(),
      };

      const deptStaffRef = doc(db, "departments", deptId, "staff", r.staff_id);
      batch.set(deptStaffRef, staffData, { merge: true });
      count++;
    }
    await batch.commit();
    console.log(`Successfully imported ${count} staff records into department subcollections!`);
  }

  console.log("=== ALL CSV DATA IMPORTED SUCCESSFULLY TO FIRESTORE! ===");
}

runImport()
  .then(() => {
    console.log("Import script finished.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import script failed:", err);
    process.exit(1);
  });
