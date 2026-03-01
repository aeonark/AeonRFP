-- ============================================
-- AeonRFP Database Schema
-- Supabase (PostgreSQL)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'growth')),
  usage_rfps_this_month INT NOT NULL DEFAULT 0,
  vault_storage_used_mb NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_billing_cycle_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rfp_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  clause_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfp_id UUID NOT NULL REFERENCES rfp_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clause_text TEXT NOT NULL,
  clause_index INT NOT NULL,
  clause_type TEXT DEFAULT 'general' CHECK (clause_type IN ('technical', 'compliance', 'financial', 'operational', 'legal', 'general')),
  generated_answer TEXT,
  confidence_score NUMERIC(5,2),
  risk_flag TEXT DEFAULT 'low' CHECK (risk_flag IN ('low', 'medium', 'high')),
  reasoning_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_hash TEXT,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, file_hash)
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  clause_type TEXT DEFAULT 'general' CHECK (clause_type IN ('technical', 'compliance', 'financial', 'operational', 'legal', 'general')),
  reuse_count INT NOT NULL DEFAULT 0,
  is_user_approved BOOLEAN NOT NULL DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ORGANIZATION TRAINING
-- ============================================

CREATE TABLE organization_training_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('rfp_response', 'policy', 'capability')),
  file_url TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE style_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  avg_sentence_length NUMERIC(6,2),
  tone_vector JSONB DEFAULT '{}',
  common_phrases JSONB DEFAULT '[]',
  formality_score NUMERIC(3,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EMBEDDING CACHE
-- ============================================

CREATE TABLE embeddings_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_hash TEXT NOT NULL UNIQUE,
  vector JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- GMAIL INTEGRATION
-- ============================================

CREATE TABLE gmail_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  subject TEXT,
  sender TEXT,
  snippet TEXT,
  received_at TIMESTAMPTZ,
  classified_as_rfp BOOLEAN DEFAULT FALSE,
  classification_method TEXT CHECK (classification_method IN ('heuristic', 'ml', 'ai')),
  classification_confidence NUMERIC(5,2),
  intent_type TEXT CHECK (intent_type IN ('rfp', 'rfi', 'general_procurement', 'not_relevant')),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, gmail_message_id)
);

CREATE TABLE auto_detected_rfps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email_log_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  attachment_url TEXT NOT NULL,
  rfp_document_id UUID REFERENCES rfp_documents(id),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gmail_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  auto_scan_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  scan_frequency_minutes INT NOT NULL DEFAULT 30
);

-- ============================================
-- USAGE & MONITORING
-- ============================================

CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  cost_estimate NUMERIC(10,6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_rfp_docs_tenant ON rfp_documents(tenant_id);
CREATE INDEX idx_clauses_rfp ON clauses(rfp_id);
CREATE INDEX idx_clauses_tenant ON clauses(tenant_id);
CREATE INDEX idx_knowledge_docs_tenant ON knowledge_documents(tenant_id);
CREATE INDEX idx_knowledge_chunks_tenant ON knowledge_chunks(tenant_id);
CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX idx_embeddings_hash ON embeddings_cache(text_hash);
CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX idx_usage_metrics_tenant ON usage_metrics(tenant_id);
CREATE INDEX idx_usage_metrics_created ON usage_metrics(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rfp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
