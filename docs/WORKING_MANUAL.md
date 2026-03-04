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

---

# Deploy 3 — Integrations & Automation

> **Scope:** Gmail inbox scanning, email classification pipeline, organization training, knowledge vault management, and style profiling.

## 3.1 Gmail Integration

### OAuth Connection Flow

| Endpoint | Purpose |
|----------|---------|
| `app/api/connect-gmail/route.ts` | Initiates Google OAuth 2.0 flow with `gmail.readonly` scope |
| `app/api/gmail-callback/route.ts` | Exchanges auth code for tokens, stores encrypted tokens in `gmail_connections` |

### Inbox Scanner

**Entry Point:** `app/api/scan-inbox/route.ts`

**Flow:**
1. Fetch latest 20 emails from Gmail API
2. Deduplicate against `email_logs` table
3. Extract subject, sender, snippet, and attachment filenames
4. Classify each email through the classification pipeline
5. Store results in `email_logs` with classification metadata
6. Return scan summary: total scanned, RFPs detected, per-email results

**Dashboard:** The Gmail Hub page (`/dashboard/gmail`) provides scan controls, connection status, and detected RFP list.

## 3.2 Email Classification Pipeline

The classification system uses a **staged approach** controlled by `lib/classification/decision-controller.ts`:

### Stage 1: Heuristic Filter

`lib/classification/heuristic.ts` performs fast keyword-based detection:

| Signal | Keywords Checked | Max Score |
|--------|-----------------|-----------|
| **Subject** | 13 terms: rfp, rfi, rfq, tender, proposal, bid, solicitation… | 30 points |
| **Body** | 16 terms: deadline, scope of work, evaluation criteria, sealed bid… | 30 points |
| **Attachments** | 7 filename patterns: rfp, tender, sow… | 20 points |
| **Has Attachment** | Any attachment present | 10 points |

**Decision Logic:**
- Score ≥ 50 → **Likely RFP** (confidence capped at 65, passed to next stage)
- Score ≤ 10 → **Not RFP** (confidence 90+)
- Score 11–49 → **Ambiguous** (forwarded to ML/AI classification stage)

### Stage 2+: ML & AI Classification (Architecture Ready)

The `classifyEmail` controller is designed for multi-stage escalation: heuristic → ML → AI. The ML and AI stages are extension points for production.

## 3.3 Organization Training

**Entry Point:** `app/api/train-organization/route.ts`

Trains AeonRFP on an organization's writing style by analyzing uploaded documents:

1. **Document Upload** — Past RFP responses, company policies, capability statements
2. **Style Analysis** — `lib/training/style-profile.ts` computes:
   - **Average sentence length** (word count per sentence)
   - **Common phrases** — Top-20 bigrams appearing 3+ times
   - **Formality score** (0–1) — Measures formal vs. informal language, passive voice ratio
   - **Tone vector** — Scores across 4 dimensions: confident, cautious, technical, professional
3. **Profile Storage** — Saved to `style_profile` table, one per tenant

The style profile feeds directly into **Layer 3 (Company Conditioning)** of the prompt system, ensuring AI-generated responses match the organization's voice.

## 3.4 Knowledge Vault

**Entry Points:**
- `app/api/upload-knowledge/route.ts` — Upload reference documents
- Dashboard: `/dashboard/knowledge` — Browse and manage knowledge base

**Features:**
- File deduplication via SHA hash (`UNIQUE(tenant_id, file_hash)`)
- Chunking into knowledge fragments with clause type classification
- User approval workflow (`is_user_approved` flag on chunks)
- Reuse tracking — `reuse_count` increments each time a chunk is matched
- `last_used_at` timestamp for recency signals

---

# Deploy 4 — Analytics, Cost Controls & Production Hardening

> **Scope:** Usage monitoring, plan enforcement, cost controls, billing integration, and production infrastructure.

## 4.1 Plan System

Two-tier plan architecture configured in `lib/plans/enforcement.ts`:

| Feature | Starter | Growth |
|---------|---------|--------|
| RFPs per month | Limited | Unlimited (`null`) |
| Knowledge vault | Limited MB | Higher limit |
| Advanced analytics | ❌ | ✅ |

**Enforcement Points:**
- `create_rfp` — Checks monthly RFP count against plan limit
- `process_clause` — Per-RFP clause processing (no hard limit)
- `upload_knowledge` — Checks vault storage against MB limit

**Upgrade Nudges** — Triggered at 80% RFP usage and 85% vault capacity.

## 4.2 Cost Control System (4 Modules)

| Module | File | Purpose |
|--------|------|---------|
| **Token Manager** | `lib/cost/token-manager.ts` | Estimates token usage (4 chars/token), enforces hard caps (4000 input + 1024 output), clause length limits (1500 chars), and cost estimation using Gemini Flash pricing |
| **Usage Tracker** | `lib/cost/usage-tracker.ts` | Logs per-action telemetry (tenant, action, tokens, latency, cost), monthly cost threshold checks ($50 default) |
| **Rate Limiter** | `lib/cost/rate-limiter.ts` | Prevents API abuse at the tenant level |
| **Embedding Cache** | `lib/cost/embedding-cache.ts` | SHA-256 hash-based deduplication; reuses cached embeddings instead of calling the API |

### Token Budget Breakdown

```
Total Budget = Input (4000) + Output (1024) = 5024 tokens

Input allocation:
├── Clause text:     variable
├── Context matches: variable (max 1200 tokens)
├── System prompt:   ~500 tokens
└── Output budget:   1024 tokens
```

### Cost Estimation

Using Gemini 2.0 Flash pricing:
- Input: $0.075 per million tokens
- Output: $0.30 per million tokens
- Per-request estimate: `(input/1000 × $0.000075) + (output/1000 × $0.0003)`

## 4.3 Analytics Dashboard

The analytics page at `/dashboard/analytics` tracks:
- **Win Rate** — Percentage of proposals resulting in wins
- **Active RFPs** — Documents currently in processing pipeline
- **Average Confidence** — Mean confidence score across all generated responses
- **Response Time** — Average time from upload to completed draft
- **Clause Reuse Patterns** — Which knowledge chunks are reused most frequently

Built with **Recharts** for interactive data visualization.

## 4.4 Security & Multi-Tenancy

| Measure | Implementation |
|---------|---------------|
| **Row-Level Security** | RLS on 5 core tables — data never leaks between tenants |
| **Tenant Namespacing** | Qdrant vector queries filtered by `tenant_id` |
| **Token Encryption** | Gmail OAuth tokens stored as encrypted text |
| **Auth Middleware** | Every request validated via Supabase SSR cookies |
| **Role-Based Access** | 3 roles: admin, member, viewer |
| **Input Validation** | Zod schemas + manual validation on all API routes |
| **HTTPS** | Enforced via Vercel deployment |

## 4.5 Production Deployment

**Platform:** Vercel (Next.js native)

**Environment Variables Required:**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GEMINI_API_KEY` | Google AI API key |
| `QDRANT_URL` | Qdrant Cloud instance |
| `QDRANT_API_KEY` | Qdrant authentication |
| `GOOGLE_CLIENT_ID` | Gmail OAuth client |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth secret |
| `STRIPE_SECRET_KEY` | Stripe billing |

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload-rfp` | ✅ | Upload RFP document to storage |
| POST | `/api/process-rfp` | ✅ | Parse document into clauses + embeddings |
| POST | `/api/generate-clause` | ✅ | Generate AI response for a clause (SSE stream) |
| POST | `/api/upload-knowledge` | ✅ | Add document to knowledge vault |
| POST | `/api/train-organization` | ✅ | Train style profile from documents |
| POST | `/api/connect-gmail` | ✅ | Initiate Gmail OAuth flow |
| GET | `/api/gmail-callback` | — | OAuth callback handler |
| POST | `/api/scan-inbox` | ✅ | Scan connected inbox for RFPs |

---

## File Map

```
AeonRFP/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Auth: login
│   ├── signup/page.tsx             # Auth: signup
│   ├── api/
│   │   ├── upload-rfp/             # Document upload
│   │   ├── process-rfp/            # RFP parsing pipeline
│   │   ├── generate-clause/        # AI generation (SSE)
│   │   ├── upload-knowledge/       # Knowledge vault upload
│   │   ├── train-organization/     # Style profile training
│   │   ├── connect-gmail/          # Gmail OAuth init
│   │   ├── gmail-callback/         # OAuth callback
│   │   └── scan-inbox/             # Inbox scanner
│   └── dashboard/
│       ├── page.tsx                # Overview with stats
│       ├── upload/                 # RFP upload UI
│       ├── clauses/                # Clause intelligence viewer
│       ├── editor/                 # Draft response editor
│       ├── analytics/              # Performance charts
│       ├── knowledge/              # Knowledge vault manager
│       ├── gmail/                  # Gmail integration hub
│       ├── processing/             # RFP processing queue
│       └── settings/               # Account & plan settings
├── lib/
│   ├── ai/
│   │   ├── client.ts               # Gemini 2.0 Flash integration
│   │   ├── prompt-builder.ts       # 4-layer prompt system
│   │   └── validation.ts           # JSON response validation
│   ├── smartmatch/
│   │   ├── embedding.ts            # Vector generation + caching
│   │   ├── search.ts               # Qdrant tenant-namespaced search
│   │   ├── rerank.ts               # 4-signal re-ranking
│   │   ├── compress.ts             # Token-budget context compression
│   │   ├── confidence.ts           # Multi-factor confidence scoring
│   │   └── normalize.ts            # Clause text normalization
│   ├── classification/
│   │   ├── heuristic.ts            # Stage 1: keyword-based RFP detection
│   │   └── decision-controller.ts  # Multi-stage classification orchestrator
│   ├── training/
│   │   └── style-profile.ts        # Formality, tone, phrase extraction
│   ├── cost/
│   │   ├── token-manager.ts        # Token budgets & cost estimation
│   │   ├── usage-tracker.ts        # Per-tenant usage telemetry
│   │   ├── rate-limiter.ts         # API rate limiting
│   │   └── embedding-cache.ts      # Hash-based embedding dedup
│   ├── plans/
│   │   └── enforcement.ts          # Plan limits & upgrade nudges
│   └── supabase/
│       ├── schema.sql              # 14-table schema with RLS
│       ├── server.ts               # Server-side Supabase client
│       ├── client.ts               # Browser-side Supabase client
│       └── middleware.ts           # Auth session management
└── types/
    └── database.ts                 # TypeScript types & plan configs
```

---

*Built by Aeonark Labs · Confidential*
