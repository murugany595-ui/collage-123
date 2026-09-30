# College Management & Finance ERP System

A production-ready College Management & Finance System built with **React**, **TypeScript**, **Tailwind CSS**, and **Firebase** (Firestore & Firebase Authentication). Supported by an Express backend for secure server-side payroll processing and an intelligent Gemini-powered AI Assistant.

---

## 1. Architecture Overview

- **Database**: Cloud Firestore is the sole database and single source of truth.
  - No dummy data, mock files, or in-memory test stores.
  - Clean empty states (`₹0.00`, "No records found") when collections have no records.
- **Authentication**: Firebase Authentication (Email/Password & Role-Based Access Control).
  - Four distinct user roles: `Admin`, `Accountant`, `Student`, and `Parent`.
  - Strict role-based routing and permissions across all portals.
- **Backend API & AI Assistant**: Express.js server (`server.js`) running on port 3000.
  - Server-side Firebase ID Token verification via Google Identity Toolkit.
  - Secure salary processing with duplicate payment prevention and Firestore audit logging.
  - Context-aware multilingual AI Chatbot (English, Tamil, Tanglish) using Gemini API.

---

## 2. Getting Started

### Prerequisites

- Node.js (v18+)
- npm or bun

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=collage-28e7c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=collage-28e7c
VITE_FIREBASE_STORAGE_BUCKET=collage-28e7c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# AI Chatbot & Backend
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### Running the Application

1. **Frontend Development Server**:
   ```bash
   npm run dev
   ```

2. **Backend Server (Salary Processing & AI Assistant)**:
   ```bash
   npm run server
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## 3. User Roles & Portals

| Role | Access Level & Key Features |
|---|---|
| **Admin** | Full system control: Manage students, faculty, departments, fee structures, academic calendars, reports, and audit logs. |
| **Accountant** | Financial management: Fee collection, invoice generation, expense tracking, salary payroll, payment approvals, and ledger reports. |
| **Student** | Self-service portal: View enrolled courses, fee invoices, payment receipts, attendance percentage, and submit service requests. |
| **Parent** | Student guardian view: Monitor student attendance, exam marks, fee dues, payment history, and submit fee extension requests. |

---

## 4. Key Collections (Firestore)

- `users`: Core user accounts and assigned roles (`admin`, `accountant`, `student`, `parent`).
- `students`: Comprehensive student profile records and departmental affiliations.
- `staff`: Faculty and administrative staff directory.
- `departments`: College departments, courses, and fee assignments.
- `fees`: Student fee invoices, payment statuses, and transaction details.
- `fee_settings`: Configurable fee categories and rates per department.
- `adminExpenses`: College expense records (Staff salaries, electricity, infrastructure, etc.).
- `requests`: Fee extension, leave, and attendance correction requests.
- `auditLogs`: Immutable system audit trail for fee setting updates and financial transactions.

---

## 5. Security & Verification

- **Zero Mock Data**: All data displayed in dashboards, tables, and summaries comes directly from Firestore.
- **Strict Role Authorization**: Non-authorized roles cannot access administrative endpoints or settings.
- **Duplicate Prevention**: Automated checks prevent double payments for payroll and student fees.
