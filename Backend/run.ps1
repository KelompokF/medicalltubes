# run.ps1 — Script untuk menjalankan Medicall Backend
# Usage: .\run.ps1

Write-Host "Starting Medicall API..." -ForegroundColor Cyan

# Aktifkan virtual environment
& ".\venv\Scripts\Activate.ps1"

# Jalankan server dengan reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
