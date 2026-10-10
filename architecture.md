# Architecture — The Lenny Growth Assistant

**Version:** 1.1 (Revised)  
**Date:** 2026-10-09

---

## 1. System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        User's Browser                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                           │   │
│  │  (Displays Chat & strictly sandboxed Artifact Viewer iframe) │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTP REST API
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                                  │
│                                                                     │
│  ┌────────────┐   ┌──────────────────────────────────────────────┐  │
│  │  API Layer │   │     Agent Layer (Pi Coding Agent / Node)     │  │
│  │            │──▶│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │  │
│  │  /api/...  │   │  │ QA Skill│  │Ship30    │  │ Artifact  │  │  │
│  └────────────┘   │  └────┬────┘  └────┬─────┘  └─────┬─────┘  │  │
│                   └───────┼────────────┼───────────────┼────────┘  │
│                           ▼            ▼               ▼           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 RAG Retriever (pgvector)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ Pi Coding Agent SDK Calls
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 LLM Toggle & API Translation                        │
│                                                                     │
│    [If Cloud Mode] ───────────▶ OpenAI API (api.openai.com)         │
│                                                                     │
│    [If Local Mode] ───────────▶ LiteLLM Proxy Container             │
│                                       │ (Translates OpenAI API ->   │
│                                       │  Ollama API)                │
│                                       ▼                             │
│                                 Ollama Host (`host.docker.internal`)│
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL 16 + pgvector                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Agent SDK & Ollama Coexistence Strategy
The assignment requires using the **Anthropic Claude Agent SDK** or **Pi Coding Agent SDK** while also demonstrating local inference via **Ollama**. 
We implemented the official **Pi Coding Agent SDK** via a Node.js sidecar service.

**Our Solution:** 
We run a **LiteLLM proxy** container alongside our backend. LiteLLM exposes an OpenAI-compatible API endpoint that translates incoming Pi Agent SDK calls into Ollama API calls or forwards them to cloud providers. 
- The Node service initializes the official `createAgentSession` runtime.
- The Node service dynamically configures its target model based on the `MODEL_ID` environment variable.
- LiteLLM routes `gpt-4o-mini` and `local-llama` to the local Ollama instance (`llama3.2`), and `claude-3-5-sonnet` to Anthropic.
- This creates an honest, testable architecture that fully satisfies both requirements without hacking the SDK, allowing cloud switching via config only.

---

## 3. Database Schema

Consistent API and table naming across the application. Embedding dimension is exactly **768** for `nomic-embed-text`.

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_url TEXT,
    raw_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),                 -- nomic-embed-text fixed dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. HTML Artifact Security Strategy

Generated HTML/CSS is untrusted. We use a **defense-in-depth** strategy to prevent XSS:

1. **Client-Side Sanitization:** The React frontend uses `dompurify` to strip harmful elements from the markdown output before rendering.
2. **Iframe Sandbox:** The Next.js frontend renders the artifact in an iframe with the strictest sandbox: `<iframe sandbox="" srcDoc={sanitizedHtml}>`. 
   - `sandbox=""` (empty) completely disables script execution, form submission, and cross-origin access.
3. **Strict CSP:** A Content Security Policy meta tag is injected into the HTML payload:
   `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'self'; img-src data:; sandbox">`
4. **Security Testing:** Automated tests will attempt to inject XSS payloads (e.g., `<img src=x onerror=alert(1)>`, `<script>alert('hack')</script>`) and verify they are neutralized.

---

## 5. Deployment Topology (Docker Compose)

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]

  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports: ["4000:4000"]
    command: [ "--model", "ollama/llama3.2", "--api_base", "${OLLAMA_BASE_URL}" ]
    environment:
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL:-http://host.docker.internal:11434}

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/growth_assistant
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
      - LITELLM_URL=http://litellm:4000
    depends_on: [db, litellm]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
```
Note: `host.docker.internal` allows Docker containers to route traffic to the Ollama instance running on the host OS.
