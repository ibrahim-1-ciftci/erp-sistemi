from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.core.security import verify_password, get_password_hash
from app.models.setting import Setting
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULTS = {
    "company_name":   "Laves Kimya",
    "company_sub":    "Uretim ve Isletme Yonetim Sistemi",
    "kdv_rate":       "20",
    "default_unit":   "kg",   # varsayılan birim
    "weight_units":   "kg,g,ton,lt,ml,adet,kutu,paket,metre,cm",  # birim listesi
}

def get_setting(db: Session, key: str) -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    return row.value if row else DEFAULTS.get(key, "")

def set_setting(db: Session, key: str, value: str):
    row = db.query(Setting).filter(Setting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(Setting(key=key, value=value))
    db.commit()

class SettingsUpdate(BaseModel):
    company_name:  Optional[str] = None
    company_sub:   Optional[str] = None
    kdv_rate:      Optional[float] = None
    default_unit:  Optional[str] = None
    weight_units:  Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.get("")
def get_all_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.core.deps import get_role_permissions
    perms = get_role_permissions(db, current_user.role)
    return {
        "company_name":  get_setting(db, "company_name"),
        "company_sub":   get_setting(db, "company_sub"),
        "kdv_rate":      float(get_setting(db, "kdv_rate") or "20"),
        "default_unit":  get_setting(db, "default_unit") or "kg",
        "weight_units":  get_setting(db, "weight_units") or "kg,g,ton,lt,ml,adet,kutu,paket,metre,cm",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "permissions": perms,
        }
    }

@router.put("")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if data.company_name is not None: set_setting(db, "company_name", data.company_name)
    if data.company_sub  is not None: set_setting(db, "company_sub",  data.company_sub)
    if data.kdv_rate     is not None: set_setting(db, "kdv_rate",     str(data.kdv_rate))
    if data.default_unit is not None: set_setting(db, "default_unit", data.default_unit)
    if data.weight_units is not None: set_setting(db, "weight_units", data.weight_units)
    return {"message": "Ayarlar kaydedildi"}

@router.post("/change-password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalı")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Şifre değiştirildi"}


# ── Kullanıcı Yönetimi (sadece admin) ──────────────────────────────────────

class UserCreateAdmin(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"

class UserUpdateAdmin(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # yeni şifre (opsiyonel)

@router.get("/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.user import User as UserModel
    users = db.query(UserModel).order_by(UserModel.created_at).all()
    return [{"id": u.id, "username": u.username, "email": u.email,
             "role": u.role, "is_active": u.is_active, "created_at": u.created_at} for u in users]

@router.post("/users")
def create_user(data: UserCreateAdmin, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.user import User as UserModel
    if db.query(UserModel).filter(UserModel.username == data.username).first():
        raise HTTPException(400, "Kullanıcı adı zaten kullanımda")
    if db.query(UserModel).filter(UserModel.email == data.email).first():
        raise HTTPException(400, "E-posta zaten kullanımda")
    u = UserModel(username=data.username, email=data.email,
                  hashed_password=get_password_hash(data.password), role=data.role)
    db.add(u); db.commit(); db.refresh(u)
    return {"id": u.id, "username": u.username, "email": u.email, "role": u.role, "is_active": u.is_active}

@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserUpdateAdmin, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.user import User as UserModel
    u = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not u: raise HTTPException(404, "Kullanıcı bulunamadı")
    if data.email: u.email = data.email
    if data.role: u.role = data.role   # artık herhangi bir rol adı olabilir
    if data.is_active is not None: u.is_active = data.is_active
    if data.password: u.hashed_password = get_password_hash(data.password)
    db.commit(); db.refresh(u)
    return {"id": u.id, "username": u.username, "email": u.email, "role": u.role, "is_active": u.is_active}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.user import User as UserModel
    if user_id == current_user.id: raise HTTPException(400, "Kendinizi silemezsiniz")
    u = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not u: raise HTTPException(404, "Kullanıcı bulunamadı")
    db.delete(u); db.commit()
    return {"message": "Kullanıcı silindi"}


# ── Özel Rol Yönetimi ──────────────────────────────────────────────────────

class RoleCreate(BaseModel):
    name:  str   # slug: "imalatci"
    label: str   # görünen: "İmalatçı"

class PermissionUpdate(BaseModel):
    module:     str
    can_view:   bool = False
    can_create: bool = False
    can_edit:   bool = False
    can_delete: bool = False

@router.get("/roles")
def list_roles(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.custom_role import CustomRole
    roles = db.query(CustomRole).order_by(CustomRole.label).all()
    return [{"name": r.name, "label": r.label, "id": r.id} for r in roles]

@router.post("/roles")
def create_role(data: RoleCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.custom_role import CustomRole
    slug = data.name.lower().replace(" ", "_")
    if slug in ("admin", "user"):
        raise HTTPException(400, "Bu rol adı rezerve edilmiş")
    if db.query(CustomRole).filter(CustomRole.name == slug).first():
        raise HTTPException(400, "Bu rol adı zaten mevcut")
    role = CustomRole(name=slug, label=data.label)
    db.add(role); db.commit(); db.refresh(role)
    return {"name": role.name, "label": role.label, "id": role.id}

@router.delete("/roles/{role_name}")
def delete_role(role_name: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.custom_role import CustomRole
    from app.models.role_permission import RolePermission
    from app.models.user import User as UserModel
    if role_name in ("admin", "user"):
        raise HTTPException(400, "Sistem rolleri silinemez")
    role = db.query(CustomRole).filter(CustomRole.name == role_name).first()
    if not role: raise HTTPException(404, "Rol bulunamadı")
    # Bu roldeki kullanıcıları 'user' rolüne düşür
    db.query(UserModel).filter(UserModel.role == role_name).update({"role": "user"})
    db.query(RolePermission).filter(RolePermission.role == role_name).delete()
    db.delete(role); db.commit()
    return {"message": "Rol silindi"}

@router.get("/permissions/{role}")
def get_permissions(role: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.core.deps import get_role_permissions, ALL_MODULES
    perms = get_role_permissions(db, role)
    return {"role": role, "modules": ALL_MODULES, "permissions": perms}

@router.put("/permissions/{role}")
def update_permissions(
    role: str,
    updates: list[PermissionUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    from app.models.role_permission import RolePermission
    if role == "admin":
        raise HTTPException(400, "Admin rolünün izinleri değiştirilemez")
    for upd in updates:
        row = db.query(RolePermission).filter(
            RolePermission.role == role,
            RolePermission.module == upd.module
        ).first()
        if row:
            row.can_view   = upd.can_view
            row.can_create = upd.can_create
            row.can_edit   = upd.can_edit
            row.can_delete = upd.can_delete
        else:
            db.add(RolePermission(
                role=role, module=upd.module,
                can_view=upd.can_view, can_create=upd.can_create,
                can_edit=upd.can_edit, can_delete=upd.can_delete
            ))
    db.commit()
    return {"message": f"{role} izinleri güncellendi"}
