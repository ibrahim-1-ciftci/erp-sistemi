from sqlalchemy import Column, Integer, String
from app.core.database import Base

class CustomRole(Base):
    __tablename__ = "custom_roles"

    id    = Column(Integer, primary_key=True, index=True)
    name  = Column(String, unique=True, nullable=False)   # slug: "imalatci"
    label = Column(String, nullable=False)                # görünen: "İmalatçı"
