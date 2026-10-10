import asyncio
import os
from anthropic import AsyncAnthropic

async def test_litellm():
    client = AsyncAnthropic(
        base_url="http://litellm:4000",
        api_key="sk-1234"
    )
    
    print("Testing basic generation...")
    try:
        response = await client.messages.create(
            model="ollama/llama3.2",
            max_tokens=100,
            messages=[{"role": "user", "content": "Say hello world"}]
        )
        print("Basic response:", response.content[0].text)
    except Exception as e:
        print("Basic generation failed:", e)

    print("\nTesting tool calling...")
    try:
        response = await client.messages.create(
            model="ollama/llama3.2",
            max_tokens=200,
            messages=[{"role": "user", "content": "What is the weather in Paris?"}],
            tools=[
                {
                    "name": "get_weather",
                    "description": "Get the current weather in a given location",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA"
                            }
                        },
                        "required": ["location"]
                    }
                }
            ]
        )
        
        print("Tool call response:", response.model_dump_json(indent=2))
    except Exception as e:
        print("Tool call failed:", e)

if __name__ == "__main__":
    asyncio.run(test_litellm())
