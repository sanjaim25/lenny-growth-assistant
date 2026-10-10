# The Lenny Growth Assistant

This is the AI-powered conversational web application for "The Lenny Growth Assistant", leveraging FastAPI, Next.js, PostgreSQL (pgvector), and the Pi Coding Agent SDK (via a Node.js sidecar and LiteLLM proxy for local Ollama compatibility).

## Prerequisites

- **Docker** and **Docker Compose** installed.
- **Ollama** installed on your host machine (Windows/Mac/Linux).
- Required Ollama models:
  - `llama3.2`
  - `nomic-embed-text`

You can pull the models using:
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

## Setup & Run Instructions

1. **Clone the repository.**
2. **Environment Variables:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   **Model Selection (Local vs Cloud):**
   By default, the application runs fully locally using Ollama (`gpt-4o-mini` mapped to `llama3.2`).
   To switch to a cloud model like Anthropic Claude, open `.env` and set:
   ```bash
   MODEL_ID=claude-3-5-sonnet
   ANTHROPIC_API_KEY=your_key_here
   ```
   *Note: Switching back to local is as simple as reverting `MODEL_ID=gpt-4o-mini`.*
3. **Start the stack:**
   ```bash
   docker compose up --build -d
   ```
   This command will:
   - Start the PostgreSQL database with `pgvector`
   - Start the LiteLLM proxy to translate OpenAI/Anthropic API calls to the host's Ollama instance.
   - Start the Node.js `agent-service` for running the Pi Coding Agent SDK.
   - Run backend database migrations.
   - Start the FastAPI backend at `http://localhost:8000`
   - Start the Next.js frontend at `http://localhost:3000`

4. **Ingest Transcripts (One-Time):**
   ```bash
   docker compose exec backend bash -c "mkdir -p data && git clone https://github.com/LennysNewsletter/lennys-newsletterpodcastdata.git data/transcripts || true"
   docker compose exec backend python cli_ingest.py
   ```
   You can verify ingestion by accessing `http://localhost:8000/api/knowledge/status`.

5. **Verify Health:**
   Open [http://localhost:3000](http://localhost:3000) to see the frontend chat interface.

## Running Tests

To run the full backend pytest suite (which includes RAG evaluations and artifact generation tests):
```bash
docker compose exec backend sh -c "PYTHONPATH=/app pytest"
```

To run the Node agent-service smoke test:
```bash
docker compose exec agent-service npm test
```

## Architecture

See `architecture.md` for a detailed breakdown of the system architecture, component boundaries, and security strategies.

## Agent Logs

See `agent-logs/` for an honest history of AI-assisted development sessions, architectural decisions, and troubleshooting logs.
