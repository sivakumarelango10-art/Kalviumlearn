# KALVI LEARN — Production Coding Education & Assessment Platform

![Kalvi Learn](public/kalvi-logo.png)

A production-grade coding education, structured learning, and practice platform built with modern architecture, multi-language sandboxed execution, 10-test-case validation, weighted Growth Mentor management, single-campus telemetry, and Super Admin governance.

---

## 🎯 Architecture Highlights

- **4 Strict Roles**:
  - **Super Admin**: System governance, problem authoring with 10 test cases, user management, audit logs.
  - **Campus Manager**: Single-campus telemetry, weighted aggregate mentor rankings, top performers export.
  - **Growth Mentor**: Scoped strictly to assigned student pod, diagnostic intervention deep-dive.
  - **Student**: Monaco coding arena, belt progression, topic mastery, revision hub.
- **Single Campus Scope**: Kalvi Campus (`KALVI-01`).
- **Google OAuth Whitelist Authentication**:
  - Login strictly via `"Continue with Google"`.
  - Rejects unregistered accounts with HTTP 403: *"Your Google account is not registered on Kalvi Learn. Please contact the administrator."*
  - Pre-registered Super Admin: `codingplatform10@gmail.com`.
- **Monaco Coding Arena**:
  - Languages: Python, C++, Java, JavaScript.
  - Independent language sessions (locked mid-session).
  - Exactly 10 test cases per language: **3 visible**, **7 hidden** (never sent to client).
  - Run (visible tests) vs Submit (all 10 tests server-side).
  - Anti-copy/paste event interceptors.
  - Continuous learning loop dialog upon passing all 10 tests.
- **Top Performers Export**: Real PDF (jsPDF) and Excel (.xlsx) export with custom field toggles and sorting.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Lucide React, jsPDF, XLSX (SheetJS).
- **Backend API**: Node.js, Express, TypeScript, pg (PostgreSQL connection pool).
- **Database**: PostgreSQL (Supabase pooler) with capacity triggers and audit logging.
- **Code Execution**: Judge0 CE API (`https://ce.judge0.com`) with sandboxed fallback execution.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Migration
```bash
npm run db:migrate
```

### 5. Run Development Servers
Start both backend API and frontend Vite dev server concurrently:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

---

## 🧪 Automated Testing

Run the full end-to-end integration verification suite:
```bash
npm run test:e2e
```
*(Executes 24 automated tests verifying authentication whitelist, role capacity limits, student reassignment, mentor pod data isolation, hidden test case security, code execution, and real export generation).*
