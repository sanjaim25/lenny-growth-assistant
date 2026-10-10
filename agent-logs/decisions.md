# AI-Assisted Development: Decisions

*This document tracks the key architectural, technical, and product decisions made during the development of The Lenny Growth Assistant, specifically noting where AI assistance influenced the outcome.*

### 2026-10-09 — Initial Architecture & Stack Selection
**Context:** Need to select the tech stack and architectural approach for the application.
**Decision/Issue:** Chose FastAPI, Next.js, PostgreSQL with `pgvector`, and Claude Agent SDK.
**Reasoning:** 
- FastAPI is native Python, async-first, and integrates perfectly with AI libraries and the Claude Agent SDK.
- `pgvector` was chosen over a dedicated vector DB (like Pinecone) to keep the deployment simple (one `docker-compose.yml`) and because it is the 2026 industry standard for standard RAG workloads.
- Next.js provides a robust frontend framework for building the chat UI and artifact viewer.
- Claude Agent SDK was selected over Pi Coding Agent as it is Python-native and integrates seamlessly into the FastAPI backend logic.
**AI Tool Used:** Gemini / Antigravity Agent
