@echo off
title ERP Sistemi Durdurucu
color 0C

echo.
echo  ERP Sistemi durduruluyor...
echo.

:: Backend ve frontend pencerelerini kapat
taskkill /FI "WINDOWTITLE eq ERP - Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ERP - Frontend" /F >nul 2>&1

:: uvicorn ve node proseslerini durdur
taskkill /IM uvicorn.exe /F >nul 2>&1
taskkill /IM node.exe /F >nul 2>&1

echo  Sistem durduruldu.
timeout /t 2 /nobreak >nul
