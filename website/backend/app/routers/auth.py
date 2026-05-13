from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..core.database import get_db
from ..core.security import verify_password, create_access_token
from ..models.admin import Admin

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str
    screen: Optional[str] = None
    timezone: Optional[str] = None

@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == data.username).first()

    forwarded_for = request.headers.get("X-Forwarded-For")
    ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "bilinmiyor")
    ua = request.headers.get("User-Agent", "bilinmiyor")

    # Login log tablosu yoksa sessizce geç
    try:
        from ..models.setting import SiteSetting
        from sqlalchemy import text
        # admin_login_logs tablosuna kaydet
        extra = []
        if data.screen: extra.append(f"Ekran:{data.screen}")
        if data.timezone: extra.append(f"TZ:{data.timezone}")
        details_str = ("Basarili" if (admin and verify_password(data.password, admin.hashed_password)) else "Basarisiz") + (f" | {' | '.join(extra)}" if extra else "")
        db.execute(text("""
            INSERT INTO admin_login_logs (username, ip_address, user_agent, details, created_at)
            VALUES (:u, :ip, :ua, :d, NOW())
        """), {"u": data.username, "ip": ip, "ua": ua, "d": details_str})
        db.commit()
    except Exception:
        db.rollback()

    if not admin or not verify_password(data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": admin.id})
    return {"access_token": token, "token_type": "bearer"}
