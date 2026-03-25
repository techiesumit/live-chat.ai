from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Runtime
    runtime_mode: str = "local-oss"      # "local-oss" | "aws"

    # Database
    database_url: str = "sqlite:///./chat.db"

    # LLM
    llm_provider: str = "oss"            # "oss" | "lex"
    llm_base_url: str = "http://llm:11434"
    llm_model: str = "mistral"

    # RAG
    rag_enabled: bool = True
    rag_provider: str = "chroma"         # "chroma" | "bedrock"
    rag_docs_path: str = "./infra/seed/sample_docs"
    chroma_persist_dir: str = "./chroma_store"

    # MCP Tools
    mcp_tools_enabled: bool = True
    mcp_provider: str = "local"          # "local" | "aws"

    # Auth
    auth_provider: str = "local"         # "local" | "keycloak" | "cognito"
    oidc_issuer: Optional[str] = None
    oidc_audience: Optional[str] = None
    oidc_jwks_url: Optional[str] = None

    # Event pipeline
    event_pipeline: str = "db"           # "db" | "eventbridge" | "kinesis"

    class Config:
        env_file = ".env"
        env_prefix = ""
        case_sensitive = False


settings = Settings()
