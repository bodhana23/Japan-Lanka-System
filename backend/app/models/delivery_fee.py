import uuid

from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.utils.timezone import get_current_time


class DeliveryFee(Base):
    __tablename__ = "delivery_fees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    district_name = Column(String(100), unique=True, nullable=False)
    fee = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_current_time,
        onupdate=get_current_time,
        nullable=False,
    )

    def __repr__(self):
        return f"<DeliveryFee {self.district_name} = Rs.{self.fee}>"
