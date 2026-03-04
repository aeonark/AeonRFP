# AeonRFP — Working Manual

**Version 1.0 · Aeonark Labs · March 2026**

> AeonRFP is an AI-powered proposal intelligence platform that transforms how organizations respond to RFPs. It parses documents into structured clauses, matches them against a private knowledge vault, generates enterprise-grade responses using a 4-layer prompt system, and surfaces actionable analytics — turning weeks of manual work into hours.

---

## System Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 · React 19 · Tailwind CSS 4 | Dashboard, editor, landing page |
| **Backend** | Next.js API Routes (Server-Side) | 8 REST endpoints with SSE streaming |
| **Database** | Supabase (PostgreSQL) | 14 tables with Row-Level Security |
| **Vector Store** | Qdrant | Tenant-namespaced semantic search |
| **AI Engine** | Gemini 2.0 Flash + text-embedding-004 | Generation & embeddings |
| **Auth** | Supabase Auth + SSR middleware | Session management & route protection |
| **Billing** | Stripe | Plan enforcement & metered usage |
| **Integrations** | Gmail API (OAuth 2.0) | Inbox scanning & RFP auto-detection |

---

# Deploy 1 — Foundation & Data Architecture

> **Scope:** Database schema, authentication, authorization, core data models, Supabase integration, and the base application shell.

## 1.1 Database Schema (14 Tables)

The schema is defined in `lib/supabase/schema.sql` and establishes full multi-tenant isolation.

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `tenants` | Organization containers | `company_name`, `plan_type` (starter/growth), `usage_rfps_this_month`, `vault_storage_used_mb` |
| `users` | Team members | `email`, `tenant_id` (FK), `role` (admin/member/viewer) |
| `rfp_documents` | Uploaded RFP files | `tenant_id`, `file_url`, `status` (uploaded → processing → completed/failed), `clause_count` |
| `clauses` | Parsed RFP sections | `rfp_id`, `clause_text`, `clause_type` (technical/compliance/financial/operational/legal/general), `generated_answer`, `confidence_score`, `risk_flag` |

### Knowledge Vault Tables

| Table | Purpose |
|-------|---------|
| `knowledge_documents` | Uploaded reference docs with deduplication via `file_hash` |
| `knowledge_chunks` | Chunked text with `clause_type`, `reuse_count`, `is_user_approved` |
| `organization_training_documents` | Past RFP responses, policies, capability docs |
| `style_profile` | Per-tenant writing style: sentence length, tone vector, formality score, common phrases |

### Integration Tables

| Table | Purpose |
|-------|---------|
| `gmail_connections` | OAuth tokens (encrypted), per-user per-tenant |
| `gmail_settings` | Auto-scan toggle & frequency (default: 30 min) |
| `email_logs` | Classification results: `classified_as_rfp`, `classification_method`, `intent_type` |
| `auto_detected_rfps` | RFPs found via inbox scanning, linked to `rfp_documents` |

### Infrastructure Tables

| Table | Purpose |
|-------|---------|
| `embeddings_cache` | Deduplication by `text_hash` to avoid redundant API calls |
| `usage_metrics` | Per-action telemetry: tokens, latency, cost estimate |

### Security

Row-Level Security (RLS) is enabled on all data tables:
- `rfp_documents`, `clauses`, `knowledge_documents`, `knowledge_chunks`, `usage_metrics`
- 12 performance indexes on tenant/document/time dimensions

## 1.2 Authentication & Middleware

| File | Role |
|------|------|
| `lib/supabase/middleware.ts` | Session refresh, redirect unauthenticated users from `/dashboard/*` → `/login` |
| `lib/supabase/server.ts` | Server-side Supabase client with cookie-based SSR auth |
| `lib/supabase/client.ts` | Browser-side Supabase client |

**Auth Flow:**
1. User signs up/signs in via Supabase Auth
2. Middleware intercepts every request, refreshes session cookies
3. Dashboard routes are protected — unauthenticated users are redirected to `/login`
4. Dev mode failsafe: if Supabase URL contains "placeholder", auth is bypassed

## 1.3 Application Shell

**Landing Page** — Full marketing page with animated orbs, glass-morphism cards, mock dashboard preview, feature grid (6 capabilities), 4-step "How It Works" flow, and conversion metrics.

**Dashboard Layout** — Sidebar navigation linking to Upload, Clauses, Editor, Analytics, Knowledge, Gmail, Processing, and Settings pages.

**Dashboard Overview** — Stat cards (Active RFPs, Win Rate, Avg Confidence, Avg Response Time), quick action tiles, and a recent RFPs table with status badges.
