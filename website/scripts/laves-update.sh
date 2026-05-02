#!/bin/bash
# /usr/local/bin/laves-update
# Kullanım: laves-update

set -e

REPO_DIR="/var/www/laves-website"
BACKEND_DIR="$REPO_DIR/website/backend"
FRONTEND_DIR="$REPO_DIR/website/frontend"
SERVICE_NAME="laves-website"
VENV="$BACKEND_DIR/venv"

echo "=============================="
echo " Laves Website Güncelleniyor"
echo "=============================="

# 1. Git pull
echo "[1/4] Kod çekiliyor..."
cd "$REPO_DIR"
git pull origin main

# 2. Backend bağımlılıkları
echo "[2/4] Backend bağımlılıkları güncelleniyor..."
source "$VENV/bin/activate"
pip install -r "$BACKEND_DIR/requirements.txt" -q

# 3. Frontend build
echo "[3/4] Frontend derleniyor..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build

# 4. Servisi yeniden başlat
echo "[4/4] Servis yeniden başlatılıyor..."
sudo systemctl restart "$SERVICE_NAME"

echo ""
echo "✓ Güncelleme tamamlandı!"
echo "=============================="
