import sys
import os
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.menu import MenuCategory, MenuItem, Inventory
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    
    # Check if already seeded
    # Check if already seeded - removed for re-seeding
    # if db.query(User).count() > 0:
    #     print("Database already seeded")
    #     return
        
    print("Seeding users...")
    users = [
        User(username="admin", hashed_password=get_password_hash("admin123"), role="ADMIN"),
        User(username="cashier1", hashed_password=get_password_hash("cashier123"), role="CASHIER"),
        User(username="foodservice1", hashed_password=get_password_hash("foodservice123"), role="FOOD_SERVICE")
    ]
    db.add_all(users)
    
    print("Seeding menu categories...")
    categories = [
        MenuCategory(name="Breakfast", display_order=1),
        MenuCategory(name="Meals", display_order=2),
        MenuCategory(name="Snacks", display_order=3),
        MenuCategory(name="Drinks", display_order=4),
        MenuCategory(name="Desserts", display_order=5),
        MenuCategory(name="Specials", display_order=6)
    ]
    db.add_all(categories)
    db.commit() # commit to get category IDs
    
    cat_map = {c.name: c.id for c in categories}
    
    print("Seeding menu items...")
    menu_items = [
      {
        "name": "Masala Dosa",
        "description": "Crispy rice crepe filled with spiced potato mash. Served with sambar and chutney.",
        "price": 4500,
        "category_id": cat_map["Breakfast"],
        "is_active": True,
        "inventory_mode": "AVAILABILITY_ONLY",
        "image_url": "https://images.unsplash.com/photo-1668236543090-82bbe5ce5e91?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Idli Sambar",
        "description": "Steamed rice cakes served with lentil soup and coconut chutney.",
        "price": 3500,
        "category_id": cat_map["Breakfast"],
        "is_active": True,
        "inventory_mode": "AVAILABILITY_ONLY",
        "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Medu Vada",
        "description": "Crispy fried lentil donuts, savory and spiced.",
        "price": 3000,
        "category_id": cat_map["Breakfast"],
        "is_active": True,
        "inventory_mode": "AVAILABILITY_ONLY",
        "image_url": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Filter Coffee",
        "description": "Authentic South Indian filter coffee with frothy milk.",
        "price": 2000,
        "category_id": cat_map["Drinks"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 5, 
        "image_url": "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Masala Chai",
        "description": "Strong tea brewed with milk and warm spices.",
        "price": 1500,
        "category_id": cat_map["Drinks"],
        "is_active": True,
        "inventory_mode": "AVAILABILITY_ONLY",
        "image_url": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Samosa",
        "description": "Crispy pastry stuffed with spiced potatoes and peas.",
        "price": 1500,
        "category_id": cat_map["Snacks"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Onion Pakoda",
        "description": "Crispy onion fritters made with gram flour and spices.",
        "price": 2500,
        "category_id": cat_map["Snacks"],
        "is_active": True,
        "inventory_mode": "AVAILABILITY_ONLY",
        "is_available": False,
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "South Indian Thali",
        "description": "Complete meal with rice, sambar, rasam, poriyal, curd, and papad.",
        "price": 8000,
        "category_id": cat_map["Meals"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 30,
        "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Mini Meal",
        "description": "Quick meal with variety rice (lemon/tamarind) and curd rice.",
        "price": 6000,
        "category_id": cat_map["Meals"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Badam Milk",
        "description": "Chilled almond milk flavored with saffron and cardamom.",
        "price": 3500,
        "category_id": cat_map["Drinks"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 10,
        "image_url": "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Pongal",
        "description": "Creamy rice and lentil comfort dish tempered with cumin and pepper.",
        "price": 4000,
        "category_id": cat_map["Breakfast"],
        "is_active": True,
        "inventory_mode": "AVAILABILITY_ONLY",
        "image_url": "https://images.unsplash.com/photo-1630851840633-f96999247032?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Curd Rice",
        "description": "Cool yogurt rice with tempering — the classic comfort finisher.",
        "price": 3000,
        "category_id": cat_map["Meals"],
        "is_active": True,
        "inventory_mode": "AVAILABILITY_ONLY",
        "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Gulab Jamun",
        "description": "Soft milk dumplings soaked in rose and cardamom syrup.",
        "price": 2000,
        "category_id": cat_map["Desserts"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1599557457811-042878bf93d8?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Mysore Pak",
        "description": "Rich and dense sweet made from gram flour, ghee, and sugar.",
        "price": 2500,
        "category_id": cat_map["Desserts"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1626245131975-d14fcab1baee?w=400&h=300&fit=crop&q=80",
      },
      {
        "name": "Paneer Butter Masala Combo",
        "description": "Rich paneer gravy served with 2 butter naans and salad.",
        "price": 12000,
        "category_id": cat_map["Specials"],
        "is_active": True,
        "inventory_mode": "QUANTITY_TRACKED",
        "quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=400&h=300&fit=crop&q=80",
      }
    ]
    
    for item_data in menu_items:
        quantity = item_data.pop("quantity", 0)
        is_available = item_data.pop("is_available", True)
        
        db_item = MenuItem(**item_data)
        db.add(db_item)
        db.flush()
        
        inv = Inventory(
            menu_item_id=db_item.id,
            quantity=quantity,
            is_available=is_available
        )
        db.add(inv)
        
    db.commit()
    print("Seed complete!")

if __name__ == "__main__":
    seed_db()
