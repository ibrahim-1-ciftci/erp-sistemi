import psycopg2
import json

conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='erp_db', user='openpg', password='openpgpwd', client_encoding='UTF8')
cur = conn.cursor()

tables = ['customers', 'suppliers', 'products', 'raw_materials', 'orders', 'order_items', 'productions', 'users', 'activity_logs', 'stock_movements', 'settings', 'purchases', 'cashflows', 'customer_prices', 'bom_items', 'boms', 'debts', 'payments', 'custom_roles', 'employees', 'employee_leaves', 'salary_payments', 'role_permissions']

data = {}
for t in tables:
    try:
        cur.execute(f'SELECT * FROM {t}')
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        data[t] = {'cols': cols, 'rows': [[str(v) if v is not None else None for v in r] for r in rows]}
        print(f'{t}: {len(rows)} rows')
    except Exception as e:
        print(f'{t}: SKIP - {e}')
        conn.rollback()

with open('erp_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print('Done')
