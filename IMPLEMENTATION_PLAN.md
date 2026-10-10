# Implementation Plan — The Lenny Growth Assistant

**Status:** Awaiting approval before coding begins.

---

## Project Folder Structure

```text
growth-assistant/
├── docker-compose.yml              # DB, Backend, Frontend, LiteLLM
├── .env.example                    # Uses host.docker.internal for Ollama
├── ...
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sessions.py         # Matches /api/sessions schema
│   │   │   ├── chat.py             # Matches /api/sessions/{id}/chat
│   │   │   └── artifacts.py        # Matches /api/sessions/{id}/artifacts
│   │   ├── agent/                  # Claude Agent SDK layer via LiteLLM
│   │   ├── rag/                    # pgvector (768 dim), nomic-embed-text
│   │   └── ingestion/              # Ingests limited starter dataset
│   └── tests/
│       ├── test_security.py        # XSS injection test cases
│       └── test_rag.py             # Evaluation against 10 golden questions
├── frontend/
│   └── src/
│       └── components/Artifact/
│           └── HtmlRenderer.tsx    # Strict sandbox="" iframe with CSP
└── agent-logs/
    ├── decisions.md                # Real decisions
    ├── failures.md                 # Real prompt failures & fixes
    └── session-log.md              # Honest development history
```

---

## Phase 0: Setup & Proxy Config (2 hours)
- [ ] Initialize `docker-compose.yml` with `db`, `backend`, `frontend`, and `litellm`.
- [ ] Configure `.env.example` with `OLLAMA_BASE_URL=http://host.docker.internal:11434` to ensure container-to-host connectivity.
- [ ] Set up Alembic migrations with `vector(768)` for chunks.
- [ ] Verify LiteLLM successfully translates Anthropic proxy calls to local Ollama (`llama3.2`).

## Phase 1: API & Persistence (3 hours)
- [ ] Implement consistent endpoints: `/api/sessions`, `/api/sessions/{id}/chat`, `/api/sessions/{id}/artifacts`.
- [ ] Ensure database schema aligns precisely: `sessions`, `messages`, `documents`, `chunks`, `artifacts`.

## Phase 2: Ingestion & Evaluation (3 hours)
- [ ] Ingest the limited starter subset from `LennysNewsletter/lennys-newsletterpodcastdata`. Document limitations.
- [ ] Create a 10-question golden evaluation dataset for testing RAG accuracy.

## Phase 3: Agent Layer (3 hours)
- [ ] Integrate Claude Agent SDK.
- [ ] Configure the SDK client to point to `LITELLM_URL` when in local mode, ensuring seamless coexistence.
- [ ] Implement skill routing tools.

## Phase 4: Artifact & Skill Generation (2 hours)
- [ ] Ship 30 Skill: Enforce 1,250 words and styling.
- [ ] Artifact Skill: Add server-side HTML sanitization before saving to PostgreSQL.

## Phase 5: Frontend (4 hours)
- [ ] Build Chat UI and Sidebar.
- [ ] Build `HtmlRenderer.tsx` using `<iframe sandbox="" srcDoc="...">`.
- [ ] Inject strict `<meta http-equiv="Content-Security-Policy">` into the artifact markup.

## Phase 6 & 7: Security Tests, Logs & Demo (3 hours)
- [ ] Write `test_security.py` to assert that XSS payloads in artifacts are neutralized.
- [ ] Run the 10-question evaluation dataset and record metrics.
- [ ] Ensure all `agent-logs/` are up-to-date with real, non-fabricated development history.
- [ ] Record demo video.

**Total Estimated Effort: ~20 hours** (Scoped strictly to fit before Oct 12)
