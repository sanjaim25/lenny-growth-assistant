import { createAgentSessionServices, createAgentSessionFromServices, SessionManager } from '@mariozechner/pi-coding-agent';
import { getModel } from '@mariozechner/pi-ai';

async function testRuntime() {
    console.log("Testing actual Pi Coding Agent runtime invocation...");
    
    // We don't actually need a real LLM for this test, we just want to verify
    // the runtime initializes correctly without throwing errors.
    const customModel = {
        ...getModel("openai", "gpt-4o-mini"),
        id: "gpt-4o-mini",
        baseUrl: "http://localhost:4000",
        apiKey: "test-key"
    };

    try {
        const services = await createAgentSessionServices({
            cwd: process.cwd(),
            agentDir: "/tmp/.pi",
            resourceLoaderOptions: {
                systemPrompt: "You are a test agent."
            }
        });
        
        const { session } = await createAgentSessionFromServices({
            services,
            sessionManager: SessionManager.inMemory(),
            model: { ...customModel, temperature: 0 },
            noTools: "all"
        });

        if (session && session.agent) {
            console.log("Successfully created AgentSession with official runtime.");
            process.exit(0);
        } else {
            console.error("Failed to create AgentSession properly.");
            process.exit(1);
        }
    } catch (e) {
        console.error("Error invoking runtime:", e);
        process.exit(1);
    }
}

testRuntime();
