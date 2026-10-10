# PRD — The Lenny Growth Assistant

**Version:** 1.1 (Revised)  
**Author:** Forward Deployed Engineer (Candidate)  
**Date:** 2026-10-09  
**Status:** Draft — Awaiting Approval

---

## 1. Forward Deployment Discovery Brief

### 1.1 Engagement Context
A product and growth team wants to turn Lenny Rachitsky's Podcast transcripts into a reliable internal assistant. Users need grounded answers, reusable written content, and rendered artifacts — without understanding prompts, models, or infrastructure.

### 1.2 Primary User
**Product Managers, Growth Leads, and Content Strategists** who regularly consume Lenny's Podcast for product and growth insights but struggle to quickly find specific advice, synthesize frameworks, and turn raw insights into polished, publishable written content.

### 1.3 Problem Statement
Product professionals spend **hours** searching, re-listening, and manually synthesizing insights from podcast episodes. Translating advice into actionable written content requires additional effort. There is no single tool that lets them **ask a question → get a grounded answer → generate polished content → view it rendered** in one workflow.

### 1.4 Job to Be Done
> "When I'm making a product or growth decision, I want to quickly search Lenny's advice, get a trustworthy answer with sources, and turn it into a shareable document — so I can move faster with confidence."

---

## 2. Success Metrics

To ensure verifiability, success will be measured against a **golden evaluation dataset** of 10 pre-defined product/growth questions.

| Metric | Definition | Target |
|--------|-----------|--------|
| **Answer Groundedness** | Out of 10 evaluation questions, the number of answers that include at least one correct, verifiable transcript citation. | ≥ 9/10 |
| **Artifact Generation Success** | Out of 5 artifact generation prompts, the number that render correctly in the viewer without errors. | 5/5 |
| **Time-to-First-Answer** | Latency from query submission to first token streamed. | < 5s (cloud), < 15s (local Ollama) |
| **Security Pass** | A suite of 3 security test cases (XSS injection attempts via artifact) must all fail to execute. | 3/3 prevented |

---

## 3. Assumptions

| # | Assumption | Rationale |
|---|-----------|-----------|
| A1 | The knowledge base uses the **free public starter pack** (`LennysNewsletter/lennys-newsletterpodcastdata`). This is a **limited subset** (not the full archive). | Full archive at lennysdata.com requires sign-in. The starter pack is sufficient to prove the RAG architecture. |
| A2 | The demo runs **locally** using Ollama (e.g., `llama3.2` or `mistral`). Cloud LLM (Claude) is available via config toggle. | Assignment mandates local demo with Ollama. |
| A3 | The **Claude Agent SDK** is used for agent logic. Because it natively targets Anthropic APIs, we will use **LiteLLM proxy** as a translation layer to connect it to the local Ollama instance. | Satisfies both the SDK requirement and the Ollama requirement honestly and testably. |
| A4 | PostgreSQL runs locally via **Docker Compose** with pgvector extension. | Simplest reproducible setup; no external account needed. |
| A5 | The knowledge base is **pre-ingested at startup** via a CLI script. | Transcripts are static documents; no streaming updates needed. |
| A6 | Embedding model is Ollama's `nomic-embed-text` which outputs **768 dimensions**. Schema will strictly use `vector(768)`. | Keeps the demo self-contained and performant. |
| A7 | "Ship 30 for 30" style means a **~1,250-word essay** with hook, narrative progression, headings, bullets, bold emphasis, and grounded claims. | Assignment explicitly specifies 1,250 words with specific formatting. |
| A8 | Artifact viewer renders HTML using a **strictly sandboxed iframe** (`sandbox=""` - no scripts, no same-origin) + **strict CSP** + **DOMPurify sanitization**. | Crucial for security, as HTML is untrusted LLM output. |

---

## 4. Scope

### 4.1 In Scope (MVP)
- **Grounded Q&A Chat:** RAG-powered conversational assistant over Lenny's transcripts with source citations.
- **Session Management:** Create new chats, maintain independent conversation history per session.
- **Ship 30 for 30 Skill:** Dedicated agent tool that generates ~1,250-word essays in Ship 30 format.
- **Artifact Generation:** Generate Markdown and HTML/CSS documents from conversation context.
- **Artifact Viewer:** In-app side panel rendering artifacts safely.
- **LLM Toggle & Proxy:** LiteLLM proxy container to route Claude SDK calls to local Ollama, plus cloud Anthropic toggle.
- **Persistence:** Conversations, sessions, timestamps, chunks, and artifacts in PostgreSQL.
- **Docker Compose Setup:** One-command startup (Frontend, Backend, DB, LiteLLM) connecting to host Ollama via `host.docker.internal`.
- **Security Tests:** Automated tests verifying iframe sandbox blocks XSS.
- **Real Agent Logs:** Honest documentation of AI development prompts, failures, and decisions.

### 4.2 Intentionally Excluded
- User authentication / login (not required).
- Real-time transcript ingestion (static dataset used).
- Fine-tuning / model training (RAG is sufficient).

---

## 5. Risks and Trade-offs

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Claude SDK to Ollama Incompatibility** | High | Use LiteLLM proxy to translate Anthropic Messages API format into Ollama API format. |
| **Unsafe artifact rendering (XSS)** | High | Multi-layer defense: DOMPurify (server), strict CSP, and `sandbox=""` iframe (client). Add explicit security test cases. |
| **Hallucination / Limited Data** | Medium | Acknowledge in UI that data is a limited subset. Enforce strict RAG grounding via system prompt. |
| **Local model latency/quality** | Medium | Use lightweight models (`llama3.2` 3B or `mistral` 7B). Document expected response times. |
| **Docker-to-Host connectivity** | Medium | Use `host.docker.internal` via environment variable `OLLAMA_BASE_URL` instead of hardcoded localhost. |

---

## 6. User Flows
*(Flows remain unchanged: Grounded Q&A → Ship 30 Essay → Artifact Generation)*

---

## 7. Acceptance Criteria (Highlights)
- **RAG & Grounding:** Answers cite specific transcript sources. Evaluated against 10 golden questions.
- **Agent Integration:** Claude Agent SDK successfully routes tools while running against local Ollama via LiteLLM proxy.
- **Security:** HTML artifacts render visually in an iframe with `sandbox=""` and a strict CSP (`default-src 'none'; style-src 'unsafe-inline' 'self'; img-src data:; sandbox`). Security tests pass.
- **Persistence:** PostgreSQL stores tables: `sessions`, `messages`, `documents`, `chunks`, `artifacts`.
- **Deployment:** `docker-compose up` starts stack. `.env` uses `OLLAMA_BASE_URL=http://host.docker.internal:11434`.
- **Logs:** `agent-logs/` folder contains real, unfabricated development history.
