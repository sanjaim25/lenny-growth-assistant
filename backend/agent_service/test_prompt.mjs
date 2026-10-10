import { createAgentSessionServices, createAgentSessionFromServices, SessionManager } from '@mariozechner/pi-coding-agent';
import { getModel } from '@mariozechner/pi-ai';

async function run() {
    const customModel = {
        ...getModel("openai", "gpt-4o-mini"),
        id: "gpt-4o-mini",
        baseUrl: "http://localhost:4000",
        apiKey: "sk-dummy"
    };

    const services = await createAgentSessionServices({
        cwd: process.cwd(),
        agentDir: "/tmp/.pi",
        sessionManager: SessionManager.inMemory(),
        resourceLoaderOptions: {
            systemPrompt: "You are a helpful assistant. Reply with one word: HI"
        }
    });

    const { session } = await createAgentSessionFromServices({
        services,
        model: { ...customModel, temperature: 0 }
    });

    session.subscribe(e => console.log("EVENT:", e.type));

    console.log("Calling prompt...");
    await session.agent.prompt("Say hello");
    
    console.log("Waiting for idle...");
    await session.agent.waitForIdle();
    
    console.log("Messages:", JSON.stringify(session.agent.state.messages, null, 2));
    process.exit(0);
}
run();
