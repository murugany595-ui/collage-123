import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { Toast, ToastType } from "./components/common/Toast";
import { CollectFeeModal } from "./components/modals/CollectFeeModal";
import { CreateInvoiceModal } from "./components/modals/CreateInvoiceModal";
import { ReceiptModal } from "./components/modals/ReceiptModal";
import { GraduationCap, ShieldAlert } from "lucide-react";

// Admin / Core Pages
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsListPage } from "./pages/StudentsListPage";
import { AddStudentPage } from "./pages/AddStudentPage";
import { EditStudentPage } from "./pages/EditStudentPage";
import { StudentDetailsPage } from "./pages/StudentDetailsPage";
import { FeesPage } from "./pages/FeesPage";
import { GenerateMonthlyFeesPage } from "./pages/GenerateMonthlyFeesPage";
import { PaymentApprovalPage } from "./pages/PaymentApprovalPage";
import { FeeCategoriesPage } from "./pages/FeeCategoriesPage";
import { ExpenseManagementPage } from "./pages/admin/ExpenseManagementPage";
import { ExamFeesPage } from "./pages/admin/ExamFeesPage";
import { AttendancePage } from "./pages/admin/AttendancePage";
import { ParentsPage } from "./pages/ParentsPage";
import { UsersPage } from "./pages/UsersPage";
import { AcademicInfoPage } from "./pages/AcademicInfoPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StaffManagementPage } from "./pages/StaffManagementPage";
import { CsvImportPage } from "./pages/CsvImportPage";

// Dedicated Role Portal Views
import { StudentPortalView } from "./pages/portals/StudentPortalView";
import { ParentPortalView } from "./pages/portals/ParentPortalView";
import { AccountantPortalView } from "./pages/portals/AccountantPortalView";

// AI Assistant Chatbot
import { CollegeChatbot } from "./components/chatbot/CollegeChatbot";
import { ChatbotErrorBoundary } from "./components/chatbot/ChatbotErrorBoundary";

const MainLayout: React.FC = () => {
  const { user, firebaseUser, activeRole, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("STU-1042");
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Modals state
  const [collectFeeModal, setCollectFeeModal] = useState<{ open: boolean; invoice: any }>({
    open: false,
    invoice: null,
  });
  const [createInvoiceModalOpen, setCreateInvoiceModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ open: boolean; receipt: any }>({
    open: false,
    receipt: null,
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  // Sync default tab when user signs in or role changes
  useEffect(() => {
    if (user && activeRole) {
      if (activeRole === "student" || activeRole === "parent" || activeRole === "accountant" || activeRole === "admin") {
        setActiveTab("dashboard");
      }
    }
  }, [user?.email, user?.uid, activeRole]);

  const handleNavigate = (tab: string, studentId?: string) => {
    // Strict Role-Based Route Guard: Block cross-role dashboard/route hopping
    let targetTab = tab;
    if (activeRole === "student") {
      const allowed = ["dashboard", "student-fees", "student-results", "student-attendance", "student-schedule", "profile"];
      if (!allowed.includes(targetTab)) {
        targetTab = "dashboard";
      }
    } else if (activeRole === "parent") {
      const allowed = ["dashboard", "student-fees", "student-attendance", "student-results", "profile"];
      if (!allowed.includes(targetTab)) {
        targetTab = "dashboard";
      }
    } else if (activeRole === "accountant") {
      const allowed = [
        "dashboard",
        "fees",
        "expenses",
        "staff-management",
        "csv-import",
        "generate-monthly-fees",
        "payment-approval",
        "fee-categories",
        "reports",
        "profile",
      ];
      if (!allowed.includes(targetTab)) {
        targetTab = "dashboard";
      }
    }

    if (studentId) setSelectedStudentId(studentId);
    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCollectFee = (invoice: any) => {
    setCollectFeeModal({ open: true, invoice });
  };

  const handleViewReceipt = (receipt: any) => {
    setReceiptModal({ open: true, receipt });
  };

  // Loading Splash: Show while Firebase Auth is determining session state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl mb-6">
          <GraduationCap className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-white font-bold text-base tracking-tight">Our College ERP</h3>
        <p className="text-slate-400 text-xs mt-1">Verifying Cloud Session...</p>
      </div>
    );
  }

  // Unauthenticated Guard: Show Login if no active user session
  if (!user) {
    return <LoginPage onShowToast={showToast} />;
  }

  // Render content based on activeRole and activeTab
  const renderContent = () => {
    // 1. Student Portal View (Strictly: Fees Details | General Profile | Chatbot | Notifications)
    if (activeRole === "student") {
      return (
        <StudentPortalView
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onCollectFee={handleCollectFee}
          onViewReceipt={handleViewReceipt}
          onShowToast={showToast}
        />
      );
    }

    // 2. Parent Portal View
    if (activeRole === "parent") {
      if (activeTab === "profile") return <ProfilePage onShowToast={showToast} />;
      return (
        <ParentPortalView
          onCollectFee={handleCollectFee}
          onViewReceipt={handleViewReceipt}
          onShowToast={showToast}
        />
      );
    }

    // 3. Accountant Portal View
    if (activeRole === "accountant") {
      if (activeTab === "profile") return <ProfilePage onShowToast={showToast} />;
      if (activeTab === "fees") {
        return (
          <FeesPage
            onCollectFee={handleCollectFee}
            onCreateInvoice={() => setCreateInvoiceModalOpen(true)}
            onViewReceipt={handleViewReceipt}
            onShowToast={showToast}
          />
        );
      }
      if (activeTab === "expenses") {
        return (
          <ExpenseManagementPage
            onShowToast={(type, title, msg) => showToast(`${title}: ${msg}`, type === "error" ? "error" : "success")}
          />
        );
      }
      if (activeTab === "staff-management") {
        return <StaffManagementPage onShowToast={showToast} onNavigate={handleNavigate} />;
      }
      if (activeTab === "csv-import") {
        return <CsvImportPage onShowToast={showToast} onNavigate={handleNavigate} />;
      }
      if (activeTab === "generate-monthly-fees") {
        return <GenerateMonthlyFeesPage onShowToast={showToast} onNavigate={handleNavigate} />;
      }
      if (activeTab === "payment-approval") {
        return <PaymentApprovalPage onShowToast={showToast} onViewReceipt={handleViewReceipt} />;
      }
      if (activeTab === "fee-categories") {
        return <FeeCategoriesPage onShowToast={showToast} onNavigate={handleNavigate} />;
      }
      if (activeTab === "settings" || activeTab === "fees-settings") {
        return (
          <div className="max-w-xl mx-auto my-12 bg-white border border-red-200/80 rounded-3xl p-8 text-center shadow-lg animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Admin Settings and Fee Amount configuration are strictly restricted to verified College Administrators. Accountancy staff do not have authorization to modify institutional fee structures.
            </p>
            <button
              onClick={() => handleNavigate("dashboard")}
              className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Return to Finance Dashboard
            </button>
          </div>
        );
      }
      if (activeTab === "reports") {
        return <ReportsPage onShowToast={showToast} onCollectFee={handleCollectFee} />;
      }
      return (
        <AccountantPortalView
          onCollectFee={handleCollectFee}
          onCreateInvoice={() => setCreateInvoiceModalOpen(true)}
          onViewReceipt={handleViewReceipt}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      );
    }

    // 4. HOD & Faculty Views
    if (activeRole === "hod" || activeRole === "faculty") {
      switch (activeTab) {
        case "students-list":
          return (
            <StudentsListPage
              onNavigate={handleNavigate}
              onCollectFee={handleCollectFee}
              onShowToast={showToast}
            />
          );
        case "edit-student":
          return (
            <EditStudentPage
              studentId={selectedStudentId}
              onNavigate={handleNavigate}
              onShowToast={showToast}
            />
          );
        case "student-details":
          return (
            <StudentDetailsPage
              studentId={selectedStudentId}
              onNavigate={handleNavigate}
              onCollectFee={handleCollectFee}
              onViewReceipt={handleViewReceipt}
            />
          );
        case "academic-info":
          return <AcademicInfoPage onShowToast={showToast} />;
        case "reports":
          return <ReportsPage onShowToast={showToast} onCollectFee={handleCollectFee} />;
        case "profile":
          return <ProfilePage onShowToast={showToast} />;
        case "dashboard":
        default:
          return (
            <DashboardPage
              onNavigate={handleNavigate}
              onCollectFee={handleCollectFee}
              onViewReceipt={handleViewReceipt}
            />
          );
      }
    }

    // 5. Super Admin / Principal (Full Access)
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onCollectFee={handleCollectFee}
            onViewReceipt={handleViewReceipt}
          />
        );
      case "students-list":
        return (
          <StudentsListPage
            onNavigate={handleNavigate}
            onCollectFee={handleCollectFee}
            onShowToast={showToast}
          />
        );
      case "add-student":
        return (
          <AddStudentPage
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );
      case "edit-student":
        return (
          <EditStudentPage
            studentId={selectedStudentId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );
      case "student-details":
        return (
          <StudentDetailsPage
            studentId={selectedStudentId}
            onNavigate={handleNavigate}
            onCollectFee={handleCollectFee}
            onViewReceipt={handleViewReceipt}
          />
        );
      case "fees":
        return (
          <FeesPage
            onCollectFee={handleCollectFee}
            onCreateInvoice={() => setCreateInvoiceModalOpen(true)}
            onViewReceipt={handleViewReceipt}
            onShowToast={showToast}
          />
        );
      case "expenses":
        return (
          <ExpenseManagementPage
            onShowToast={(type, title, msg) => showToast(`${title}: ${msg}`, type === "error" ? "error" : "success")}
          />
        );
      case "staff-management":
        return (
          <StaffManagementPage
            onShowToast={showToast}
            onNavigate={handleNavigate}
          />
        );
      case "csv-import":
        return (
          <CsvImportPage
            onShowToast={showToast}
            onNavigate={handleNavigate}
          />
        );
      case "exam-fees":
        return (
          <ExamFeesPage
            onShowToast={(type, title, msg) => showToast(`${title}: ${msg}`, type === "error" ? "error" : "success")}
          />
        );
      case "attendance":
        return (
          <AttendancePage
            onShowToast={(type, title, msg) => showToast(`${title}: ${msg}`, type === "error" ? "error" : "success")}
          />
        );
      case "generate-monthly-fees":
        return (
          <GenerateMonthlyFeesPage
            onShowToast={showToast}
            onNavigate={handleNavigate}
          />
        );
      case "payment-approval":
        return (
          <PaymentApprovalPage
            onShowToast={showToast}
            onViewReceipt={handleViewReceipt}
          />
        );
      case "fee-categories":
        return <FeeCategoriesPage onShowToast={showToast} onNavigate={handleNavigate} />;
      case "parents":
        return <ParentsPage onShowToast={showToast} onNavigate={handleNavigate} />;
      case "users":
        return <UsersPage onShowToast={showToast} />;
      case "academic-info":
        return <AcademicInfoPage onShowToast={showToast} />;
      case "reports":
        return (
          <ReportsPage
            onShowToast={showToast}
            onCollectFee={handleCollectFee}
          />
        );
      case "settings":
      case "fees-settings":
        return (
          <SettingsPage
            initialTab={activeTab === "fees-settings" ? "fees" : "fees"}
            onShowToast={showToast}
            onNavigate={handleNavigate}
          />
        );
      case "profile":
        return <ProfilePage onShowToast={showToast} />;
      case "accountant-portal":
        return (
          <AccountantPortalView
            onCollectFee={handleCollectFee}
            onCreateInvoice={() => setCreateInvoiceModalOpen(true)}
            onViewReceipt={handleViewReceipt}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        );
      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onCollectFee={handleCollectFee}
            onViewReceipt={handleViewReceipt}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-ambient-mesh overflow-hidden font-sans text-slate-800 antialiased selection:bg-violet-600 selection:text-white relative">
      {/* Ambient background blur blobs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-pink-200/35 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        currentTab={activeTab}
        setActiveTab={handleNavigate}
        setCurrentTab={handleNavigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          currentTab={activeTab}
          onNavigate={handleNavigate}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 scrollbar-thin">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />

      {/* Collect Fee Modal */}
      {collectFeeModal.open && (
        <CollectFeeModal
          isOpen={collectFeeModal.open}
          onClose={() => setCollectFeeModal({ open: false, invoice: null })}
          invoice={collectFeeModal.invoice}
          onSuccess={(rec) => {
            showToast("Fee payment processed successfully!", "success");
            if (rec) setReceiptModal({ open: true, receipt: rec });
          }}
        />
      )}

      {/* Create Invoice Modal */}
      {createInvoiceModalOpen && (
        <CreateInvoiceModal
          isOpen={createInvoiceModalOpen}
          onClose={() => setCreateInvoiceModalOpen(false)}
          onSuccess={() => {
            showToast("New fee invoice created and dispatched!", "success");
          }}
        />
      )}

      {/* View Printable Receipt Modal */}
      {receiptModal.open && (
        <ReceiptModal
          isOpen={receiptModal.open}
          onClose={() => setReceiptModal({ open: false, receipt: null })}
          receipt={receiptModal.receipt}
        />
      )}

      {/* Floating AI Chatbot protected by Error Boundary */}
      <ChatbotErrorBoundary>
        <CollegeChatbot
          user={user}
          activeRole={activeRole}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      </ChatbotErrorBoundary>

      {/* Toast Notification Banner */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
