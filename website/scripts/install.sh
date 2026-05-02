#!/bin/bash
# Sunucuya ilk kurulum scripti
# Çalıştır: sudo bash website/scripts/install.sh

set -e

REPO_DIR="/var/www/laves-website"
BACKEND_DIR="$REPO_DIR/website/backend"
FRONTEND_DIR="$REPO_DIR/website/frontend"

echo "=============================="
echo " Laves Website İlk Kurulum"
echo "=============================="

# 1. Backend venv + bağımlılıklar
echo "[1/5] Python ortamı kuruluyor..."
cd "$BACKEND_DIR"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -q

# 2. .env kontrolü
if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo ""
    echo "⚠  .env dosyası oluşturuldu. Düzenlemek için:"
    echo "   nano $BACKEND_DIR/.env"
    echo "   (DATABASE_URL ve SECRET_KEY'i ayarla)"
    echo ""
    read -p "Düzenledikten sonra Enter'a bas..."
fi

# 3. Veritabanı + seed
echo "[2/5] Veritabanı hazırlanıyor..."
cd "$BACKEND_DIR"
python seed.py

# 4. Frontend build
echo "[3/5] Frontend derleniyor..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build

# 5. Systemd servis
echo "[4/5] Servis kuruluyor..."
cp "$REPO_DIR/website/scripts/laves-website.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable laves-website
systemctl start laves-website

# 6. laves-update komutu
echo "[5/5] laves-update komutu kuruluyor..."
cp "$REPO_DIR/website/scripts/laves-update.sh" /usr/local/bin/laves-update
chmod +x /usr/local/bin/laves-update
# sudo yetkisi (servis restart için şifresiz)
echo "www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart laves-website" >> /etc/sudoers.d/laves

# 7. Nginx
echo ""
echo "Nginx için:"
echo "  cp $REPO_DIR/website/nginx.conf /etc/nginx/sites-available/laves-website"
echo "  ln -s /etc/nginx/sites-available/laves-website /etc/nginx/sites-enabled/"
echo "  nginx -t && systemctl reload nginx"
echo ""
echo "=============================="
echo "✓ Kurulum tamamlandı!"
echo "Admin: http://sunucu-ip/admin  →  admin / laves2024"
echo "=============================="
