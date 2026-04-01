# ERP Sistemi - Kurulum Kılavuzu

## Gereksinimler
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

---

## Backend Kurulum

```bash
cd erp-system/backend

# Sanal ortam oluştur
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyasını oluştur
copy .env.example .env
# .env içinde DATABASE_URL ve SECRET_KEY'i düzenle

# Sunucuyu başlat (tablolar otomatik oluşur)
uvicorn app.main:app --reload --port 8000

# Örnek veri yükle (opsiyonel)
python seed.py
```

API Docs: http://localhost:8000/docs

---

## Frontend Kurulum

```bash
cd erp-system/frontend

npm install
npm run dev
```

Uygulama: http://localhost:3000

---

## Giriş Bilgileri (seed sonrası)

| Kullanıcı | Şifre    | Rol   |
|-----------|----------|-------|
| admin     | admin123 | Admin |
| user1     | user123  | User  |

---

## Özellikler

- JWT Authentication + Role-based access
- Tedarikçi, Hammadde, Ürün CRUD
- BOM (Reçete) versiyonlama sistemi
- Üretim: stok kontrolü, otomatik stok düşme, maliyet hesabı
- Sipariş yönetimi + üretime gönderme
- Dashboard: kritik stok uyarıları, özet istatistikler
- Raporlar: stok hareketleri, karlılık analizi, aktivite logları
- Arama, filtreleme, pagination
