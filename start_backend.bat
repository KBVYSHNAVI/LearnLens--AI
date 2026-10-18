@echo off
cd /d "d:\code files\Learnlens\backend"
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting backend on port 8001...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
