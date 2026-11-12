@echo off
echo Starting ShopPilot AI Backend on port 8000...
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python -m uvicorn main:app --reload --port 8000
