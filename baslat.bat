@echo off
title ERP Sistemi Baslatici
color 0A

echo.
echo  ========================================
echo    ERP Sistemi Baslatiliyor...
echo  ========================================
echo.

:: Backend'i yeni pencerede baslat
echo  [1/2] Backend baslatiliyor...
start "ERP - Backend" cmd /k "cd /d "C:\Users\ali63\Desktop\Laves kimya\erp-system\backend" && venv\Scripts\uvicorn app.main:app --port 8000"

:: 3 saniye bekle (backend ayaga kalksın)
timeout /t 5 /nobreak >nul

:: Frontend'i yeni pencerede baslat
echo  [2/2] Frontend baslatiliyor...
start "ERP - Frontend" cmd /k "cd /d "C:\Users\ali63\Desktop\Laves kimya\erp-system\frontend" && npm run dev"

:: 6 saniye bekle (frontend derlensin)
timeout /t 6 /nobreak >nul

:: Tarayiciyi ac
echo  Tarayici aciliyor...
start http://localhost:3000

echo.
echo  ========================================
echo    Sistem hazir! localhost:3000
echo    Kapatmak icin backend/frontend
echo    pencerelerini kapatin.
echo  ========================================
echo.
pause
