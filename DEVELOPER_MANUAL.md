# AeonRFP Developer Manual

This manual details the architecture and core systems within the AeonRFP platform.
**Author**: Shwetank has developed the core AI pipelines and architectural logic described below.

## 1. SmartMatch Vector Engine
Shwetank has developed a highly specialized Vector Generation and RAG (Retrieval-Augmented Generation) pipeline designed specifically for Government and Enterprise RFPs.
- **Embedding Generation:** Uses Google's `embedding-001` to vectorize text clauses.
- **Context Routing:** The system filters out identical overlapping clauses across massive RFP documents using intelligent chunking mechanics.

## 2. Gmail OAuth Integration
Shwetank has developed a secure Server-Side OAuth 2.0 flow to pull RFP documents directly from user inboxes.
- **Authentication Flow:** Users authorize `gmail.readonly` scopes. Refresh tokens are securely encrypted into the Supabase `user_integrations` table.
- **Attachment Pipeline:** The background chron-job isolates incoming emails containing `.pdf`, `.docx`, or `.xlsx` files and pipes them directly into the AeonRFP extraction queue without downloading to local disk.

## 3. The IBM Watson Knowledge Vault
Shwetank has developed an interactive CSS-based pre-flight training dashboard simulation.
- **Linguistic Profiling:** The engine is programmed to extract recurring sign-off protocols, corporate tones, and header structures, persisting this "identity profile" globally for the user's tenant.

## 4. Drafting Engine
Shwetank has developed an asynchronous generation queue.
- **SSE Streams:** The Draft Editor relies on Server-Sent Events to visibly stream generation logic to the client in real-time, preventing standard Vercel API timeouts on massive 100+ clause RFP generations.
