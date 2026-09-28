import sqlite3

items = {
    "Medu Vada": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80",
    "Filter Coffee": "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=800&q=80",
    "Masala Chai": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80",
    "Samosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    "Onion Pakoda": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    "South Indian Thali": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    "Mini Meal": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
    "Paneer Butter Masala Combo": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=800&q=80"
}

conn = sqlite3.connect('backend/campusbite.db')
cursor = conn.cursor()

for name, img_url in items.items():
    cursor.execute("UPDATE menu_items SET image_url = ? WHERE name = ?", (img_url, name))
    print(f"Updated {name}")

conn.commit()
conn.close()
