from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from app.db.session import get_db
from app.models.closing import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse, AuditLogCreate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(100).all()
    return logs

@router.post("/", response_model=AuditLogResponse)
def create_audit_log(log_in: AuditLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Any authenticated user can create an audit log (e.g., workers doing actions)
    db_log = AuditLog(
        actor=log_in.actor,
        action=log_in.action,
        entity=log_in.entity,
        details=log_in.details
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
