import uuid

from sqlalchemy import Column, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class ReturnItem(Base):
    __tablename__ = "return_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    return_request_id = Column(UUID(as_uuid=True), ForeignKey("return_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    order_item_id = Column(UUID(as_uuid=True), ForeignKey("order_items.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=get_current_time, nullable=False)

    # Relationships
    return_request = relationship("ReturnRequest", back_populates="return_items")
    order_item = relationship("OrderItem", back_populates="return_items")

    def __repr__(self):
        return f"<ReturnItem {self.id} - qty: {self.quantity}>"
