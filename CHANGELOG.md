# Changelog

All notable changes to AeonRFP are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/) + [Semantic Versioning](https://semver.org/).

---

## [0.5.0] — 2026-03-05

### Added
- **DOCX Proposal Export** — one-click download of AI-generated proposals with styled title page, typed clause sections, confidence badges, and requirement blockquotes
- **Export Proposal button** in Draft Editor sidebar — visible when completed clauses exist
- New API route: `GET /api/export-proposal?rfp_id=...`

## [0.4.0] — 2026-03-05

### Changed
- **Analytics Dashboard** — replaced all static mock data with real Supabase queries
- Computes: total RFPs, avg confidence, win rate (confidence > 75%), clause reuse rate, response time, top performer
- AreaChart groups by month, BarChart by clause type with custom colors
- Added "Hours Saved" callout (15 min per answered clause)

## [0.3.0] — 2026-03-05

### Changed
- **Draft Editor** — replaced simulated generation with real SSE streaming from `/api/generate-clause`
- Live progress bars with 8 stage labels (normalizing → embedding → searching → ranking → compressing → generating → validating → complete)
- RFP selector, auto-save to Supabase on blur, Generate All button, AbortController for cancellation

### Changed
- **Clause Intelligence** — replaced 4 hardcoded mock clauses with real Supabase queries
- RFP selector dropdown, dynamic clause type filters, stats bar, refresh button
- Loading/error/empty states for all paths

## [0.2.0] — 2026-03-05

### Added
- **Real Document Parsing Pipeline** — PDF (`pdf-parse`), DOCX (`mammoth`), XLSX (`xlsx`)
- New module: `lib/parsing/document-parser.ts` with unified extraction, intelligent clause splitting, and text normalization
- Rewritten `app/api/process-rfp/route.ts` — 10-step real pipeline with Supabase Storage download, status tracking, batch embedding

### Fixed
- TypeScript error in upload page (invalid `FileStatus` comparison)

## [0.1.0] — 2026-03-01

### Added
- Initial AeonRFP platform
- Landing page with animated hero section
- Full dashboard: Overview, Upload, Processing, Clause Intelligence, Draft Editor, Analytics, Knowledge Vault, Gmail Inbox, Settings
- SmartMatch Engine: vector search + reranking + context compression
- AI Engine: 4-layer prompt builder, Gemini 2.0 Flash integration
- Gmail inbox scanner with heuristic RFP classification
- Supabase schema with RLS, multi-tenancy, and performance indexes
- Stripe billing webhooks
- Usage tracking and plan enforcement
- Complete Working Manual (`docs/WORKING_MANUAL.md`)
