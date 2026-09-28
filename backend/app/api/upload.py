from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import os
import uuid
import shutil
from pathlib import Path
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

# Define upload directory relative to backend root
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        # Generate unique filename
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = UPLOAD_DIR / filename
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return URL path (will be served by StaticFiles in main.py)
        return {"url": f"http://localhost:8000/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
