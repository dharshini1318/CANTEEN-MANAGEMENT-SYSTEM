from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.menu import MenuItem, MenuCategory, MenuSchedule, MenuSpecialOverride, Inventory
from app.schemas.menu import MenuItemEffective, MenuCategoryResponse, MenuItemUpdate
from fastapi import HTTPException

router = APIRouter()

@router.get("/", response_model=List[MenuItemEffective])
def get_menu(admin: bool = False, db: Session = Depends(get_db)):
    if admin:
        items = db.query(MenuItem).all()
    else:
        items = db.query(MenuItem).filter(MenuItem.is_active == True).all()
    
    today = datetime.now()
    day_of_week = today.weekday() # 0 = Monday
    
    result = []
    for item in items:
        # Determine is_special
        is_special = False
        # Check override
        override = db.query(MenuSpecialOverride).filter(
            MenuSpecialOverride.menu_item_id == item.id,
            func.date(MenuSpecialOverride.override_date) == today.date()
        ).first()
        
        if override:
            is_special = override.is_special
        else:
            schedule = db.query(MenuSchedule).filter(
                MenuSchedule.menu_item_id == item.id,
                MenuSchedule.day_of_week == day_of_week
            ).first()
            if schedule:
                is_special = schedule.is_special
                
        # Determine availability and remaining
        is_available = True
        remaining = None
        if item.inventory_mode == "QUANTITY_TRACKED" and item.inventory:
            remaining = item.inventory.quantity
            if remaining <= 0:
                is_available = False
        elif item.inventory_mode == "AVAILABILITY_ONLY" and item.inventory:
            is_available = item.inventory.is_available
            
        result.append(MenuItemEffective(
            id=item.id,
            name=item.name,
            description=item.description,
            price=item.price,
            image_url=item.image_url,
            category_id=item.category_id,
            category=item.category.name if item.category else None,
            is_special=is_special,
            is_available=is_available,
            inventory_mode=item.inventory_mode,
            remaining=remaining,
            is_active=item.is_active
        ))
        
    return result

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(MenuCategory).order_by(MenuCategory.display_order).all()
    return ["All"] + [c.name for c in categories]

@router.patch("/{item_id}")
def update_menu_item(item_id: str, update_data: MenuItemUpdate, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        # Create it if it doesn't exist (useful since frontend uses generated IDs for new items)
        item = MenuItem(id=item_id, name=update_data.name or "New Item", price=update_data.price or 0)
        db.add(item)
        
    if update_data.name is not None:
        item.name = update_data.name
    if update_data.description is not None:
        item.description = update_data.description
    if update_data.price is not None:
        item.price = update_data.price
    if update_data.image_url is not None:
        item.image_url = update_data.image_url
    if update_data.is_active is not None:
        item.is_active = update_data.is_active
    if update_data.inventory_mode is not None:
        item.inventory_mode = update_data.inventory_mode
        
    if update_data.category is not None:
        cat = db.query(MenuCategory).filter(MenuCategory.name == update_data.category).first()
        if not cat and update_data.category:
            cat = MenuCategory(id=update_data.category.lower().replace(' ', '-'), name=update_data.category, display_order=99)
            db.add(cat)
            db.commit() # save category first
        if cat:
            item.category_id = cat.id
            
    db.commit()
    db.refresh(item)
    return {"status": "success"}
