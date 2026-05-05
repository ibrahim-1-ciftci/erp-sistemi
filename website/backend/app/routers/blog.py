from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os, shutil, uuid
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..core.config import settings
from ..models.blog import BlogPost

router = APIRouter(prefix="/api/blog", tags=["blog"])

def post_to_dict(p: BlogPost) -> dict:
    return {
        "id": p.id,
        "title_tr": p.title_tr,
        "title_en": p.title_en,
        "summary_tr": p.summary_tr,
        "summary_en": p.summary_en,
        "content_tr": p.content_tr,
        "content_en": p.content_en,
        "image": p.image,
        "is_active": p.is_active,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }

@router.get("")
def list_posts(active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(BlogPost)
    if active_only:
        q = q.filter(BlogPost.is_active == True)
    return [post_to_dict(p) for p in q.order_by(BlogPost.created_at.desc()).all()]

@router.get("/{id}")
def get_post(id: int, db: Session = Depends(get_db)):
    p = db.query(BlogPost).filter(BlogPost.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")
    return post_to_dict(p)

@router.post("")
def create_post(
    title_tr: str = Form(...),
    title_en: str = Form(...),
    summary_tr: str = Form(""),
    summary_en: str = Form(""),
    content_tr: str = Form(""),
    content_en: str = Form(""),
    is_active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    image_path = ""
    if image and image.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = image.filename.split(".")[-1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        with open(os.path.join(settings.UPLOAD_DIR, filename), "wb") as f:
            shutil.copyfileobj(image.file, f)
        image_path = f"/uploads/{filename}"

    p = BlogPost(title_tr=title_tr, title_en=title_en, summary_tr=summary_tr,
                 summary_en=summary_en, content_tr=content_tr, content_en=content_en,
                 image=image_path, is_active=is_active)
    db.add(p)
    db.commit()
    db.refresh(p)
    return post_to_dict(p)

@router.put("/{id}")
def update_post(
    id: int,
    title_tr: str = Form(...),
    title_en: str = Form(...),
    summary_tr: str = Form(""),
    summary_en: str = Form(""),
    content_tr: str = Form(""),
    content_en: str = Form(""),
    is_active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    p = db.query(BlogPost).filter(BlogPost.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")

    if image and image.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = image.filename.split(".")[-1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        with open(os.path.join(settings.UPLOAD_DIR, filename), "wb") as f:
            shutil.copyfileobj(image.file, f)
        p.image = f"/uploads/{filename}"

    p.title_tr = title_tr
    p.title_en = title_en
    p.summary_tr = summary_tr
    p.summary_en = summary_en
    p.content_tr = content_tr
    p.content_en = content_en
    p.is_active = is_active
    db.commit()
    db.refresh(p)
    return post_to_dict(p)

@router.delete("/{id}")
def delete_post(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    p = db.query(BlogPost).filter(BlogPost.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")
    db.delete(p)
    db.commit()
    return {"ok": True}
