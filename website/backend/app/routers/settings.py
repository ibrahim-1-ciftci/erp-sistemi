from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
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

@router.get("/login-logs")
def get_login_logs(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    try:
        rows = db.execute(text("""
            SELECT id, username, ip_address, user_agent, details, created_at
            FROM admin_login_logs
            ORDER BY created_at DESC
            LIMIT 100
        """)).fetchall()
    except Exception:
        return []

    result = []
    for row in rows:
        ua = row.user_agent or ""
        if "Mobile" in ua or "Android" in ua or "iPhone" in ua:
            device = "📱 Mobil"
        elif "Windows" in ua:
            device = "🖥️ Windows"
        elif "Mac" in ua:
            device = "🍎 Mac"
        elif "Linux" in ua:
            device = "🐧 Linux"
        else:
            device = "❓ Bilinmiyor"

        browser = "Bilinmiyor"
        if "Chrome" in ua and "Edg" not in ua:
            browser = "Chrome"
        elif "Firefox" in ua:
            browser = "Firefox"
        elif "Safari" in ua and "Chrome" not in ua:
            browser = "Safari"
        elif "Edg" in ua:
            browser = "Edge"

        result.append({
            "id": row.id,
            "username": row.username,
            "success": "Basarili" in (row.details or ""),
            "ip_address": row.ip_address or "—",
            "device": device,
            "browser": browser,
            "details": row.details or "",
            "created_at": row.created_at,
        })
    return result
