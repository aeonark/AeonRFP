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

---

# Deploy 2 — SmartMatch Engine & AI Pipeline

> **Scope:** The core intelligence layer — document processing, vector search, re-ranking, context compression, 4-layer prompt system, AI generation with streaming, and response validation.

## 2.1 RFP Processing Pipeline

**Entry Point:** `app/api/process-rfp/route.ts`

**Steps:**
1. **Text Extraction** — Parses PDF/DOCX files into raw text (production: pdf-parse, mammoth)
2. **Clause Splitting** — Splits by numbered section headers (`1.0`, `2.1`) or paragraph boundaries; filters out content under 20 characters
3. **Normalization** — `lib/smartmatch/normalize.ts` cleans whitespace, removes boilerplate, standardizes formatting
4. **Embedding Generation** — Gemini `text-embedding-004` with automatic caching to `embeddings_cache` table
5. **Batch Processing** — Embeddings generated in batches of 5 for rate-limit safety
6. **Status Tracking** — Document status transitions: `uploaded` → `processing` → `completed`/`failed`

## 2.2 SmartMatch Engine (6 Modules)

The SmartMatch engine is AeonRFP's proprietary multi-signal relevance system.

### Module Breakdown

| Module | File | Purpose |
|--------|------|---------|
| **Embedding** | `lib/smartmatch/embedding.ts` | Gemini text-embedding-004 with cache-first strategy and exponential backoff retry (up to 2 retries) |
| **Search** | `lib/smartmatch/search.ts` | Qdrant vector search with tenant-namespace filtering, Top-K=5, similarity threshold 0.65, returns payload with metadata |
| **Re-Ranking** | `lib/smartmatch/rerank.ts` | 4-signal weighted re-ranking (see below), takes top 3 after scoring |
| **Compression** | `lib/smartmatch/compress.ts` | Token-budget-aware context trimming (max 500 tokens/match, 1200 total), filler removal, sentence-boundary trimming |
| **Confidence** | `lib/smartmatch/confidence.ts` | Multi-factor confidence scoring (0–95 scale) with bonuses/penalties |
| **Normalize** | `lib/smartmatch/normalize.ts` | Clause text standardization for consistent embedding quality |

### Re-Ranking Algorithm

The re-ranker uses a **4-signal weighted formula**:

```
Final Score = 0.6 × Similarity + 0.2 × Keyword Overlap + 0.1 × Recency + 0.1 × Reuse Count
```

| Signal | Weight | Calculation |
|--------|--------|------------|
| **Semantic Similarity** | 60% | Raw vector cosine score from Qdrant |
| **Keyword Overlap** | 20% | Jaccard-like overlap after stop-word removal (56 stop words filtered) |
| **Recency** | 10% | Tiered decay: <30d → 1.0, <90d → 0.8, <180d → 0.6, <365d → 0.4, else → 0.2 |
| **Reuse Count** | 10% | Sigmoid normalization: `count / (count + 5)` |

### Confidence Scoring

| Factor | Effect |
|--------|--------|
| Base | Average similarity × 100 |
| 3+ high-quality matches (≥0.8) | +5 bonus |
| Single low-quality match (<0.75) | −10 penalty |
| User-approved content present | +3 bonus |
| No matches at all | Baseline 15 |
| Hard cap | 95 maximum, 10 minimum |

## 2.3 AI Generation Pipeline

**Entry Point:** `app/api/generate-clause/route.ts` — returns **Server-Sent Events (SSE)** for real-time progress.

### 9-Step Generation Flow (Streamed via SSE)

| Step | Stage | Progress | What Happens |
|------|-------|----------|-------------|
| 1 | `normalizing` | 10% | Clause text standardization |
| 2 | `embedding` | 20% | Generate vector from clause text |
| 3 | `searching` | 40% | Query Qdrant for similar knowledge |
| 4 | `ranking` | 50% | Re-rank with 4-signal scoring |
| 5 | `compressing` | 60% | Trim context to token budget |
| 6 | — | — | Calculate confidence score |
| 7 | `generating` | 70% | Build 4-layer prompt → call Gemini 2.0 Flash |
| 8 | `validating` | 90% | Schema-validate JSON response |
| 9 | `complete` | 100% | Save to DB, track usage, return result |

### 4-Layer Prompt System

The prompt builder in `lib/ai/prompt-builder.ts` constructs enterprise-grade prompts:

| Layer | Purpose | Content |
|-------|---------|---------|
| **1. System Authority** | Sets the AI's persona | Enterprise RFP specialist for `{company_name}`, accuracy over creativity, no fabrication |
| **2. Behavioral Constraints** | Guardrails | 8 strict rules: no legal absolutes, conservative on missing info, <300 words, no marketing fluff, no emojis |
| **3. Company Conditioning** | Organization context | Historical writing examples (stylistic guidance only), style profile (sentence length, common phrases, formality/tone) |
| **4. Task Execution** | The actual request | Clause text, risk assessment criteria, strict JSON output schema |

### AI Response Schema

```json
{
  "answer": "Generated response text",
  "confidence_score": 85,
  "risk_flag": "low | medium | high",
  "reasoning_summary": "2-sentence explanation of confidence level"
}
```

**Response Validation** — `lib/ai/validation.ts` enforces schema compliance: every key must match the expected type. Invalid responses are rejected.

**AI Client Configuration:**
- Model: `gemini-2.0-flash`
- Max output tokens: 1024
- Temperature: 0.3 (conservative)
- Top-P: 0.8
- Response format: `application/json`
- Retry: up to 2 retries with exponential backoff
