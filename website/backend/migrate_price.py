from sqlalchemy import text
from app.core.database import engine

sql = """
ALTER TABLE website_products 
ADD COLUMN IF NOT EXISTS price FLOAT,
ADD COLUMN IF NOT EXISTS price_discounted FLOAT,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER,
ADD COLUMN IF NOT EXISTS price_unit VARCHAR DEFAULT 'adet',
ADD COLUMN IF NOT EXISTS min_order_qty INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS show_price BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS price_note_tr VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS price_note_en VARCHAR DEFAULT '';
"""

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()

print("Migration OK")
