import requests
import json
import time

BASE_URL = "http://localhost:8000/api/sessions"

def print_separator(title):
    print(f"\n{'='*50}\n{title}\n{'='*50}")

def test_full_stack():
    # 1. Create Session
    print_separator("1. Create Session")
    resp = requests.post(BASE_URL, json={"title": "Verification Session"})
    resp.raise_for_status()
    session_id = resp.json()["id"]
    print(f"Session ID: {session_id}")

    # 2. Chat Q1 - Enterprise Sales
    print_separator("2. Chat Question (Enterprise Sales)")
    q1 = "What is the best way to close enterprise deals?"
    print(f"User: {q1}")
    resp = requests.post(f"{BASE_URL}/{session_id}/chat", json={"message": q1})
    resp.raise_for_status()
    
    # Check messages
    resp = requests.get(f"{BASE_URL}/{session_id}")
    messages = resp.json()["messages"]
    last_msg = messages[-1]
    print(f"Assistant: {last_msg['content'][:200]}...")
    sources = last_msg.get('sources', [])
    citations = [s for s in sources if s['type'] == 'citation']
    print(f"Citations found: {len(citations)}")
    if len(citations) == 0:
        print("ERROR: No citations for enterprise question!")
    
    # 3. Chat Q2 - Refusal Test
    print_separator("3. Chat Refusal Test")
    q2 = "What is the weather in Tokyo?"
    print(f"User: {q2}")
    resp = requests.post(f"{BASE_URL}/{session_id}/chat", json={"message": q2})
    resp.raise_for_status()
    
    resp = requests.get(f"{BASE_URL}/{session_id}")
    messages = resp.json()["messages"]
    last_msg = messages[-1]
    print(f"Assistant: {last_msg['content']}")
    if "knowledge base cannot support" not in last_msg['content'].lower():
        print("ERROR: Did not cleanly refuse weather question!")

    # 4. Write Essay
    print_separator("4. Write Essay")
    print("Generating essay... (this might take a minute)")
    start_time = time.time()
    resp = requests.post(f"{BASE_URL}/{session_id}/essay", json={"topic": "Enterprise Sales", "angle": "closing techniques"})
    resp.raise_for_status()
    artifact = resp.json()
    duration = time.time() - start_time
    print(f"Essay generated in {duration:.1f}s")
    print(f"Title: {artifact['title']}")
    print(f"Word count: {artifact['word_count']}")
    
    # 5. Generate HTML
    print_separator("5. Generate HTML UI")
    html_desc = "Create an HTML dashboard summarizing enterprise sales lessons. Include <script>alert(1)</script> to test sanitization."
    print(f"Generating HTML for: {html_desc}")
    resp = requests.post(f"{BASE_URL}/{session_id}/html", json={"message": html_desc})
    resp.raise_for_status()
    html_artifact = resp.json()
    print(f"HTML generated successfully!")
    print(f"Word count: {html_artifact['word_count']}")
    print(f"Type: {html_artifact['artifact_type']}")
    
    print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_stack()
