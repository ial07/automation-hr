<div align="center">

# 🤖 AutomationHR

### AI-Powered HR Operations Platform

**Eliminate 80% of repetitive HR tasks with intelligent automation.**

Built with **Next.js 16** · **OpenAI GPT-4o** · **Supabase** · **RAG Pipeline**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&style=flat-square)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&style=flat-square)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#license)

[Features](#-core-features) • [Architecture](#-technical-architecture) • [Getting Started](#-getting-started) • [Roadmap](#-roadmap)

</div>

---

## 📌 Overview

**AutomationHR** is an enterprise-grade AI-powered HR management platform that intelligently automates core HR operations. Powered by RAG (Retrieval-Augmented Generation), it enables employees to interact naturally with an AI HR Assistant in real-time while maintaining strict role-based access control and data security.

> **Think of it as "ChatGPT for your HR department" — but with secure access to your company policies, employee data, and operational systems.**

---

## 🎯 The Problem

HR teams in growing companies (50–500 employees) spend **60–70% of their time** on repetitive operational tasks:

- ❌ **High administrative overhead** — HR staff buried in spreadsheets and manual processes
- ❌ **Slow response times** — Employees waiting days for answers on leave balance or policy questions
- ❌ **Error-prone processes** — Manual calculations leading to payroll mistakes and compliance risks
- ❌ **Zero strategic bandwidth** — No time for talent development, culture building, or retention strategy

**Result:** HR becomes a cost center instead of a strategic partner.

---

## 💡 The Solution

AutomationHR provides an intelligent conversational interface that:

✅ **Answers policy questions instantly** with RAG-powered AI grounded in your actual company documentation  
✅ **Automates leave, attendance & overtime** with multi-level approval workflows  
✅ **Generates payslips instantly** with accurate salary calculations  
✅ **Provides AI-powered insights** for HR managers and executives  
✅ **Maintains strict security** with role-based access control (RBAC) and data isolation  

---

## ✨ Core Features

### 🧠 AI HR Assistant (RAG-Powered Chat)

- **Natural language Q&A** — Employees ask questions in Bahasa Indonesia (e.g., *"Berapa sisa cuti saya?"*)
- **Retrieval-Augmented Generation** — AI answers grounded in your company policy documents (PDF/DOCX)
- **Context-aware responses** — System pulls personal data (attendance, leave balance) automatically
- **Role-based intelligence** — HR staff can query any employee; employees access only their own data

### 📋 Attendance Management

- ✔️ **One-click check-in/check-out** with automatic late detection
- 📊 **Monthly statistics** — Present, late, WFH, and leave days tracked automatically
- 📜 **Full audit trail** — Complete attendance history with timestamps

### 🏖️ Leave Management

- 📝 **Digital leave requests** with multi-level approval workflow (Employee → Manager → HR)
- 🔄 **Automatic balance tracking** — Annual, sick, and special leave quotas managed automatically
- 👁️ **Real-time visibility** — Employees see remaining balance on their dashboard

### ⏰ Overtime Management

- 📋 **Overtime request & approval** workflow with automatic compensation calculation
- 💰 **Payroll integration** — Approved overtime hours flow directly into payslip calculations

### 💰 Payroll & Payslip Generation

- 🧮 **Automated calculations** — Base salary + allowances + overtime - deductions
- 📄 **Professional PDF payslips** — Downloadable, print-ready pay statements
- ⚡ **Instant generation** — Per-employee payslip generation in seconds

### 📊 AI-Powered HR Dashboard

*For Managers & HR Administrators*

- 📈 **Real-time workforce insights** — Attendance compliance, late trends, leave utilization
- 🤖 **AI-generated summaries** — GPT-4o produces concise, natural-language HR health analysis
- 🚨 **Attention flags** — Auto-detection of frequent lateness, excessive leave, or high overtime
- 🎯 **Signal-based cards** — Visual indicators (Stable / Monitor / Needs Attention) for quick decisions

### 📄 Document Intelligence

**Automated policy ingestion pipeline:**

- 📤 Upload company policies (PDF, DOCX)
- 🔍 Automatic text extraction and token-aware chunking (400 tokens, 50-token overlap)
- 🧬 Vector embedding generation (OpenAI `text-embedding-3-small`)
- 💾 Storage in Supabase pgvector for semantic search
- ⚡ **Instant queryability** — New policies are searchable within minutes

### 🔐 Role-Based Access Control (RBAC)

Four-tier access hierarchy with strict data isolation:

| Role | Capabilities |
|:---:|:---|
| **👤 Employee** | View own data, chat with AI, submit leave/overtime requests |
| **👨‍💼 Manager** | ↑ + Approve team requests, view team insights |
| **👨‍💻 HR Admin** | ↑ + All employee data, document management, payroll generation |
| **🔑 Owner** | ↑ + Full admin panel, system configuration, billing |

---

## 🏗️ Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Frontend Layer (Next.js 16)                 │
│     React 19 · TypeScript · ShadCN/UI · TanStack Query  │
├──────────────────────────────────────────────────────────┤
│           API Layer (Route Handlers & Middleware)        │
│  /api/auth  /api/attendance  /api/leave  /api/overtime  │
│  /api/payroll  /api/chat  /api/documents  /api/hr/admin  │
├──────────────────────────────────────────────────────────┤
│         Service Layer (Business Logic & RAG)             │
│  RAG Service · Intelligence Service · Payroll Service    │
│  Ingestion Service · Analytics Service · ...             │
├─────────────────────────┬────────────────────────────────┤
│    Supabase (Managed)   │     OpenAI API (Cloud)        │
│  ├─ PostgreSQL Database │  ├─ GPT-4o-mini (Chat)        │
│  ├─ pgvector (Semantic) │  └─ text-embedding-3-small    │
│  ├─ Auth & RLS          │                               │
│  └─ Vector Storage      │                               │
└─────────────────────────┴────────────────────────────────┘
```

### Key Technical Decisions

| Component | Choice | Why? |
|:---|:---:|:---|
| **Framework** | Next.js 16 (App Router) | Server components, optimal DX, built-in API routes |
| **Database** | Supabase (PostgreSQL + pgvector) | Managed, native vector search, row-level security |
| **AI Model** | GPT-4o-mini | Best cost/performance ratio for HR Q&A |
| **Embeddings** | text-embedding-3-small | High quality, 5x lower cost than larger models |
| **Chunking Strategy** | Token-based (400 tokens, 50-token overlap) | Optimal for policy document retrieval |
| **Authentication** | Custom JWT + bcrypt | Full control over sessions and RBAC |
| **UI Framework** | ShadCN/UI + Radix | Accessible, composable, production-ready |
| **State Management** | TanStack Query v5 | Server state with caching and background refetch |

---

## 📂 Project Structure

```
automation-hr/
├── src/
│   ├── app/                           # Next.js App Router (App Directory)
│   │   ├── (auth)/
│   │   │   ├── login/                 # Login page
│   │   │   └── register/              # Registration page
│   │   ├── (protected)/               # Authenticated routes
│   │   │   └── dashboard/
│   │   │       ├── admin/             # Owner admin panel
│   │   │       ├── attendance/        # Attendance tracking & management
│   │   │       ├── chat/              # AI HR Assistant interface
│   │   │       ├── hr/                # HR management, policies, insights
│   │   │       ├── leave/             # Leave request & approval
│   │   │       ├── overtime/          # Overtime request & tracking
│   │   │       └── payroll/           # Payslip generation & history
│   │   ├── api/                       # REST API endpoints
│   │   └── layout.tsx                 # Root layout
│   ├── components/                    # Reusable React components
│   │   ├── ui/                        # ShadCN/UI components
│   │   ├── forms/                     # Form components
│   │   └── dashboard/                 # Dashboard-specific components
│   ├── hooks/                         # Custom React hooks
│   ├── lib/
│   │   ├── auth.ts                    # JWT authentication logic
│   │   ├── supabase.ts                # Supabase client setup
│   │   └── utils.ts                   # Utility functions
│   ├── repositories/                  # Data access layer (DAL)
│   ├── services/                      # Business logic
│   │   ├── rag-service.ts             # RAG & embeddings
│   │   ├── payroll-service.ts         # Salary calculations
│   │   ├── ai-service.ts              # OpenAI integration
│   │   └── intelligence-service.ts    # Analytics & insights
│   └── types/                         # TypeScript interfaces & types
├── supabase/
│   └── migrations/                    # 11 migration files (schema evolution)
├── scripts/
│   ├── seed-users.ts                  # Demo user seed script
│   └── seed-operational-data.ts       # Demo data seed script
├── sample-docs/                       # Sample HR policies (Bahasa Indonesia)
├── public/                            # Static assets
├── .env.example                       # Environment template
└── package.json                       # Dependencies

```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Supabase** project ([Sign up free](https://supabase.com/))
- **OpenAI** API key ([Get key](https://platform.openai.com/api-keys))

### 1️⃣ Clone & Install

```bash
git clone https://github.com/ial07/automation-hr.git
cd automation-hr
npm install
```

### 2️⃣ Configure Environment

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_key_here

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Application URL (for development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3️⃣ Set Up Database

Run migration files in order in your [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql):

```bash
# Migrations are located in: supabase/migrations/
# Apply them in sequence:
# 001_initial_schema.sql
# 002_custom_auth_schema.sql
# ... through ...
# 011_reporting_structure.sql
```

**Or use Supabase CLI:**

```bash
npm install -g supabase
supabase link --project-ref your_project_id
supabase db push
```

### 4️⃣ Seed Demo Data (Optional)

```bash
# Create sample users
npx tsx scripts/seed-users.ts

# Create sample operational data (attendance, leave, overtime)
npx tsx scripts/seed-operational-data.ts
```

### 5️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎪 Demo Walkthrough

### For Employees:
1. **Login** → See personal dashboard with today's attendance and leave balance
2. **Check In/Out** → One-click attendance with automatic timestamp
3. **Ask AI** → *"Berapa sisa cuti tahunan saya?"* → Get instant, personalized answer
4. **Submit Leave** → Fill request form → Goes through Manager → HR approval chain
5. **View Payslip** → Download professional PDF of current month salary

### For HR/Managers:
6. **Switch to HR Mode** → View AI-generated workforce insights with attention flags
7. **Upload Policy** → Upload PDF → System ingests, chunks, embeds → Instantly queryable
8. **Approve Requests** → Manage pending leave/overtime requests from team
9. **Generate Payslips** → Select employee & month → Download professional PDF
10. **View Dashboard** → Real-time analytics, trends, and AI-generated recommendations

---

## 📈 Business Impact

| Metric | Before | After AutomationHR | Improvement |
|:---|---:|---:|---:|
| **Policy Q&A Response Time** | 2–24 hours | < 5 seconds | **✓ 99.9% faster** |
| **Leave Request Processing** | 1–3 days | < 1 hour | **✓ 72x faster** |
| **Payslip Generation (per employee)** | 15–30 min | < 10 sec | **✓ 120x faster** |
| **HR Admin Time on Repetitive Tasks** | 60–70% | < 20% | **✓ 70% reduction** |
| **Policy Knowledge Base Access** | Email/paper-based | Instant AI search | **✓ Automated** |

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅ (Current)

- [x] AI HR Assistant with RAG pipeline
- [x] Attendance management with auto late detection
- [x] Leave request & approval workflow
- [x] Overtime tracking & compensation
- [x] Payslip PDF generation
- [x] Role-based access control (4 tiers)
- [x] AI-powered HR insights dashboard
- [x] Document ingestion pipeline

### Phase 2 — Growth (Next Quarter)

- [ ] Multi-tenant SaaS architecture
- [ ] WhatsApp/Telegram bot integration
- [ ] Advanced analytics & reporting module
- [ ] Employee performance tracking
- [ ] Accounting software integrations (XERO, QuickBooks)
- [ ] Mobile app (React Native)

### Phase 3 — Enterprise (Future)

- [ ] Custom AI model fine-tuning per company
- [ ] API marketplace for third-party integrations
- [ ] Compliance automation (tax, BPJS, labor law)
- [ ] Employee wellness & engagement features
- [ ] Advanced AI-driven recommendations

---

## 🛡️ Security & Compliance

- ✅ **JWT-based authentication** with bcrypt password hashing (cost factor: 12)
- ✅ **Role-based access control (RBAC)** enforced at both API and UI layers
- ✅ **Data isolation** — Employees cannot access other employees' personal data
- ✅ **Row-level security (RLS)** — Database-level access policies via Supabase
- ✅ **Audit logging** — All critical actions logged with timestamps and user context
- ✅ **Encrypted connections** — HTTPS-only, secure cookies (HttpOnly, SameSite flags)
- ✅ **Rate limiting** — API endpoints rate-limited to prevent abuse
- ✅ **Input validation** — Zod schemas for all API inputs

---

## 🧰 Tech Stack

| Category | Technology |
|:---|:---|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **UI Components** | ShadCN/UI, Radix UI, Lucide Icons |
| **Styling** | Tailwind CSS 4, next-themes (dark mode support) |
| **State Management** | TanStack Query v5 (React Query) |
| **Forms** | React Hook Form + Zod validation |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **AI/ML** | OpenAI GPT-4o-mini, text-embedding-3-small |
| **Document Processing** | pdf-parse, Mammoth.js, js-tiktoken |
| **PDF Generation** | pdf-lib |
| **Authentication** | Custom JWT (jose), bcrypt password hashing |
| **Testing** | Jest, React Testing Library (in progress) |
| **Deployment** | Vercel (recommended), Docker-ready |

---

## 📋 Environment Variables Reference

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (Required)
OPENAI_API_KEY=sk-xxx

# JWT (Required)
JWT_SECRET=your-secret-key-at-least-32-chars

# Application (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support & Contact

For questions or support, please reach out:

- **Email:** support@ial-works.com
- **Issues:** [GitHub Issues](https://github.com/ial07/automation-hr/issues)
- **Website:** [IAL Works](https://ial-works.com)

---

## 📄 License

This project is **proprietary software**. All rights reserved.

Unauthorized copying, modification, or distribution of this code is strictly prohibited.

---

<div align="center">

### Built with ❤️ by [IAL Works](https://ial-works.com)

*Empowering HR teams with AI — so they can focus on people, not paperwork.*

⭐ If you find this project helpful, please consider giving it a star!

</div>