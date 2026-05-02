# Laves Kimya - Tanıtım Sitesi

## İlk Kurulum (Sunucu - Tek Seferlik)

```bash
# Repoyu klonla
git clone https://github.com/KULLANICI/REPO.git /var/www/laves-website
cd /var/www/laves-website

# Kurulum scriptini çalıştır
sudo bash website/scripts/install.sh
```

Script otomatik olarak şunları yapar:
- Python venv + bağımlılıklar
- Veritabanı oluşturma + seed (ürünler, kategoriler)
- Frontend build
- Systemd servisi (otomatik başlatma)
- `laves-update` komutunu sisteme ekler

## Güncelleme (Her Seferinde)

Kodu GitHub'a push ettikten sonra sunucuda:
```bash
laves-update
```

Bu kadar. Git pull → pip install → npm build → servis restart otomatik yapılır.

## Nginx Kurulumu

```bash
cp /var/www/laves-website/website/nginx.conf /etc/nginx/sites-available/laves-website
ln -s /etc/nginx/sites-available/laves-website /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Admin Paneli
- URL: laves.com/admin  (domain yokken: http://173.212.243.66/admin)
- Giriş: `admin` / `laves2024`  ← İlk girişte şifreyi değiştir!

## Notlar
- ERP sistemi port 8000'de, bu site port 8001'de çalışır — çakışma yok
- Ürün görselleri `backend/uploads/` klasörüne kaydedilir
- Domain alındıktan sonra `nginx.conf`'taki `server_name` satırını güncelle
