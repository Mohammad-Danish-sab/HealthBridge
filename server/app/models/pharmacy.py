import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    PROCESSING = "PROCESSING"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    manufacturer = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    unit_price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    requires_prescription = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="SET NULL"), nullable=True)
    total_amount = Column(Float, nullable=False)
    shipping_address = Column(Text, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PLACED, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patient = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    medicine = relationship("Medicine")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.OPEN, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="complaints")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)