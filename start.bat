@echo off
echo ==============================================================================
echo        ShopPilot AI - Omnichannel Retail & PayPal Agent Platform
echo ==============================================================================
echo.
echo [1/2] Launching Node.js Omnichannel Backend (Port 8000)...
start "ShopPilot AI - Node.js Server" cmd /c "run_server.bat"

echo [2/2] Launching React + TypeScript Dashboard (Port 5173)...
start "ShopPilot AI - Frontend Client" cmd /c "run_client.bat"

echo.
echo Both servers have been launched!
echo - Merchant Dashboard & POS:  http://localhost:5173
echo - Public Customer Store:     http://localhost:5173 (Click "Customer Storefront")
echo - Backend API Health:        http://localhost:8000
echo.
pause
