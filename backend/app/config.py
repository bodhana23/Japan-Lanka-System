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
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

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
    FIREBASE_CLOCK_SKEW_SECONDS: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="forbid",
    )


settings = Settings()
