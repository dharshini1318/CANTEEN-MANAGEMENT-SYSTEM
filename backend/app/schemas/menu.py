from pydantic import BaseModel
from typing import List, Optional

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: int
    image_url: Optional[str] = None
    category_id: Optional[str] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    inventory_mode: Optional[str] = None

class MenuItemEffective(MenuItemBase):
    id: str
    category: Optional[str] = None
    is_special: bool
    is_available: bool
    inventory_mode: str
    remaining: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

class MenuCategoryResponse(BaseModel):
    id: str
    name: str
    display_order: int

    class Config:
        from_attributes = True
