from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import uuid

class DailyClosing(Base):
    __tablename__ = "daily_closings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(Date, unique=True, nullable=False)
    total_orders = Column(Integer, default=0)
    total_sales = Column(Integer, default=0)
    upi_total = Column(Integer, default=0)
    cash_total = Column(Integer, default=0)
    upi_count = Column(Integer, default=0)
    cash_count = Column(Integer, default=0)
    expired_count = Column(Integer, default=0)
    closed_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_by = Column(String(255))
    
    corrections = relationship("DailyClosingCorrection", back_populates="daily_closing")

class DailyClosingCorrection(Base):
    __tablename__ = "daily_closing_corrections"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    daily_closing_id = Column(String(36), ForeignKey("daily_closings.id"))
    reason = Column(String(255))
    amount_adjusted = Column(Integer, nullable=False)
    adjusted_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    daily_closing = relationship("DailyClosing", back_populates="corrections")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String(255), nullable=False)
    action = Column(String(255), nullable=False)
    entity = Column(String(255), nullable=False)
    details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
