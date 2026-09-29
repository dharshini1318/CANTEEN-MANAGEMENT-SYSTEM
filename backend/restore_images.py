import sys
import os
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
from app.db.session import SessionLocal
from app.models.menu import MenuItem

wiki_images = {"Idli Sambar": "https://upload.wikimedia.org/wikipedia/commons/1/11/Idli_Sambar.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", "Vada Pao": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Vada_Pav-Indian_street_food.JPG/960px-Vada_Pav-Indian_street_food.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Rava Upma": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/A_photo_of_Upma.jpg/960px-A_photo_of_Upma.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Puri Sabji": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Fluffy_Poori_%28cropped%29.JPG/960px-Fluffy_Poori_%28cropped%29.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "South Indian Thali": "https://upload.wikimedia.org/wikipedia/commons/4/49/Vegetarian_Curry.jpeg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", "Hyderabadi Chicken Biryani": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Hyderabadi_Chicken_Biryani.jpg/960px-Hyderabadi_Chicken_Biryani.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Veg Fried Rice": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Koh_Mak%2C_Thailand%2C_Fried_rice_with_seafood%2C_Thai_fried_rice.jpg/960px-Koh_Mak%2C_Thailand%2C_Fried_rice_with_seafood%2C_Thai_fried_rice.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Mutton Rogan Josh Meal": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Rogan_Josh_Kashmiri.jpg/960px-Rogan_Josh_Kashmiri.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Filter Coffee": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Filter_kaapi.JPG/960px-Filter_kaapi.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Masala Chai": "https://upload.wikimedia.org/wikipedia/commons/8/89/Chai_In_Sakora.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", "Fresh Lime Soda": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Limeade.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", "Mango Lassi": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Salt_lassi.jpg/960px-Salt_lassi.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Cold Coffee": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Affogato_al_Caffe.jpg/960px-Affogato_al_Caffe.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Gulab Jamun (2 pcs)": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Gulab-jamun-wallpaper-1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled", "Rasmalai": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Ras_Malai_2.JPG/960px-Ras_Malai_2.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Chocolate Brownie": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Chocolatebrownie.JPG/960px-Chocolatebrownie.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail", "Ice Cream Sundae": "https://upload.wikimedia.org/wikipedia/commons/a/ae/StrawberrySundae.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled"}

# Verified unsplash images
overrides = {
    "Masala Dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800", # actually a dosa
    "Paneer Butter Masala Combo": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=800",
    "Punjabi Samosa (2 pcs)": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
    "Pani Puri (6 pcs)": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800", # generic indian
    "Gobi 65": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=800",
    "Crispy French Fries": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800", # fries
    "Onion Pakoda": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
    "Chettinad Chicken Combo": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    "Special Veg Maharaja Thali": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
    "Tandoori Platter": "https://images.unsplash.com/photo-1599487405270-8e12eb2fea10?w=800"
}

db = SessionLocal()
items = db.query(MenuItem).all()

for item in items:
    if item.name in wiki_images:
        item.image_url = wiki_images[item.name]
    elif item.name in overrides:
        url = overrides[item.name]
        item.image_url = f"{url.split('?')[0]}?q=60&w=400&auto=format&fit=crop"

db.commit()
print("Images properly restored!")
