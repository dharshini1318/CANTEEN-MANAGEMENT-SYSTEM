import sqlite3
import urllib.request
import json

items = [
    ("Masala Dosa", "Masala_dosa"),
    ("Idli Sambar", "Idli"),
    ("Medu Vada", "Medu_vada"),
    ("Filter Coffee", "Indian_filter_coffee"),
    ("Masala Chai", "Masala_chai"),
    ("Samosa", "Samosa"),
    ("Onion Pakoda", "Pakora"),
    ("South Indian Thali", "Thali"),
    ("Mini Meal", "Thali"),
    ("Badam Milk", "Almond_milk"),
    ("Pongal", "Pongal_(dish)"),
    ("Curd Rice", "Curd_rice"),
    ("Gulab Jamun", "Gulab_jamun"),
    ("Mysore Pak", "Mysore_pak"),
    ("Paneer Butter Masala Combo", "Paneer_tikka_masala")
]

conn = sqlite3.connect('backend/campusbite.db')
cursor = conn.cursor()

for name, wiki_title in items:
    url = f"https://en.wikipedia.org/w/api.php?action=query&titles={wiki_title}&prop=pageimages&format=json&pithumbsize=800"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            pages = data['query']['pages']
            page_id = list(pages.keys())[0]
            if page_id != "-1" and 'thumbnail' in pages[page_id]:
                img_url = pages[page_id]['thumbnail']['source']
                cursor.execute("UPDATE menu_items SET image_url = ? WHERE name = ?", (img_url, name))
                print(f"Updated {name}: {img_url}")
            else:
                print(f"No image found for {name}")
    except Exception as e:
        print(f"Error for {name}: {e}")

conn.commit()
conn.close()
