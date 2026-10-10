# The Lenny Growth Assistant - Demo Script

**Target Length:** 2-3 minutes
**Preparation:**
- Have the repository open.
- Run `docker compose up -d` in the background.
- Have the Next.js UI open at `localhost:3000`.

---

**[0:00 - 0:30] Introduction & Architecture**
- "Hi, this is my submission for The Lenny Growth Assistant."
- "The goal of this project was to build a secure, local-first RAG chat assistant referencing Lenny's Podcast transcripts."
- "I'm using a FastAPI backend, a Next.js frontend with Tailwind CSS, and PostgreSQL with pgvector for the database."
- "To satisfy both the local Ollama requirement and the agent runtime requirement, I integrated the official Pi Coding Agent SDK via a Node.js sidecar service. It routes through a LiteLLM proxy container to communicate natively with local Llama 3.2, ensuring honest coexistence."

**[0:30 - 1:15] Chat & RAG Demonstration**
- *Show the UI.* "Let's create a new chat and ask a grounded question: 'What does Jen Abel say about closing enterprise deals?'"
- *Wait for the answer.*
- "As you can see, it retrieved chunks from the database using pgvector and used them to synthesize an answer. Notice the specific, clickable citations referencing Jen Abel."
- "Now let's ask a hallucination test: 'What does Lenny say about quantum computing?'"
- *Wait for the refusal.* "The system correctly detects insufficient evidence and refuses to hallucinate."

**[1:15 - 2:00] Ship 30 for 30 Essay Skill**
- "Now let's demonstrate the Ship 30 for 30 essay generation skill."
- *Click the Write Essay button and enter the topic 'Enterprise Sales' with the angle 'A beginner's guide'.*
- "This triggers a multi-section RAG generation approach that iteratively builds a long-form essay."
- *Show the generated essay in the Artifact Viewer.*
- "The artifact viewer renders the Markdown into HTML. It is strictly sandboxed using an `iframe` with `sandbox=\"\"` and protected by DOMPurify and Content Security Policies to prevent XSS attacks."

**[2:00 - 2:30] Testing & Conclusion**
- *Switch to terminal.* "Let's run the backend test suite."
- *Run `docker compose exec backend sh -c "PYTHONPATH=/app pytest"`.*
- "The tests cover everything from database migrations and RAG retrieval to agent generation and failure states."
- "Everything is tracked cleanly in Git without exposing secrets."
- "Thank you for watching!"
