from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import uuid
import enum

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    REFUNDED = "REFUNDED"

class OrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token = Column(String(255), unique=True, nullable=False, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    pickup_code = Column(String(10), nullable=False)
    customer_name = Column(String(255), nullable=False)
    subtotal = Column(Integer, nullable=False)
    
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    order_status = Column(Enum(OrderStatus), default=OrderStatus.CREATED)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    paid_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))
    
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order", uselist=False)
    status_history = relationship("OrderStatusHistory", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"))
    menu_item_id = Column(String(36), ForeignKey("menu_items.id"))
    menu_item_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_time = Column(Integer, nullable=False)
    
    order = relationship("Order", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True)
    amount = Column(Integer, nullable=False)
    method = Column(String(50)) # CASH, UPI
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    confirmed_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    order = relationship("Order", back_populates="payment")
    refund = relationship("RefundRecord", back_populates="payment", uselist=False)

class RefundRecord(Base):
    __tablename__ = "refund_records"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_id = Column(String(36), ForeignKey("payments.id"), unique=True)
    amount = Column(Integer, nullable=False)
    reason = Column(String(255))
    processed_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    payment = relationship("Payment", back_populates="refund")

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"))
    status = Column(Enum(OrderStatus), nullable=False)
    changed_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    order = relationship("Order", back_populates="status_history")
    
class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True)
    receipt_url = Column(String(512))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
