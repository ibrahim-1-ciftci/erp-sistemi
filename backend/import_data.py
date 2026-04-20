"""
Sunucuda çalıştırılacak import scripti.
erp_data.json dosyasındaki veriyi PostgreSQL'e yükler.
"""
import sys, json, os
sys.path.insert(0, '/opt/erp/backend')

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres@/erp_db')
engine = create_engine(DATABASE_URL)

with open('/root/erp_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Tablo sırası — foreign key bağımlılıklarına göre
TABLE_ORDER = [
    'users', 'custom_roles', 'role_permissions',
    'suppliers', 'customers', 'raw_materials', 'products',
    'boms', 'bom_items', 'customer_prices',
    'orders', 'order_items', 'productions',
    'purchases', 'payments', 'debts', 'cashflows',
    'employees', 'employee_leaves', 'salary_payments',
    'settings', 'stock_movements', 'activity_logs',
]

with engine.connect() as conn:
    # Foreign key kontrollerini geçici kapat
    conn.execute(text("SET session_replication_role = 'replica';"))

    for table in TABLE_ORDER:
        if table not in data:
            print(f"SKIP {table} (veri yok)")
            continue
        tdata = data[table]
        cols = tdata['cols']
        rows = tdata['rows']
        if not rows:
            print(f"SKIP {table} (0 satır)")
            continue

        # Tabloyu temizle
        conn.execute(text(f"TRUNCATE TABLE {table} CASCADE;"))

        # Veriyi ekle
        inserted = 0
        for row in rows:
            values = {}
            for i, col in enumerate(cols):
                val = row[i]
                if val == 'None':
                    val = None
                values[col] = val

            placeholders = ', '.join([f':{c}' for c in cols])
            col_names = ', '.join(cols)
            sql = text(f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})")
            try:
                conn.execute(sql, values)
                inserted += 1
            except Exception as e:
                print(f"  HATA {table} satır {inserted}: {e}")
                conn.execute(text("ROLLBACK TO SAVEPOINT sp;"))

        print(f"OK {table}: {inserted} satır")

    # Sequence'leri güncelle
    for table in TABLE_ORDER:
        try:
            conn.execute(text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1));"))
        except:
            pass

    conn.execute(text("SET session_replication_role = 'origin';"))
    conn.commit()

print("\nImport tamamlandi!")
