<![CDATA[<div align="center">

# 🤖 AutomationHR

### AI-Powered HR Operations Platform

**Eliminate 80% of repetitive HR tasks with intelligent automation.**

Built with Next.js 16 · OpenAI GPT-4o · Supabase · RAG Pipeline

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

</div>

---

## 🎯 The Problem

HR teams in growing companies (50–500 employees) spend **60–70% of their time** on repetitive operational tasks: tracking attendance, processing leave requests, answering the same policy questions, calculating overtime, and generating payslips. This results in:

- **High administrative overhead** — HR staff buried in spreadsheets and paperwork
- **Slow response times** — Employees waiting days to get answers on leave balance or policy questions
- **Error-prone processes** — Manual calculations leading to payroll mistakes and compliance risks
- **Zero strategic bandwidth** — No time left for talent development, culture building, or retention strategy

## 💡 The Solution

**AutomationHR** is a full-stack AI-powered HR platform that automates core HR operations through an intelligent conversational interface. Employees interact with an AI HR Assistant that instantly answers policy questions, while managers and HR admins get real-time dashboards with AI-generated workforce insights.

> **Think of it as "ChatGPT for your HR department" — but with access to your company policies, employee data, and operational systems.**

---

## ✨ Core Features

### 🧠 AI HR Assistant (RAG-Powered Chat)
- **Natural language Q&A** — Employees ask questions in plain Bahasa Indonesia (e.g., *"Berapa sisa cuti saya?"*)
- **Retrieval-Augmented Generation (RAG)** — AI answers are grounded in your actual company policy documents (PDF/DOCX)
- **Context-aware responses** — The system understands who is asking and pulls personal data (attendance history, leave balance) automatically
- **Role-based intelligence** — HR staff can query data about any employee; employees only access their own data

### 📋 Attendance Management
- **One-click check-in/check-out** with automatic late detection
- **Monthly attendance statistics** — Present, late, WFH, and leave days tracked automatically
- **Attendance history** with full audit trail

### 🏖️ Leave Management
- **Digital leave requests** with multi-level approval workflow (Employee → Manager → HR)
- **Automatic balance tracking** — Annual leave, sick leave, and special leave quotas
- **Real-time balance visibility** on the employee dashboard

### ⏰ Overtime Management
- **Overtime request & approval** workflow with calculated compensation
- **Automatic payroll integration** — Approved overtime hours flow directly into payslip calculations

### 💰 Payroll & Payslip Generation
- **Automated salary calculation** — Base salary + allowances + overtime pay - deductions
- **Professional PDF payslip generation** — Downloadable, print-ready pay statements
- **Per-employee payslip generation** for HR administrators

### 📊 AI-Powered HR Dashboard (For Managers & HR)
- **Real-time workforce insights** — Attendance compliance rate, late trends, leave utilization
- **AI-generated executive summary** — GPT-4o produces a concise, natural-language analysis of HR health
- **Employee attention flags** — Automatic detection of frequent lateness, excessive leave, or high overtime
- **Signal-based insight cards** — Visual indicators (Stable / Monitor / Needs Attention) for quick decision-making

### 📄 Document Intelligence
- **Upload company policies** (PDF, DOCX) and the system automatically:
  - Extracts text content
  - Chunks documents with token-aware splitting (400 tokens, 50-token overlap)
  - Generates vector embeddings (OpenAI `text-embedding-3-small`)
  - Stores in Supabase pgvector for semantic search
- **Instant knowledge base** — New policies are queryable within minutes of upload

### 🔐 Role-Based Access Control (RBAC)
Four-tier access hierarchy with strict data isolation:

| Role | Access Level |
|------|-------------|
| **Employee** | Own data, AI chat, leave/overtime requests |
| **Manager** | + Approve team requests, view team insights |
| **HR** | + All employee data, document management, payroll |
| **Owner** | + Full admin panel, system configuration |

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)             │
│        React 19 · ShadCN/UI · TanStack Query        │
├─────────────────────────────────────────────────────┤
│                  API Layer (Route Handlers)          │
│   /api/auth · /api/attendance · /api/leave ·        │
│   /api/overtime · /api/payroll · /api/chat ·         │
│   /api/documents · /api/hr · /api/admin             │
├─────────────────────────────────────────────────────┤
│              Service Layer (Business Logic)          │
│   RAG Service · Intelligence Service ·              │ 
│   Ingestion Service · Payroll Service · ...         │
├───────────────────────┬─────────────────────────────┤
│   Supabase (PostgreSQL│   OpenAI API                │
│   + pgvector)         │   GPT-4o-mini (Chat)        │
│   Auth · Storage ·    │   text-embedding-3-small    │
│   Vector Search       │   (Embeddings)              │
└───────────────────────┴─────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 16 (App Router) | Server components, API routes, optimal DX |
| **Database** | Supabase (PostgreSQL + pgvector) | Managed DB with native vector search, row-level security |
| **AI Model** | GPT-4o-mini | Best cost/performance ratio for HR Q&A |
| **Embeddings** | text-embedding-3-small | High-quality embeddings at 5x lower cost |
| **Chunking** | Token-based (tiktoken, 400 tokens) | Optimal chunk size for HR policy retrieval |
| **Auth** | Custom JWT + bcrypt | Full control over session management and RBAC |
| **UI** | ShadCN/UI + Radix | Accessible, composable, production-ready components |
| **State** | TanStack Query v5 | Server state with caching, background refetch |

---

## 📂 Project Structure

```
automation-hr/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login/Register pages
│   │   ├── (protected)/        # Authenticated routes
│   │   │   └── dashboard/      # Main application
│   │   │       ├── admin/      # Owner admin panel
│   │   │       ├── attendance/ # Attendance tracking
│   │   │       ├── chat/       # AI HR Assistant
│   │   │       ├── hr/         # HR management + insights
│   │   │       ├── leave/      # Leave management
│   │   │       ├── overtime/   # Overtime management
│   │   │       └── payroll/    # Payslip generation
│   │   └── api/                # REST API endpoints
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Auth, Supabase clients
│   ├── repositories/           # Data access layer
│   ├── services/               # Business logic
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── migrations/             # 11 migration files (schema evolution)
├── scripts/                    # Seed scripts for demo data
└── sample-docs/                # Sample HR policy documents (Bahasa Indonesia)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Supabase** project (free tier works for development)
- **OpenAI** API key

### 1. Clone & Install

```bash
git clone https://github.com/your-org/automation-hr.git
cd automation-hr
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# JWT Secret (min 32 characters)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

### 3. Set Up Database

Run the migration files in order in your Supabase SQL editor:

```bash
# Apply migrations 001 through 011 in sequence
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_custom_auth_schema.sql
...
supabase/migrations/011_reporting_structure.sql
```

### 4. Seed Demo Data (Optional)

```bash
npx tsx scripts/seed-users.ts
npx tsx scripts/seed-operational-data.ts
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🎪 Demo Walkthrough

1. **Login** as an employee → See personal dashboard with today's attendance, leave balance
2. **Check In** → One-click attendance with automatic timestamp
3. **Ask the AI** → *"Berapa sisa cuti tahunan saya?"* → Get instant, personalized answer
4. **Submit Leave** → Fill leave request form → Goes through Manager → HR approval chain
5. **Switch to HR** → View AI-generated workforce insights with attention flags
6. **Upload Policy** → Upload a PDF → System ingests, chunks, embeds → Instantly queryable
7. **Generate Payslip** → Select employee & month → Download professional PDF payslip

---

## 📈 Business Metrics & Impact

| Metric | Before | After AutomationHR |
|--------|--------|---------------------|
| Time to answer policy questions | 2–24 hours | **< 5 seconds** |
| Leave request processing | 1–3 days | **< 1 hour** |
| Payslip generation (per employee) | 15–30 min | **< 10 seconds** |
| HR admin time on repetitive tasks | 60–70% | **< 20%** |
| Policy document access | Email/paper-based | **Instant AI search** |

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅ (Current)
- [x] AI HR Assistant with RAG
- [x] Attendance, Leave, Overtime management
- [x] Payslip PDF generation
- [x] Role-based access control (4 tiers)
- [x] AI-powered HR dashboard with insights
- [x] Document ingestion pipeline

### Phase 2 — Growth (Next)
- [ ] Multi-tenant architecture (SaaS-ready)
- [ ] WhatsApp/Telegram bot integration
- [ ] Advanced analytics & reporting
- [ ] Employee performance tracking
- [ ] Integration with accounting software

### Phase 3 — Scale
- [ ] Custom AI model fine-tuning per company
- [ ] Mobile app (React Native)
- [ ] API marketplace for third-party integrations
- [ ] Compliance automation (tax, BPJS)

---

## 🛡️ Security & Compliance

- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control** enforced at both API and UI layers
- **Data isolation** — Employees cannot access other employees' personal data
- **Audit logging** — All critical actions are logged with timestamps
- **Row-level security** — Database-level access policies via Supabase RLS

---

## 🧰 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **UI Components** | ShadCN/UI, Radix UI, Lucide Icons |
| **Styling** | Tailwind CSS 4, next-themes (dark mode) |
| **State Management** | TanStack Query v5 |
| **Forms** | React Hook Form + Zod validation |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **AI/ML** | OpenAI GPT-4o-mini, text-embedding-3-small |
| **Document Processing** | pdf-parse, Mammoth.js, js-tiktoken |
| **PDF Generation** | pdf-lib |
| **Auth** | Custom JWT (jose) + bcrypt |

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<div align="center">

**Built with ❤️ by [IAL Works](https://github.com/your-org)**

*Empowering HR teams with AI — so they can focus on people, not paperwork.*

</div>
]]>
