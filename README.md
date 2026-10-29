# GOLDSPREAD

GOLDSPREAD is a prototype research dashboard for comparing MCX gold contracts on a common price basis. The project contains a React/Vite frontend and a FastAPI backend with contract metadata, price normalization, spread statistics, and a four-stage signal filter.

**Project status:** prototype. The dashboard currently uses simulated market data. It does not ingest MCX bhavcopy files or live prices, and it does not send orders. The frontend calculations are currently separate from the backend API.

## Current capabilities

- A dashboard with contract-pair selection, synthetic scenarios, charts, and a simulated signal-filter view.
- A backend endpoint that returns contract metadata (`GET /contracts`).
- A backend analysis endpoint (`POST /analyze`) that normalizes supplied prices, calculates spread statistics from supplied histories, and evaluates statistical, volume, cost, and expiry filters.
- Interactive API documentation at `/docs` when the backend is running.

These capabilities are a prototype implementation, not evidence of live exchange connectivity, validated strategy performance, or executable trading signals.

## Requirements

- Node.js and npm
- Python 3.10 or newer
- Git, if cloning this repository

Docker Compose is not currently a supported setup path: the compose file refers to `backend/Dockerfile` and `frontend/Dockerfile`, and neither file is present.

## Run locally on Windows (PowerShell)

Open two PowerShell terminals from the repository root.

### 1. Start the backend

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks virtual-environment activation, run this once in that terminal, then activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Backend URLs:

- API: <http://127.0.0.1:8000>
- Interactive API docs: <http://127.0.0.1:8000/docs>
- Contract metadata: <http://127.0.0.1:8000/contracts>

### 2. Start the frontend

In a second terminal, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally <http://localhost:3000>).

## Run locally on macOS or Linux

Use separate terminals.

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend, from the repository root in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally <http://localhost:3000>).

## Calling the analysis API

`POST /analyze` expects JSON with both contract symbols, current prices and volumes, days to expiry, historical price arrays, and an optional Z-score threshold. Example:

```json
{
  "sym_a": "GOLDM",
  "sym_b": "GOLDPETAL",
  "price_a": 74250,
  "price_b": 7480,
  "vol_a": 2000,
  "vol_b": 1000,
  "dte_a": 20,
  "dte_b": 30,
  "hist_a": [74200, 74210, 74220, 74230, 74240, 74250, 74245, 74255, 74260, 74270, 74265, 74275, 74280, 74290],
  "hist_b": [7470, 7471, 7472, 7473, 7474, 7475, 7474, 7476, 7477, 7478, 7477, 7479, 7480, 7481],
  "z_threshold": 2.0
}
```

Send the request to `http://127.0.0.1:8000/analyze`; the same request can be tried in the `/docs` page. The history arrays are raw prices for their respective contracts. The endpoint returns normalized current prices, spread statistics, and the filter verdict.

## Important implementation notes

- The UI currently generates synthetic prices and scenarios in the browser. Its “streaming” display is a timer-driven simulation, not an MCX feed.
- The frontend does not currently call `/contracts` or `/analyze`; the API runs independently.
- Contract metadata differs between `backend/contracts.py` and `frontend/src/App.jsx` (including purity assumptions). Verify the official contract specifications and consolidate them before treating results as reliable.
- The cost, volume, expiry, and backtest figures shown in the UI are prototype assumptions or illustrative values. They have not been validated against exchange data or real execution.
- The backend expects sufficient, valid historical values for meaningful statistics. No data ingestion, persistence, user authentication, or trading integration is included.

## Suggested next implementation steps

1. Validate contract specifications and cost assumptions, then establish one shared source of truth.
2. Add historical file ingestion and validation, starting with a documented CSV format.
3. Connect the dashboard to the backend and show API errors and data timestamps clearly.
4. Add reproducible calculation checks and walk-forward backtesting on verified data before presenting performance claims.
5. Add live data only after the historical workflow is reliable and the data source and usage rights are established.

## Technology

- Frontend: React, Vite, Recharts, and Lucide
- Backend: FastAPI, Pydantic, NumPy, and pandas
- Data source described by the project concept: MCX daily bhavcopy and settlement data (not yet integrated)

## Team

Hack in Hills — Digital Twins

Aritra Basak and Avirup Chakraborty
