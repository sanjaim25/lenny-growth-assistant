import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.schema import Base
from app.database import engine

@pytest.fixture(autouse=True)
async def setup_db():
    # In a real app we'd use a separate test DB, but for this exercise we can use the same 
    # since it's just testing locally in the docker container.
    # We won't wipe the DB, we'll just test isolation via UUIDs.
    pass

@pytest.mark.asyncio
async def test_session_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create a session
        response = await ac.post("/api/sessions", json={"title": "Test Chat"})
        assert response.status_code == 200
        session_data = response.json()
        assert session_data["title"] == "Test Chat"
        session_id = session_data["id"]
        assert session_id is not None
        
        # 2. List sessions
        response = await ac.get("/api/sessions")
        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) > 0
        assert any(s["id"] == session_id for s in sessions)
        
        # 3. Chat in the session
        response = await ac.post(f"/api/sessions/{session_id}/chat", json={"message": "Hello Lenny"})
        assert response.status_code == 200
        msg_data = response.json()
        assert msg_data["role"] == "assistant"
        assert len(msg_data["content"]) > 0
        
        # 4. Rename the session
        rename_res = await ac.patch(f"/api/sessions/{session_id}", json={"title": "Renamed Chat"})
        assert rename_res.status_code == 200
        assert rename_res.json()["title"] == "Renamed Chat"

        # 5. Get the session details and verify renamed title
        response = await ac.get(f"/api/sessions/{session_id}")
        assert response.status_code == 200
        session_detail = response.json()
        assert session_detail["title"] == "Renamed Chat"
        assert len(session_detail["messages"]) == 2 # 1 user + 1 assistant
        
        user_msg = session_detail["messages"][0]
        assert user_msg["role"] == "user"
        assert user_msg["content"] == "Hello Lenny"
        
        # 6. Delete the session
        response = await ac.delete(f"/api/sessions/{session_id}")
        assert response.status_code == 204
        
        # 7. Verify deletion
        response = await ac.get(f"/api/sessions/{session_id}")
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_session_isolation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create session 1
        resp1 = await ac.post("/api/sessions", json={"title": "Session 1"})
        s1_id = resp1.json()["id"]
        
        # Create session 2
        resp2 = await ac.post("/api/sessions", json={"title": "Session 2"})
        s2_id = resp2.json()["id"]
        
        # Send message to 1
        await ac.post(f"/api/sessions/{s1_id}/chat", json={"message": "Msg 1"})
        
        # Verify 1 has messages, 2 has none
        d1 = (await ac.get(f"/api/sessions/{s1_id}")).json()
        d2 = (await ac.get(f"/api/sessions/{s2_id}")).json()
        
        assert len(d1["messages"]) == 2
        assert len(d2["messages"]) == 0

@pytest.mark.asyncio
async def test_error_cases():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 404 Get
        response = await ac.get("/api/sessions/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404
        
        # 422 Invalid payload
        response = await ac.post("/api/sessions/00000000-0000-0000-0000-000000000000/chat", json={})
        assert response.status_code == 422

        # 404 Rename non-existent session
        response = await ac.patch("/api/sessions/00000000-0000-0000-0000-000000000000", json={"title": "Test"})
        assert response.status_code == 404

        # 422 Rename empty title
        response = await ac.patch("/api/sessions/00000000-0000-0000-0000-000000000000", json={"title": ""})
        assert response.status_code in [400, 422]
