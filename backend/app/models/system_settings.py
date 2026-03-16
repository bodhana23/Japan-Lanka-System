import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    updated_by_employee_id = Column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True
    )
    updated_at = Column(
        DateTime,
        default=get_current_time,
        onupdate=get_current_time,
        nullable=False
    )

    updated_by = relationship("Employee", foreign_keys=[updated_by_employee_id])

    def __repr__(self):
        return f"<SystemSetting {self.key}={self.value}>"
