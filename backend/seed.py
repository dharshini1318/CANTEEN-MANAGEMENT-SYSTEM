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
    
    print("Seed complete!")

if __name__ == "__main__":
    seed_db()
