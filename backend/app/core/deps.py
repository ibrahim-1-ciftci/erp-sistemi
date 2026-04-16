from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

security = HTTPBearer()

ALL_MODULES = [
    "raw_materials", "products", "bom", "production",
    "orders", "customers", "payments", "debts",
    "cashflow", "purchases", "suppliers", "reports", "settings"
]

# Yeni oluşturulan özel roller için varsayılan: hiçbir şeye erişim yok
DEFAULT_CUSTOM_PERMISSIONS = {
    m: {"view": False, "create": False, "edit": False, "delete": False}
    for m in ALL_MODULES
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanıcı bulunamadı")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin yetkisi gerekli")
    return current_user


def get_role_permissions(db: Session, role: str) -> dict:
    """Bir rol için tüm modül izinlerini döner. Admin her şeye erişebilir."""
    if role == UserRole.admin:
        return {m: {"view": True, "create": True, "edit": True, "delete": True} for m in ALL_MODULES}

    from app.models.role_permission import RolePermission
    rows = db.query(RolePermission).filter(RolePermission.role == role).all()

    # Varsayılan: hiçbir şeye erişim yok (özel roller için güvenli başlangıç)
    perms = {m: {"view": False, "create": False, "edit": False, "delete": False} for m in ALL_MODULES}

    for row in rows:
        if row.module in perms:
            perms[row.module] = {
                "view":   row.can_view,
                "create": row.can_create,
                "edit":   row.can_edit,
                "delete": row.can_delete,
            }
    return perms


def check_permission(module: str, action: str = "view"):
    def _check(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if current_user.role == UserRole.admin:
            return current_user
        perms = get_role_permissions(db, current_user.role)
        if not perms.get(module, {}).get(action, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için yetkiniz yok ({module}/{action})"
            )
        return current_user
    return _check


def log_activity(db: Session, user_id: int, action: str, entity: str = None, entity_id: int = None, details: str = None):
    from app.models.activity_log import ActivityLog
    log = ActivityLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id, details=details)
    db.add(log)
    db.commit()
