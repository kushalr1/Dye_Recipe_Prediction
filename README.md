# Dye Recipe Prediction

A full-stack dye recipe prediction web application for uploading dye/color data, generating predicted dye combinations, and comparing colors using color-space calculations.

The project includes a React + Vite frontend and a FastAPI backend. The frontend provides an admin login, file upload workflow, sample CSV downloads, prediction result display, and color matching utilities. The backend exposes simple API endpoints for authentication, sample files, health checks, and mock dye recipe prediction from uploaded CSV data.

## Features

- Admin login screen with configurable backend credentials
- Upload support for CSV files and image files
- CSV parsing for dye code, concentration, and K/S values
- Predicted dye recipe response with:
  - top dye components
  - concentration values
  - predicted color hex value
  - Delta E score
  - K/S combination data
- Sample CSV files available from the backend
- Color matcher for comparing target and sample colors
- RGB, XYZ, LAB, and Delta E color calculations
- Vite development proxy for backend API calls
- FastAPI interactive docs through Swagger UI

## Tech Stack

### Frontend

- React
- Vite
- Axios
- Tailwind CSS
- Chart.js
- React Chart.js 2

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- python-multipart

## Project Structure

```text
Dye Recipe Prediction/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── README.md
│   └── sample_data/
│       ├── dye_sample_1.csv
│       ├── dye_sample_2.csv
│       └── dye_sample_3.csv
├── public/
├── src/
│   ├── App.jsx
│   ├── DyeRecipePredictor.jsx
│   ├── colorMatcher.jsx
│   ├── Login.jsx
│   ├── Menu.jsx
│   ├── MenuCard.jsx
│   ├── Header.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Getting Started

### Prerequisites

Install these before running the project:

- Node.js 18 or later
- npm
- Python 3.10 or later
- pip

## Installation

Clone the repository:

```bash
git clone https://github.com/kushalr1/Dye_Recipe_Prediction.git
cd Dye_Recipe_Prediction
```

Install frontend dependencies:

```bash
npm install
```

Create and activate a Python virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

For Windows:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Running the Application

Start the backend server:

```bash
npm run backend
```

The backend runs at:

```text
http://localhost:8000
```

In a second terminal, start the frontend:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Login

Default admin credentials:

```text
Username: admin
Password: admin123
```

You can override these using environment variables before starting the backend:

```bash
export ADMIN_USER=myuser
export ADMIN_PASS=mypassword
npm run backend
```

## CSV Input Format

The backend is flexible with CSV headers. It looks for dye name/code and concentration columns using common names.

Supported dye name columns include:

- `Dye_Code/YS_Code`
- `Dye_Code`
- `Dye`
- `Dye_Name`

Supported concentration columns include:

- `Concentration`
- `Conc`
- `Amount`

K/S columns can be named like:

- `K_S_1`
- `K.S.1`
- `KS1`

Example CSV:

```csv
Dye_Code/YS_Code,Concentration,K_S_1,K_S_2,K_S_3
Red_Dye,1.2,0.45,0.51,0.62
Blue_Dye,0.8,0.35,0.42,0.49
Yellow_Dye,0.5,0.20,0.25,0.30
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Login

```http
POST /login
```

Request body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:

```json
{
  "token": "dummy-admin-token"
}
```

### List Sample CSV Files

```http
GET /samples
```

Response:

```json
{
  "samples": [
    {
      "name": "dye_sample_1.csv",
      "display_name": "Dye Sample 1"
    }
  ]
}
```

### Download Sample CSV

```http
GET /samples/{filename}
```

Example:

```text
http://localhost:8000/samples/dye_sample_1.csv
```

### Predict Dye Recipe

```http
POST /predict
```

Request:

- `multipart/form-data`
- field name: `file`
- accepted files: `.csv`, `.jpg`, `.jpeg`, `.png`

Example using curl:

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/sample_data/dye_sample_1.csv"
```

Example response:

```json
{
  "dyes": [
    {
      "name": "Red_Dye",
      "amount": 1.2
    }
  ],
  "delta_e": 2.3,
  "predicted_color": "#aabbcc",
  "combinations": [
    {
      "name": "Red_Dye",
      "concentration": 1.2,
      "ks": {
        "K_S_1": 0.45,
        "K_S_2": 0.51
      }
    }
  ]
}
```

## FastAPI Documentation

After starting the backend, open:

```text
http://localhost:8000/docs
```

This opens the interactive Swagger UI where you can test the API endpoints directly.

## Available Scripts

### Start frontend development server

```bash
npm run dev
```

### Build frontend for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Run ESLint

```bash
npm run lint
```

### Start backend server

```bash
npm run backend
```

## Development Notes

During development, Vite proxies API requests to the FastAPI backend.

Configured proxy paths:

- `/predict`
- `/login`
- `/health`
- `/samples`

The proxy target is:

```text
http://localhost:8000
```

This means frontend code can call `/predict` instead of manually writing the full backend URL.

## Current Prediction Logic

The current backend uses a mock prediction pipeline designed for development and demonstration:

1. Reads the uploaded file as CSV.
2. Detects dye and concentration columns.
3. Extracts available K/S columns.
4. Sorts dyes by concentration.
5. Returns the top dye components and a sample predicted color.

This can be replaced later with a trained machine learning model or a more advanced dye formulation algorithm.

## Troubleshooting

### Frontend cannot reach backend

Make sure the backend is running:

```bash
npm run backend
```

Then check:

```text
http://localhost:8000/health
```

### Login fails

Use the default credentials:

```text
admin / admin123
```

If you changed `ADMIN_USER` or `ADMIN_PASS`, restart the backend after setting them.

### Upload returns an error

Check that:

- the backend is running
- the file is not empty
- the CSV has headers
- the upload field name is `file`

### Port already in use

If port `8000` is busy, stop the existing backend process or run Uvicorn manually on another port:

```bash
cd backend
source .venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

If you change the backend port, update the proxy target in `vite.config.js`.

## Future Improvements

- Connect a real trained prediction model
- Store historical recipes in a database
- Add user roles and secure authentication
- Add Excel upload support
- Improve image-based color extraction
- Export prediction results as PDF or CSV
- Add automated tests for frontend and backend

## License

This project is currently not licensed. Add a license file before using it in production or distributing it publicly.
