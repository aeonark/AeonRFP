<div align="center">

<img src="https://img.shields.io/badge/AeonRFP-AI%20Powered-4361EE?style=for-the-badge&logo=sparkles&logoColor=white" alt="AeonRFP" />

# 🚀 AeonRFP

### AI-Powered RFP Response Intelligence

**Win more proposals. Respond faster. Scale your team.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI_Engine-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#license)
[![CI](https://github.com/aeonark/AeonRFP/actions/workflows/ci.yml/badge.svg)](https://github.com/aeonark/AeonRFP/actions/workflows/ci.yml)

---

*Built by [Aeonark Labs](https://github.com/aeonark) — Enterprise AI for proposal teams*

</div>

<br/>

## 🎯 The Problem

Enterprise proposal teams spend **40+ hours per RFP** — manually reading requirements, digging through past responses, drafting from scratch, and praying for consistency. AeonRFP eliminates this with an AI pipeline that **reads, matches, drafts, and exports** in minutes.

## ⚡ Key Features

<table>
<tr>
<td width="50%">

### 📄 Smart Document Parsing
Upload PDF, DOCX, or XLSX — our parser extracts text, splits it into **intelligent clause boundaries** (numbered sections → bullets → paragraphs), and normalizes artifacts.

</td>
<td width="50%">

### 🧠 SmartMatch Engine
Vector search powered by Gemini embeddings + Qdrant. Each clause is matched against your knowledge vault with **semantic similarity, keyword overlap, recency, and reuse scoring**.

</td>
</tr>
<tr>
<td>

### ✍️ AI Draft Editor
Real-time **SSE streaming** shows every pipeline stage as it happens — normalizing → embedding → searching → ranking → generating → complete. Edit inline, save to DB.

</td>
<td>

### 📊 Live Analytics
Metrics computed from real data — win rate trends, clause type distribution, confidence scoring, response times, and **estimated hours saved** per proposal.

</td>
</tr>
<tr>
<td>

### 📥 DOCX Export
One-click export generates a **professional Word document** — title page, typed/labeled sections, requirement blockquotes, confidence badges, and AI-generated responses.

</td>
<td>

### 📬 Gmail Integration
Connect your inbox to **auto-detect incoming RFPs** using heuristic + AI classification. Procurement emails are flagged before you even open them.

</td>
</tr>
</table>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 (App Router)                  │
├──────────────┬──────────────┬───────────────┬───────────────────┤
│   Upload &   │   Clause     │  Draft Editor │    Analytics      │
│   Processing │   Intelligence│  + Export     │    Dashboard      │
├──────────────┴──────────────┴───────────────┴───────────────────┤
│                        API Routes (SSE)                          │
├──────────────┬──────────────┬───────────────┬───────────────────┤
│  Document    │  SmartMatch  │   AI Engine   │   Cost Controls   │
│  Parser      │  (Vector DB) │  (Gemini 2.0) │   & Usage Tracker │
│  PDF/DOCX/   │  Search →    │  4-Layer      │   Token Budgets   │
│  XLSX        │  Rerank →    │  Prompt       │   Plan Limits     │
│              │  Compress    │  Builder      │                   │
├──────────────┴──────────────┴───────────────┴───────────────────┤
│              Supabase (PostgreSQL + Auth + Storage)              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/aeonark/AeonRFP.git
cd AeonRFP

# Install
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase + Gemini API keys

# Run database migrations
# (Apply lib/supabase/schema.sql to your Supabase project)

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the landing page.

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `QDRANT_URL` | Qdrant vector database URL |
| `QDRANT_API_KEY` | Qdrant API key |
| `GOOGLE_CLIENT_ID` | Gmail OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (billing) |

## 📁 Project Structure

```
AeonRFP/
├── app/
│   ├── api/
│   │   ├── process-rfp/        # Document parsing pipeline
│   │   ├── generate-clause/    # AI generation (SSE streaming)
│   │   ├── export-proposal/    # DOCX export
│   │   ├── scan-inbox/         # Gmail RFP detection
│   │   └── webhooks/           # Stripe billing webhooks
│   ├── dashboard/
│   │   ├── upload/             # RFP upload with progress tracking
│   │   ├── clauses/            # Clause Intelligence (Supabase-connected)
│   │   ├── editor/             # AI Draft Editor (SSE streaming)
│   │   ├── analytics/          # Real-time analytics dashboard
│   │   ├── knowledge/          # Knowledge Vault management
│   │   ├── gmail/              # Gmail inbox integration
│   │   └── settings/           # Organization & plan settings
│   └── page.tsx                # Landing page
├── lib/
│   ├── ai/                     # Gemini client, prompt builder, validation
│   ├── smartmatch/             # Vector search, reranking, compression
│   ├── parsing/                # PDF/DOCX/XLSX document parser
│   ├── classification/         # Email RFP classification
│   ├── training/               # Style profile analysis
│   ├── cost/                   # Token management, usage tracking
│   ├── plans/                  # Plan enforcement & limits
│   └── supabase/               # Database client, middleware, schema
└── docs/
    └── WORKING_MANUAL.md       # Complete technical reference
```

## 🧪 AI Pipeline

Every clause goes through a **9-stage pipeline**, streamed via SSE:

1. **Normalize** — Clean clause text, remove artifacts
2. **Embed** — Generate 768-dim vector via Gemini
3. **Search** — Query Qdrant knowledge base
4. **Rerank** — Weighted scoring (similarity + keywords + recency + reuse)
5. **Compress** — Fit context into token budget
6. **Confidence** — Calculate match quality score
7. **Generate** — 4-layer prompt → Gemini 2.0 Flash
8. **Validate** — JSON schema enforcement
9. **Save** — Store result + track usage metrics

## 🛡️ Security & Multi-tenancy

- **Row-Level Security (RLS)** — every table scoped to `tenant_id`
- **Supabase Auth** — email/password + Google OAuth
- **Server-side auth** — API routes validate session
- **Plan enforcement** — rate limiting per tenant
- **Token budgets** — per-request cost controls

## 📊 Deploy Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **Deploy 1** | Foundation & Data Architecture | ✅ Complete |
| **Deploy 2** | SmartMatch Engine & AI Pipeline | ✅ Complete |
| **Deploy 3** | Integrations & Automation | ✅ Complete |
| **Deploy 4** | Analytics, Cost Controls & Production | ✅ Complete |

## 🤝 Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for development guidelines. We use:
- **Conventional Commits** (`feat:`, `fix:`, `docs:`)
- **TypeScript strict mode** — zero `any` tolerance
- **CI checks** — type-check + build on every push

## 📄 License

Proprietary — © 2025–2026 Aeonark Labs. All rights reserved.

---

<div align="center">
<sub>Built with 💙 by Aeonark Labs | Powered by Gemini AI + Supabase</sub>
</div>
