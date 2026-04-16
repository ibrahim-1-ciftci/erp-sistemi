import sys
sys.path.append(".")
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Enum değerleri
    r = conn.execute(text("SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid ORDER BY typname, enumsortorder"))
    enums = {}
    for row in r.fetchall():
        enums.setdefault(row[0], []).append(row[1])
    for name, vals in enums.items():
        print(f"Enum [{name}]: {vals}")

    print()

    # Kayıt sayıları
    for t in ['users','customers','orders','products','raw_materials','employees','payments','debts','cashflows','purchases','boms']:
        try:
            cnt = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
            print(f"  {t}: {cnt} kayit")
        except Exception as e:
            print(f"  {t}: HATA - {e}")

    print()

    # Son hata logları — activity_logs
    try:
        r = conn.execute(text("SELECT action, entity, details, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 5"))
        rows = r.fetchall()
        if rows:
            print("Son 5 aktivite logu:")
            for row in rows:
                print(f"  {row[3]} | {row[0]} | {row[1]} | {row[2]}")
        else:
            print("Activity log bos")
    except Exception as e:
        print(f"Activity log HATA: {e}")
