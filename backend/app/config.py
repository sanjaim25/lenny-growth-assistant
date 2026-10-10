from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/growth_assistant"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LITELLM_URL: str = "http://localhost:4000"
    LITELLM_MASTER_KEY: str = ""
    ANTHROPIC_API_KEY: str | None = None
    USE_CLOUD_LLM: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
