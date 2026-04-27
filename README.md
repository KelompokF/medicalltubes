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
cd Medicall
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
uvicorn app.main:app --reload

```

### 7. Buka dokumentasi API
```
http://127.0.0.1:8000/docs
```

### 8. jalanin frontend
 ```
cd frontend

npm install

npm run dev
```
