# Deliverables Checklist

## Core Deliverables
- [ ] **Public GitHub repository:** Complete source code, no committed secrets.
- [ ] **README.md:** Architecture overview, prerequisites, installation, environment variables (with `host.docker.internal`), local/cloud setup, tests, troubleshooting.
- [ ] **PRD.md:** User, problem, success metrics (evaluation dataset), assumptions, scope, flows, criteria, risks, plan.
- [ ] **design.md:** UI/UX principles, architecture, states, responsiveness, accessibility, and strict artifact viewer constraints.
- [ ] **architecture.md:** DB schema (`vector(768)`), API endpoints, LiteLLM proxy agent routing, security strategy, Docker topology.
- [ ] **Agent transcripts (`agent-logs/`):** Real, unfabricated coding-agent transcripts/logs tracking failures and fixes.
- [ ] **Tests:** Meaningful automated tests (including specific HTML XSS security tests and a 10-question RAG evaluation dataset).
- [ ] **Demo video:** A 2–3 minute video (camera enabled). Uploaded to YouTube.

## Application Functionality
- [x] FastAPI backend running and responding
- [x] Next.js frontend running and connected to API
- [x] PostgreSQL database running with pgvector
- [x] Pi Coding Agent SDK integrated securely via LiteLLM proxy to coexist with Ollama
- [x] Ollama configured and reachable from Docker via `OLLAMA_BASE_URL`
- [x] Cloud LLM toggle available
- [x] RAG ingestion pipeline completed on the limited starter subset dataset
- [x] Grounded Q&A evaluated against golden dataset
- [x] Ship 30 for 30 skill generating properly formatted essays
- [x] Artifact viewer rendering HTML safely with `sandbox=""` and strict CSP
