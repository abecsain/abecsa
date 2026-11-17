# ABECSA Software Solutions – Complete Enterprise Company Management System

<div align="center">
  <img src="./public/logo.png" alt="ABECSA Software Solutions Logo" width="360" />
  <p><strong>Next-Gen Enterprise Business Operating System & Client Portal</strong></p>
  <p>Software Development • Cloud Architecture • Custom ERP/CRM • Mobile Apps • AI Solutions</p>
</div>

---

## 🌟 Executive Overview

**ABECSA Software Solutions** (`abecsa.in`) is an enterprise-grade, centralized company management system and client operating platform designed to orchestrate the entire lifecycle of software consulting, client engagements, agile engineering sprints, financial billing, customer collaboration, and multi-channel WhatsApp messaging.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and JWT-authenticated session security, it delivers 4 dedicated role workspaces alongside a high-converting public agency website.

---

## 🚀 Key Features

### 1. High-Converting Public Agency Portal
- **Brand Identity:** Official ABECSA brand assets, responsive navigation, services showcase, case studies, client testimonials, tech stack showcase, and pricing FAQs.
- **Inbound Lead Engine:** Interactive Project Inquiry & Quotation Request form with automatic CRM lead ingestion (`/api/leads`).
- **Unified Login (`/login`):** Single entry point with automated role detection and 1-Click Demo Quick Login buttons for all 4 roles.

### 2. Four Dedicated Workspaces (Strict RBAC)

| Role | Workspace Route | Primary Capabilities |
| :--- | :--- | :--- |
| **Super Admin / Admin** | `/admin` | Executive KPI dashboard, complete user lifecycle (Admin/Manager/Engineer/Customer), project assignment, itemized quotation generator, GST tax invoicing & payment ledger, central secure document vault, company WhatsApp Web console, HR attendance & leave approvals, company settings & audit logs, and **server-verified "View As Role" impersonation**. |
| **Project Manager** | `/manager` | Operations cockpit, sprint pipelines, engineer squad assignment, client push tools (pushing notices, images, folders, and quotations directly to client dashboard), personal WhatsApp Web ("My WhatsApp" with 1-click personalized client greetings), CRM lead-to-client conversion, and support ticketing. |
| **Software Engineer** | `/engineer` | Sprint board (Kanban & Checklist), time/hours tracking, staging deliverable submissions, daily standup logs, attendance punch-in/out, and **dynamic project progress recalculation** upon task completion. |
| **Customer / Client** | `/customer` | **Mobile-first native app feel** (bottom navigation, thumb-friendly touch targets), live project progress tracker, shared vault & design mockup preview, 1-click quotation e-approval (with celebration confetti) / revision request, invoice payments with receipt submission, and manager announcements. |

### 3. WhatsApp Web Integration Engine
- **Dual Independent Lines:** Central Official Company line (`HQ-OFFICIAL-1`) and Manager Personal line (`MGR-LINE-1`).
- **Pairing QR Codes:** Real-time simulated and production-ready WhatsApp Web QR pairing (`/api/whatsapp/pair`).
- **Automated Templates:** Variable substitution for greetings, milestone approvals, quotation dispatches, and payment receipts.
- **Webhook Handlers:** Webhook callback listener for Meta Cloud API integration (`/api/whatsapp/webhook`).

### 4. Financial & Document Engine
- **Itemized Quotations:** Dynamic line-item calculation, 18% GST automatic computation, customer e-approval/rejection, and 1-click conversion to Tax Invoice.
- **Tax Invoices & Partial Payments:** Automated invoice generation, partial payment allocation, balance tracking, and status transitions (`DRAFT` → `SENT` → `PARTIALLY_PAID` → `PAID`).
- **High-Resolution Vector PDFs:** Client-side & server-side PDF generation (`jspdf` + `jspdf-autotable`) with official company letterhead, tax breakdowns, and bank credentials.
- **Secure Asset Vault:** Folder hierarchy with granular RBAC visibility flags (`isClientVisible: true/false`).

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16.4.6 (App Router, Turbopack, Server Actions)
- **Language:** TypeScript 5.9
- **Database ORM:** Prisma 6.19.3
- **Primary Datasource:** SQLite (`dev.db`) for instant zero-dependency execution; production-ready for PostgreSQL / CockroachDB / MySQL via single-line provider toggle.
- **Styling:** Tailwind CSS 4, Lucide React icons, Canvas Confetti.
- **Security:** Password hashing (`bcryptjs`), Signed JWT session cookies (`jose`), server-side role verification middleware (`src/middleware.ts`).
- **PDF Engine:** `jspdf` & `jspdf-autotable`.
- **Testing:** Comprehensive automated test suite (`tests/audit.test.ts`) covering 29 critical domain assertions.

---

## 🔑 Pre-Configured Demo Credentials

Use these pre-seeded accounts to explore the system or click the corresponding button on `/login`:

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@abecsa.in` | `Admin@123` | `/admin` |
| **Project Manager** | `manager@abecsa.in` | `Manager@123` | `/manager` |
| **Software Engineer** | `engineer@abecsa.in` | `Engineer@123` | `/engineer` |
| **Customer** | `client@abecsa.in` | `Client@123` | `/customer` |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v23.5.0)
- npm 9+

### 2. Installation & Setup
```bash
# Clone or navigate to the project directory
cd company_managmet_system

# Install dependencies
npm install

# Run database migrations (or push schema)
npx prisma db push

# Seed master database with accounts, projects, quotes, and WhatsApp nodes
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated QA Audit Suite
```bash
npx tsx tests/audit.test.ts
```

---

## 📦 Production Deployment Checklist

1. **Database:** Update `prisma/schema.prisma` datasource provider from `"sqlite"` to `"postgresql"`, set `DATABASE_URL` in `.env`, and run `npx prisma db push`.
2. **Environment Variables:**
   - `JWT_SECRET`: High-entropy secret key for session signing.
   - `DATABASE_URL`: Managed PostgreSQL connection string (Supabase, Neon, AWS RDS).
   - `WHATSAPP_TOKEN`: Meta Cloud API Access Token.
   - `WHATSAPP_PHONE_NUMBER_ID`: Official WhatsApp Business Phone Number ID.
   - `NEXT_PUBLIC_APP_URL`: Canonical production domain (`https://abecsa.in`).
3. **Build & Start:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📄 License & Ownership
Copyright © 2026 ABECSA Software Solutions. All rights reserved.
