from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.setting import SiteSetting

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    rows = db.query(SiteSetting).all()
    return {r.key: r.value for r in rows}

@router.put("")
def update_settings(data: Dict[str, str], db: Session = Depends(get_db), _=Depends(get_current_admin)):
    for key, value in data.items():
        row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
        if row:
            row.value = value
        else:
            db.add(SiteSetting(key=key, value=value))
    db.commit()
    return {"ok": True}
