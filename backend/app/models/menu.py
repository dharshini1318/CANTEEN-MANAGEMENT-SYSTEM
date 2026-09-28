from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import uuid

class MenuCategory(Base):
    __tablename__ = "menu_categories"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id = Column(String(36), ForeignKey("menu_categories.id"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(Integer, nullable=False) # in paise
    image_url = Column(String(512))
    is_active = Column(Boolean, default=True)
    inventory_mode = Column(String(50), default="AVAILABILITY_ONLY") # AVAILABILITY_ONLY, QUANTITY_TRACKED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    category = relationship("MenuCategory")
    inventory = relationship("Inventory", back_populates="menu_item", uselist=False)
    schedules = relationship("MenuSchedule", back_populates="menu_item")

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    menu_item_id = Column(String(36), ForeignKey("menu_items.id"), unique=True)
    quantity = Column(Integer, default=0)
    is_available = Column(Boolean, default=True) # for AVAILABILITY_ONLY items
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    menu_item = relationship("MenuItem", back_populates="inventory")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    menu_item_id = Column(String(36), ForeignKey("menu_items.id"))
    change_amount = Column(Integer, nullable=False)
    reason = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(255))

class MenuSchedule(Base):
    __tablename__ = "menu_schedules"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    menu_item_id = Column(String(36), ForeignKey("menu_items.id"))
    day_of_week = Column(Integer) # 0 = Monday, 6 = Sunday
    is_special = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    menu_item = relationship("MenuItem", back_populates="schedules")

class MenuSpecialOverride(Base):
    __tablename__ = "menu_special_overrides"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    menu_item_id = Column(String(36), ForeignKey("menu_items.id"))
    override_date = Column(DateTime(timezone=True))
    is_special = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
