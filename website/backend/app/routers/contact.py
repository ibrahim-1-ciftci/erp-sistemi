from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.contact import ContactMessage

router = APIRouter(prefix="/api/contact", tags=["contact"])

class ContactIn(BaseModel):
    name: str
    email: str
    phone: str = ""
    message: str

@router.post("")
def send_message(data: ContactIn, db: Session = Depends(get_db)):
    msg = ContactMessage(**data.model_dump())
    db.add(msg)
    db.commit()
    return {"ok": True}

@router.get("")
def list_messages(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()

@router.put("/{id}/read")
def mark_read(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    msg = db.query(ContactMessage).filter(ContactMessage.id == id).first()
    if not msg:
        raise HTTPException(404, "Not found")
    msg.is_read = True
    db.commit()
    return {"ok": True}

@router.delete("/{id}")
def delete_message(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    msg = db.query(ContactMessage).filter(ContactMessage.id == id).first()
    if not msg:
        raise HTTPException(404, "Not found")
    db.delete(msg)
    db.commit()
    return {"ok": True}
