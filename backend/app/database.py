from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Create SQLAlchemy engine with optimized pool settings
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=5,  # Maximum number of connections in the pool
    max_overflow=10,  # Maximum overflow connections
    pool_recycle=1800,  # Recycle connections after 30 minutes to prevent stale connections
    pool_timeout=30,  # Timeout waiting for a connection from the pool
    echo=False,  # Set to True only for debugging - causes high CPU if enabled
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session.
    Use this in route handlers with Depends(get_db).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
