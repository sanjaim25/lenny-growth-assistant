import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_essay_generation_and_persistence():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create a session
        response = await ac.post("/api/sessions", json={"title": "Essay Test"})
        session_id = response.json()["id"]

        # 1. Ask for an essay that is in the domain
        essay_req = {"topic": "Enterprise Sales", "angle": "B2B SaaS"}
        essay_res = await ac.post(f"/api/sessions/{session_id}/essay", json=essay_req, timeout=300.0)
        assert essay_res.status_code == 200
        
        artifact = essay_res.json()
        assert artifact["id"] is not None
        assert artifact["artifact_type"] == "markdown"
        assert artifact["word_count"] > 0
        assert artifact["title"] is not None
        
        # Verify citation in sources
        sources = artifact.get("sources", [])
        citations = [s for s in sources if s.get("type") == "citation"]
        assert len(citations) > 0, "No citations found, retrieval failed"

        # Check session details to ensure artifact persisted
        session_res = await ac.get(f"/api/sessions/{session_id}")
        assert session_res.status_code == 200
        session_data = session_res.json()
        assert len(session_data["artifacts"]) == 1
        assert session_data["artifacts"][0]["id"] == artifact["id"]

@pytest.mark.asyncio
async def test_essay_insufficient_evidence():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create a session
        response = await ac.post("/api/sessions", json={"title": "Essay Test 2"})
        session_id = response.json()["id"]

        # Ask for an essay out of domain
        essay_req = {"topic": "zxcvbnm qwer tyuiop random gibberish"}
        essay_res = await ac.post(f"/api/sessions/{session_id}/essay", json=essay_req, timeout=300.0)
        assert essay_res.status_code == 200
        
        artifact = essay_res.json()
        # Should refuse
        assert artifact["title"] == "Insufficient Evidence"
        assert "I'm sorry" in artifact["content"]
        
        # No actual podcast citations
        sources = artifact.get("sources", [])
        citations = [s for s in sources if s.get("type") == "citation"]
        assert len(citations) == 0
