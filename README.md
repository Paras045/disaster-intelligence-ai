# Disaster Intelligence AI — Phase 1

A college project dashboard for exploring historical Maharashtra river
discharge records and India Meteorological Department (IMD) rainfall data.
Phase 1 is an educational data-visualization prototype, not a live monitoring,
forecasting, or emergency-warning service.

## What is included

- React/Vite dashboard with working Overview, Risk Map, Rainfall Analysis,
  River Monitoring, Alerts & Warnings, and Settings navigation.
- FastAPI endpoints for river stations, station history, recent discharge,
  and rainfall summary/daily/monthly analysis.
- A Leaflet station map with coordinate-based markers, clustering, search,
  district and river filters, sorting, station details, and map focus.
- Rainfall charts for monthly spatial averages and daily average/maximum
  grid-cell observations, with missing-data and dataset metadata.
- Simulated alerts, clearly identified as examples and not official warnings.

## Data and limitations

The river API reads `datasets/raw/maharashtra_river_discharge.csv`. The current
dataset contains 332,345 records for 93 stations, 29 districts, and 13 rivers;
the latest available observation is dated 31 December 2025.

The rainfall API reads `datasets/raw/RFone_imd_rf_1x1_2024.nc`. It contains
daily 2024 rainfall in millimetres on a 1-degree grid. The dashboard uses a
preliminary rectangular selection from 15.5° to 22.5° latitude and 72.5° to
80.5° longitude (8 × 9 grid points). This is **not** an exact Maharashtra
administrative boundary mask. The selected grid contains 25,254 valid
observations and 1,098 missing values.

Both sources are historical, and their coverage periods differ. The app does
not calculate flood risk, predict disasters, or issue verified warnings. Map
background tiles are served by OpenStreetMap and require network access.

## Run locally (Windows PowerShell)

### 1. Install backend requirements

```powershell
cd D:\disaster-intelligence-ai\ml-service
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, use the Python executable directly:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 2. Start the API

In the activated backend terminal:

```powershell
cd D:\disaster-intelligence-ai\ml-service
python -m uvicorn src.api:app --reload --host 127.0.0.1 --port 8000
```

API documentation is available at <http://127.0.0.1:8000/docs>.

### 3. Install and start the frontend

In a second terminal:

```powershell
cd D:\disaster-intelligence-ai\frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally
<http://localhost:5173>). The API's development CORS configuration allows
that origin.

## Verify the project

Frontend:

```powershell
cd D:\disaster-intelligence-ai\frontend
npm run lint
npm run build
```

Backend syntax and API tests:

```powershell
cd D:\disaster-intelligence-ai\ml-service
.\venv\Scripts\Activate.ps1
python -m compileall -q src
python -m unittest discover -s tests -v
```

## Documentation

- [Phase 1 technical documentation](documentation/PHASE1_TECHNICAL.md) —
  architecture, datasets, API reference, setup, limitations, and next steps.
- [Presentation outline](documentation/PHASE1_PRESENTATION_OUTLINE.md) —
  a 12-slide guide for a project presentation.

## License and data attribution

Check the source dataset's license and attribution requirements before
redistributing the data or deploying the application. OpenStreetMap map tiles
are subject to the OpenStreetMap tile usage policy.
