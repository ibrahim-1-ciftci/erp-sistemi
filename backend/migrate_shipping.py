import sys
sys.path.append(".")
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_term_days INTEGER"))
    try:
        conn.execute(text("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'shipped'"))
    except Exception as e:
        print("enum note:", e)
    conn.commit()
    print("Migration OK")
