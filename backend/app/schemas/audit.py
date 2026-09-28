from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogBase(BaseModel):
    actor: str
    action: str
    entity: str
    details: Optional[Dict[str, Any]] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
