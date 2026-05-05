from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from ..core.database import Base

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title_tr = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    summary_tr = Column(Text, default="")
    summary_en = Column(Text, default="")
    content_tr = Column(Text, default="")
    content_en = Column(Text, default="")
    image = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
