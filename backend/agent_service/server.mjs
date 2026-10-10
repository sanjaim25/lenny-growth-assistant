import express from 'express';
import { Agent } from '@earendil-works/pi-agent-core';
import { getModel, stream } from '@earendil-works/pi-ai/compat';

const app = express();
app.use(express.json());

app.post('/synthesize', async (req, res) => {
  const { systemPrompt, query, context } = req.body;
  
  const model = getModel("openai", "gpt-4o-mini");
  if (!model) {
      return res.status(500).json({ error: "Model not found" });
  }

  const customModel = {
      ...model,
      baseUrl: process.env.LITELLM_URL || "http://litellm:4000"
  };

  const agent = new Agent({
    initialState: {
      systemPrompt: systemPrompt + "\n\nContext:\n" + context,
      model: customModel,
    },
    streamFn: stream,
  });

  let fullResponse = "";
  agent.subscribe((event) => {
    console.log("EVENT:", event.type, JSON.stringify(event.message || {}));
    if (event.type === "message_end" && event.message?.role === "assistant") {
      fullResponse = typeof event.message.content === 'string' ? event.message.content : event.message.content.map(c => c.text).join("");
    }
    if (event.type === "message_update" && event.assistantMessageEvent?.type === "text_delta") {
      fullResponse += event.assistantMessageEvent.delta;
    }
  });

  try {
    await agent.prompt(query);
    await agent.waitForIdle();
    const lastMessage = agent.state.messages[agent.state.messages.length - 1];
    res.json({ answer: fullResponse, lastMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Agent service listening on port ${port}`);
});
