from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.user import UserCreate, UserOut, Token, LoginRequest

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Kullanıcı adı zaten kullanımda")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email zaten kullanımda")
    
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()

    # Gerçek IP'yi al (proxy arkasındaysa X-Forwarded-For)
    forwarded_for = request.headers.get("X-Forwarded-For")
    ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "bilinmiyor")
    ua = request.headers.get("User-Agent", "bilinmiyor")

    if not user or not verify_password(login_data.password, user.hashed_password):
        # Başarısız giriş de logla
        db.add(ActivityLog(
            user_id=user.id if user else None,
            action="login_failed",
            entity="auth",
            details=f"Başarısız giriş: {login_data.username}",
            ip_address=ip,
            user_agent=ua,
        ))
        db.commit()
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Hesap devre dışı")

    # Başarılı giriş logla
    extra = []
    if login_data.screen: extra.append(f"Ekran:{login_data.screen}")
    if login_data.timezone: extra.append(f"TZ:{login_data.timezone}")
    details = "Başarılı giriş" + (f" | {' | '.join(extra)}" if extra else "")
    db.add(ActivityLog(
        user_id=user.id,
        action="login",
        entity="auth",
        details=details,
        ip_address=ip,
        user_agent=ua,
    ))
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalı")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Şifre başarıyla değiştirildi"}
