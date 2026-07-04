# Dye Recipe Prediction Backend (FastAPI)

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Run (port 8000)

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check:

- Open `http://localhost:8000/health`

The frontend is configured to proxy `/predict` to `http://localhost:8000/predict` during development.
