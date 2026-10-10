import express from 'express';
import { createAgentSessionServices, createAgentSessionFromServices, SessionManager } from '@mariozechner/pi-coding-agent';
import { getModel } from '@mariozechner/pi-ai';

const app = express();
app.use(express.json());

app.post('/synthesize', async (req, res) => {
  console.log("Received /synthesize request");
  const { systemPrompt, query, context } = req.body;
  
  const modelName = process.env.MODEL_ID || "gpt-4o-mini";
  
  // Use a base openai model to satisfy type, but override ID to hit litellm alias
  const baseModel = getModel("openai", "gpt-4o-mini");
  const customModel = {
      ...baseModel,
      id: modelName,
      baseUrl: process.env.LITELLM_URL || "http://litellm:4000",
      apiKey: process.env.LITELLM_MASTER_KEY || "sk-dummy"
  };

  try {
      const services = await createAgentSessionServices({
          cwd: process.cwd(),
          agentDir: "/tmp/.pi",
          resourceLoaderOptions: {
              systemPrompt: systemPrompt + "\n\nContext:\n" + context
          }
      });
      
      const { session } = await createAgentSessionFromServices({
          services,
          sessionManager: SessionManager.inMemory(),
          model: { ...customModel, temperature: 0 },
          noTools: "all"
      });

      let fullResponse = "";
      
      session.subscribe((event) => {
          console.log("EVENT:", event.type);
          if (event.type === "message_end" && event.message?.role === "assistant") {
              fullResponse = typeof event.message.content === 'string' ? event.message.content : event.message.content.map(c => c.text).join("");
          }
          if (event.type === "message_update" && event.assistantMessageEvent?.type === "text_delta") {
              fullResponse += event.assistantMessageEvent.delta;
          }
      });

      console.log("Starting prompt with query:", query);
      await session.agent.prompt(query);
      console.log("Waiting for idle...");
      await session.agent.waitForIdle();
      console.log("Idle finished.");
      
      const lastMessage = session.agent.state.messages[session.agent.state.messages.length - 1];
      res.json({ answer: fullResponse, lastMessage });
  } catch (error) {
    console.error("Error in /synthesize:", error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Agent service listening on port ${port}`);
});
