# Medicalltubes

# Medicall API

Backend API untuk aplikasi Medicall menggunakan FastAPI & Supabase.

## Tech Stack
- FastAPI
- PostgreSQL (Supabase)
- SQLAlchemy (async)
- JWT Authentication

## Cara Menjalankan Project

### 1. Clone repository
```bash
git clone <url-repo>
cd Medicalluvicorn app.main:app --reload
```

### 2. Buat virtual environment
```bash
python -m venv venv
```

### 3. Aktifkan virtual environment
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Jalankan server
```bash
<<<<<<< HEAD
uvicorn app.main:app --port 8001 --reload
=======
uvicorn app.main:app --reload --port 8001
>>>>>>> 2aeb7bb58b5df1b52717ef134f126caa3fd70e81
```

### 6. Buka dokumentasi API
```
http://127.0.0.1:8001/docs
```

### 7. Jalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
