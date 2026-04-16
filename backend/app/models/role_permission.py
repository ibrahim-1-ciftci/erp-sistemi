from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

# Her rol için modül bazlı izin tablosu
# module: raw_materials, products, bom, production, orders, customers,
#         payments, debts, cashflow, purchases, suppliers, reports, settings
# action: view, create, edit, delete

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id     = Column(Integer, primary_key=True, index=True)
    role   = Column(String, nullable=False, index=True)   # "user", "manager" vb.
    module = Column(String, nullable=False)
    can_view   = Column(Boolean, default=True)
    can_create = Column(Boolean, default=False)
    can_edit   = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
