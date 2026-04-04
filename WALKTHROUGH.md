# AeonRFP — Real-World Data Pipeline Walkthrough

> **Date:** April 5, 2026  
> **Version:** 1.1.0  
> **Status:** ✅ Verified & Deployed

---

## Overview

This update transitions AeonRFP from demo/placeholder data to a **fully functional, real-world document processing pipeline**. Upload a PDF, DOCX, or XLSX → the system parses it server-side, extracts clauses, classifies each by type, assesses risk, and makes the data available across all dashboard pages.

---

## Architecture

```
Upload (PDF/DOCX/XLSX)
    │
    ▼
/api/process-local (Server-Side)
    │
    ├─ pdf-parse (PDF extraction)
    ├─ mammoth (DOCX extraction)
    └─ xlsx / SheetJS (Excel extraction)
    │
    ▼
splitIntoClauses() → normalizeClause()
    │
    ▼
classifyClause() + assessRisk()
    │
    ▼
localStorage (Client-Side Persistence)
    │
    ├─ /dashboard          → Real stats & recent RFPs
    ├─ /dashboard/clauses  → Extracted clauses with filters
    ├─ /dashboard/editor   → Edit & generate AI responses
    └─ /dashboard/analytics → Charts & metrics from real data
```

---

## New Files

| File | Purpose |
|------|---------|
| `lib/store/local-store.ts` | localStorage-backed CRUD for RFPs & clauses with in-memory caching |
| `lib/classification/classify.ts` | Keyword-based clause type classifier (technical, compliance, financial, operational, legal, general) + risk assessment |
| `app/api/process-local/route.ts` | Server-side document parsing API — receives file, returns structured clauses |

## Modified Files

| File | What Changed |
|------|-------------|
| `app/dashboard/upload/page.tsx` | Real file processing via `/api/process-local` instead of `setTimeout` simulation |
| `app/dashboard/clauses/page.tsx` | Removed all hardcoded demo data; loads from local store |
| `app/dashboard/editor/page.tsx` | Loads/saves from local store; SSE generation intact; export creates markdown |
| `app/dashboard/analytics/page.tsx` | Computes metrics from real data instead of querying Supabase |
| `app/dashboard/page.tsx` | Shows real stats and recent RFPs table from local store |

---

## How to Test

1. Start the dev server: `npm run dev`
2. Navigate to `/dashboard/upload`
3. Drop any PDF or DOCX file
4. Watch real-time processing stages (text extraction → clause splitting → classification)
5. Visit `/dashboard/clauses` to see extracted clauses with type tags and confidence scores
6. Visit `/dashboard/editor` to edit/generate responses per clause
7. Visit `/dashboard/analytics` to see charts computed from your actual data

### AI Generation (Optional)

To enable AI-powered response generation in the Draft Editor, add a real Gemini API key to `.env.local`:

```env
GEMINI_API_KEY=your_real_key_here
```

---

## Classification System

The clause classifier uses weighted keyword dictionaries to categorize clauses without requiring AI:

| Type | Example Keywords |
|------|-----------------|
| **Technical** | system, API, architecture, cloud, infrastructure, SLA |
| **Compliance** | NIST, HIPAA, GDPR, FedRAMP, certification, audit |
| **Financial** | cost, pricing, budget, invoice, ROI, licensing |
| **Operational** | staffing, training, support, milestones, timeline |
| **Legal** | indemnify, liability, warranty, IP, termination |
| **General** | (fallback when no keywords match) |

Risk assessment flags clauses as **low**, **medium**, or **high** based on obligation keywords (shall, must, penalty, indemnify, etc.).

---

## Data Persistence

Data is stored in `localStorage` under two keys:
- `aeonrfp_rfps` — RFP document metadata
- `aeonrfp_clauses` — Individual extracted clauses

This persists across page navigations and browser refreshes. When Supabase credentials are configured, the local store interfaces map directly to the existing database schema for a seamless migration.

---

## What's Next

- [ ] Connect real Supabase credentials for cloud persistence
- [ ] Set `GEMINI_API_KEY` for AI response generation
- [ ] Add batch processing for multiple simultaneous uploads
- [ ] Implement clause similarity search via embeddings
