from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    SECURITY: JWT_SECRET_KEY has no default value - the application
    will fail to start if it's not set, preventing insecure defaults.
    """

    # Database settings
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "japanlanka"
    DATABASE_USER: str = "bodhanajayawickrama"
    DATABASE_PASSWORD: str = ""

    # Construct database URL (using psycopg driver)
    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_PASSWORD:
            return f"postgresql+psycopg://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        return f"postgresql+psycopg://{self.DATABASE_USER}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    # CORS settings
    # Comma-separated list of allowed origins. Use a plain string so Azure App Service
    # can set it via a single Application Setting (Azure only supports string values).
    # Local dev default covers both Vite ports.
    # Production example: "https://your-app.azurestaticapps.net"
    CORS_ORIGINS_STR: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]

    # API settings
    API_V1_PREFIX: str = "/api/v1"

    # JWT settings
    # SECURITY: No default value - app fails fast if not configured.
    # This prevents running with an insecure or guessable secret.
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Firebase settings
    FIREBASE_CREDENTIALS_PATH: str = ""
    # Alternative to FIREBASE_CREDENTIALS_PATH for cloud deployments (e.g., Azure App Service)
    # where there is no persistent filesystem. Paste the full JSON content of the service
    # account key file as a single string in this env var.
    FIREBASE_CREDENTIALS_JSON: str = ""
    FIREBASE_CLOCK_SKEW_SECONDS: int = 10

    # PayHere Payment Gateway settings
    PAYHERE_MERCHANT_ID: str = "1233973"
    PAYHERE_MERCHANT_SECRET: str = ""
    PAYHERE_SANDBOX: bool = True
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="forbid",
    )


settings = Settings()
