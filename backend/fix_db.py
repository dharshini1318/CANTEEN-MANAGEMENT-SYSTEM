import sys
import os
import urllib.request
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
from app.db.session import SessionLocal
from app.models.menu import MenuItem

# A guaranteed valid unsplash food photo (healthy bowl)
FALLBACK_IMG_1 = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=60&w=400&auto=format&fit=crop"
# A guaranteed valid unsplash indian food photo (curry)
FALLBACK_IMG_2 = "https://images.unsplash.com/photo-1589302168068-964664d93cb0?q=60&w=400&auto=format&fit=crop"
# A guaranteed valid unsplash fast food photo
FALLBACK_IMG_3 = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=60&w=400&auto=format&fit=crop"

def check_url(url):
    try:
        req = urllib.request.Request(url, method='HEAD')
        response = urllib.request.urlopen(req, timeout=5)
        return response.status == 200
    except:
        return False

db = SessionLocal()
items = db.query(MenuItem).all()

for item in items:
    # 1. FIX PRICING (Multiply by 100 to convert to paise if it's less than 1000)
    if item.price < 1000:
        item.price = item.price * 100
        
    # 2. FIX 404 IMAGES
    if item.image_url:
        is_valid = check_url(item.image_url)
        if not is_valid:
            print(f"Fixing 404 image for {item.name}")
            if "Samosa" in item.name or "Pakoda" in item.name or "French Fries" in item.name:
                item.image_url = FALLBACK_IMG_3
            elif "Chicken" in item.name or "Thali" in item.name or "Platter" in item.name:
                item.image_url = FALLBACK_IMG_2
            else:
                item.image_url = FALLBACK_IMG_1

db.commit()
print("Successfully fixed prices and broken images!")
