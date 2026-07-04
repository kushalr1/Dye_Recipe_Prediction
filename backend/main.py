from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import csv
import io
import re
import os


class Dye(BaseModel):
    name: str
    amount: float


class PredictionResponse(BaseModel):
    dyes: List[Dye]
    delta_e: float
    predicted_color: str  # hex color
    combinations: List[Dict[str, Any]] = []  # each: { name, concentration, ks: {K_S_1: val, ...} }


app = FastAPI(title="Dye Recipe Prediction API")

# Allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/samples")
def list_samples() -> dict:
    """List available sample CSV files"""
    sample_dir = "backend/sample_data"
    if not os.path.exists(sample_dir):
        return {"samples": []}
    
    samples = []
    for file in os.listdir(sample_dir):
        if file.endswith(".csv"):
            samples.append({
                "name": file,
                "display_name": file.replace("_", " ").replace(".csv", "").title()
            })
    return {"samples": samples}


@app.get("/samples/{filename}")
def download_sample(filename: str):
    """Download a sample CSV file"""
    if not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_path = f"backend/sample_data/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/csv"
    )


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str


@app.post("/login", response_model=LoginResponse)
def login(req: LoginRequest) -> LoginResponse:
    admin_user = os.getenv("ADMIN_USER", "admin")
    admin_pass = os.getenv("ADMIN_PASS", "admin123")
    if req.username == admin_user and req.password == admin_pass:
        # Return a very simple dummy token
        return LoginResponse(token="dummy-admin-token")
    raise HTTPException(status_code=401, detail="Invalid credentials")


def _normalize(s: str) -> str:
    return "".join(ch for ch in s.strip().lower() if ch.isalnum())


def _mock_prediction_from_csv(csv_bytes: bytes) -> PredictionResponse:
    # Parse CSV with robust header matching. Expected headers (from screenshot):
    #  - Dye_Code/YS_Code (or Dye_Code)
    #  - Concentration
    text = csv_bytes.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    dyes_parsed: List[Dict[str, Any]] = []
    combos: List[Dict[str, Any]] = []

    # Build a map of normalized header -> original header
    header_map: Dict[str, str] = {}
    if reader.fieldnames:
        for h in reader.fieldnames:
            header_map[_normalize(h)] = h

    # Candidate header keys
    name_keys = [
        "dyecodeyscode",
        "dyecode",
        "dye",
        "dyename",
    ]
    amount_keys = [
        "concentration",
        "conc",
        "amount",
    ]

    # Resolve actual headers, falling back if missing
    name_header = next((header_map[k] for k in name_keys if k in header_map), None)
    amount_header = next((header_map[k] for k in amount_keys if k in header_map), None)

    ks_pattern = re.compile(r"^k[_.]?s[_.]?(\d+)$", re.IGNORECASE)

    for row in reader:
        name_val = None
        amt_val = 0.0
        if name_header:
            name_val = row.get(name_header) or ""
        else:
            # try any column with 'dye' in its name
            for k, v in row.items():
                if "dye" in k.lower():
                    name_val = v
                    break
        if amount_header:
            amt_raw = row.get(amount_header) or "0"
        else:
            # try any column with 'conc' or 'amount'
            amt_raw = None
            for k, v in row.items():
                kl = k.lower()
                if "conc" in kl or "amount" in kl:
                    amt_raw = v
                    break
            if amt_raw is None:
                amt_raw = "0"
        try:
            amt_val = float(str(amt_raw).strip())
        except Exception:
            amt_val = 0.0
        if not name_val:
            continue
        # Collect K/S columns for this row
        ks: Dict[str, float] = {}
        for col, val in row.items():
            m = ks_pattern.match(_normalize(col))
            if m:
                key = f"K_S_{m.group(1)}"
                try:
                    ks[key] = float(str(val).strip())
                except Exception:
                    continue

        dyes_parsed.append({"name": name_val, "amount": amt_val})
        combos.append({"name": name_val, "concentration": amt_val, "ks": ks})

    # Sort by amount desc and pick top 3
    dyes_parsed.sort(key=lambda d: d["amount"], reverse=True)
    top = dyes_parsed[:3] if dyes_parsed else [
        {"name": "Dummy-Red", "amount": 1.0},
        {"name": "Dummy-Blue", "amount": 0.5},
    ]

    dyes = [Dye(name=d["name"], amount=float(d["amount"])) for d in top]

    # Order combinations by concentration and keep top 5
    combos.sort(key=lambda c: c.get("concentration", 0.0), reverse=True)
    combos = combos[:5]

    return PredictionResponse(dyes=dyes, delta_e=2.3, predicted_color="#aabbcc", combinations=combos)


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    # Try to treat any uploaded file as CSV; if parsing fails, fall back to dummy dyes.
    # This avoids 400s for varying MIME types across browsers.
    try:
        return _mock_prediction_from_csv(content)
    except Exception:
        return PredictionResponse(
            dyes=[
                Dye(name="Dummy-Red", amount=1.0),
                Dye(name="Dummy-Blue", amount=0.7),
                Dye(name="Dummy-Yellow", amount=0.4),
            ],
            delta_e=2.4,
            predicted_color="#aabbcc",
            combinations=[
                {
                    "name": "Dummy-Red",
                    "concentration": 1.0,
                    "ks": {f"K_S_{i}": float(i) for i in range(1, 6)},
                }
            ],
        )


# For `python backend/main.py` quick run
if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)


