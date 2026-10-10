

async function run() {
  console.log("Running smoke test for agent-service...");
  try {
    const res = await fetch("http://localhost:3001/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: "You are a helpful assistant.",
        query: "Say hello",
        context: "Context: Hello World"
      })
    });
    const data = await res.json();
    if (data.answer) {
      console.log("Smoke test passed. Received answer:", data.answer);
      process.exit(0);
    } else {
      console.error("Smoke test failed. No answer.", data);
      process.exit(1);
    }
  } catch (err) {
    console.error("Smoke test failed. Exception:", err);
    process.exit(1);
  }
}

run();
