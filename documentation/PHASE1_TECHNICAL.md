# Disaster Intelligence AI — Phase 1 Technical Documentation

## 1. Project scope

Phase 1 is a local, educational dashboard for inspecting historical river
discharge and rainfall observations. It combines a FastAPI data API with a
single-page React dashboard. It does not provide operational monitoring,
flood-risk scores, rainfall forecasts, AI predictions, or official warnings.

## 2. System architecture

```text
Browser (React + Vite)
  ├─ Overview, rainfall, river, map, alerts, and settings views
  ├─ Recharts for time-series and summary visualizations
  └─ React Leaflet for station locations and OpenStreetMap tiles
                 │ HTTP JSON (development CORS)
                 ▼
FastAPI (Uvicorn, 127.0.0.1:8000)
  ├─ Pandas reads and aggregates the river-discharge CSV
  ├─ Xarray reads and subsets the rainfall NetCDF
  └─ In-process one-entry caches avoid repeatedly loading source files
                 │
                 ▼
datasets/raw/
  ├─ maharashtra_river_discharge.csv
  └─ RFone_imd_rf_1x1_2024.nc
```

The browser navigation is local React state; it does not require a separate
router or backend session. The station explorer fetches station metadata and
the River Monitoring view fetches a selected station's history. The data
sources remain files on disk; there is no database or authentication layer.

## 3. Datasets and definitions

### River discharge CSV

Path: `datasets/raw/maharashtra_river_discharge.csv`

- 332,345 source rows.
- 93 unique monitoring stations, 29 districts, and 13 river names.
- The latest timestamp returned by the current data is 31 December 2025.
- The source column `Manual Daily River Water Discharge (m3/sec)` is returned
  by the API in cubic metres per second (`m³/s`).
- Station metadata includes coordinates, district, river, latest available
  discharge/time, and record count. Values are historical; they are not live.

### Rainfall NetCDF

Path: `datasets/raw/RFone_imd_rf_1x1_2024.nc`

- Data variable: `RAINFALL`; metadata declares units of millimetres (`mm`).
- Time coordinate: 366 daily values from 1 January through 31 December 2024.
- Source grid: 1° latitude/longitude.
- Preliminary rectangle: latitude 15.5°–22.5°, longitude 72.5°–80.5°;
  selected dimensions are 8 latitudes × 9 longitudes.
- The selected time/grid cube contains 25,254 valid observations and 1,098
  missing observations (4.17%).
- Selected-cube mean: approximately 3.9443 mm; maximum valid grid-cell
  observation: approximately 270.4808 mm.

The rectangle is a convenient first subset, not a state-boundary polygon. It
may include grid cells outside Maharashtra and exclude relevant cells. The
dashboard identifies this limitation wherever the rainfall selection is
described.

### Aggregation meanings

- Rainfall summary average: mean of all valid daily grid-cell values in the
  selected cube.
- Daily average: spatial mean of valid grid cells for that day.
- Daily maximum: largest valid grid-cell observation for that day.
- Monthly average: mean of the daily spatial averages during the calendar
  month; it is not monthly accumulated precipitation.
- Monthly peak: maximum daily spatial average observed during that month.
- Missing counts are based on the NetCDF missing-value encoding decoded by
  Xarray.

## 4. API reference

Base URL in local development: `http://127.0.0.1:8000`

| Method and path | Description |
|---|---|
| `GET /` | Service status and link to interactive API docs. |
| `GET /api/summary` | River row, station, district, river, and latest-time summary. |
| `GET /api/stations` | Latest available observation and metadata for each station. |
| `GET /api/discharge/recent?limit=20` | Latest discharge observations; `limit` is 1–100. |
| `GET /api/stations/{station_name}` | Time-ordered discharge history for a station (URL-encode its name). |
| `GET /api/rainfall/summary` | Selected-grid dimensions, bounds, rainfall summary, and missing-data counts. |
| `GET /api/rainfall/daily` | One record per day: spatial average/max and valid/missing grid-cell counts. |
| `GET /api/rainfall/monthly` | Monthly mean of daily spatial averages and monthly peak daily spatial average. |

Interactive request/response schemas are available at `/docs`. The APIs read
the local files and return JSON. Missing source files or invalid data
structures raise errors; the service does not silently substitute sample
measurements.

## 5. Frontend and backend setup

Use the instructions in the repository [README](../README.md) to create the
Python virtual environment, install dependencies, launch Uvicorn, install
frontend packages, and run Vite. In local development the frontend is normally
served at `http://localhost:5173`, which is the origin allowed by the API's
development CORS settings.

## 6. Tests and validation

Frontend:

```powershell
cd D:\disaster-intelligence-ai\frontend
npm run lint
npm run build
```

Backend (from the activated `ml-service` virtual environment):

```powershell
python -m compileall -q src
python -m unittest discover -s tests -v
```

The route tests use FastAPI's in-process `TestClient` and the checked-in
datasets. They check response status, key counts, and representative payload
shapes. They do not replace browser-based layout/accessibility testing or
validation against authoritative hydrological criteria.

## 7. Known limitations and safe interpretation

- Historical data may be stale and the river/rainfall datasets cover different
  periods.
- A 1° rainfall grid is coarse for local hazard decisions.
- The rainfall rectangle is not a Maharashtra boundary mask.
- Missing values are visible in the API and rainfall-analysis page; users
  should consider completeness before comparing dates or regions.
- The app is a local prototype without user accounts, deployment hardening,
  observability, or service-level guarantees.
- Map tiles require network access and remain subject to OpenStreetMap's tile
  policy.
- All visible alert examples are simulated. No alert severity is calculated
  from observed values.
- No model or flood prediction is implemented or validated.

## 8. Suggested Phase 2 scope

1. Obtain and document an authoritative Maharashtra boundary polygon and
   evaluate a correct spatial mask for the rainfall grid.
2. Add date/range selection and well-defined rainfall summaries, including
   accumulated totals only where scientifically appropriate.
3. Validate source metadata, missing-value handling, and river/rainfall
   definitions with domain experts.
4. Add explicit backend tests for missing files, malformed data, empty
   selections, and parameter validation.
5. Configure deployment CORS, resource limits, logging, and health checks for
   the intended hosting environment.
6. Only consider prediction or alert functionality after obtaining suitable
   labeled data, an evaluation protocol, domain review, and careful
   non-operational presentation.
