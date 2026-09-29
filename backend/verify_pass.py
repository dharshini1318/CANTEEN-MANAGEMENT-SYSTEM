from app.core.security import verify_password
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
admin = db.query(User).filter(User.username == "admin").first()

if admin:
    print("Admin hash:", admin.hashed_password)
    print("Verification (admin123):", verify_password("admin123", admin.hashed_password))
else:
    print("Admin not found")
