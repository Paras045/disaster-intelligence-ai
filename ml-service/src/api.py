
from functools import lru_cache
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = PROJECT_ROOT / "datasets" / "raw" / "maharashtra_river_discharge.csv"

STATION_COL = "Station"
DISTRICT_COL = "District"
RIVER_COL = "River"
LAT_COL = "Latitude"
LON_COL = "Longitude"
TIME_COL = "Data Acquisition Time"
DISCHARGE_COL = "Manual Daily River Water Discharge (m3/sec)"

app = FastAPI(
    title="Disaster Intelligence AI API",
    description="River discharge monitoring API for Maharashtra",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def load_river_data():
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_FILE}")

    df = pd.read_csv(DATA_FILE)

    required_columns = [
        STATION_COL,
        DISTRICT_COL,
        RIVER_COL,
        LAT_COL,
        LON_COL,
        TIME_COL,
        DISCHARGE_COL,
    ]

    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing CSV columns: {missing}")

    df[STATION_COL] = df[STATION_COL].astype("string").str.strip()
    df[DISTRICT_COL] = df[DISTRICT_COL].astype("string").str.strip()
    df[RIVER_COL] = df[RIVER_COL].astype("string").str.strip()

    df[TIME_COL] = pd.to_datetime(
        df[TIME_COL],
        format="%d-%m-%Y %H:%M",
        errors="coerce",
    )

    df[DISCHARGE_COL] = pd.to_numeric(
        df[DISCHARGE_COL],
        errors="coerce",
    )

    df[LAT_COL] = pd.to_numeric(df[LAT_COL], errors="coerce")
    df[LON_COL] = pd.to_numeric(df[LON_COL], errors="coerce")

    return df


@app.get("/")
def root():
    return {
        "project": "Disaster Intelligence AI",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/summary")
def get_summary():
    df = load_river_data()

    valid_dates = df[TIME_COL].dropna()

    return {
        "total_records": int(len(df)),
        "total_stations": int(df[STATION_COL].nunique()),
        "total_districts": int(df[DISTRICT_COL].nunique()),
        "total_rivers": int(df[RIVER_COL].nunique()),
        "latest_observation": (
            valid_dates.max().isoformat() if not valid_dates.empty else None
        ),
        "data_source": "Maharashtra river discharge CSV",
        "data_type": "Historical observations, not live measurements",
    }


@app.get("/api/stations")
def get_stations():
    df = load_river_data()

    valid = df.dropna(subset=[STATION_COL, TIME_COL]).copy()

    if valid.empty:
        return []

    # Keep the latest observation for each station and district.
    latest_indices = valid.groupby(
        [STATION_COL, DISTRICT_COL],
        dropna=False,
    )[TIME_COL].idxmax()

    latest = valid.loc[latest_indices].copy()

    counts = (
        valid.groupby([STATION_COL, DISTRICT_COL], dropna=False)
        .size()
        .reset_index(name="record_count")
    )

    latest = latest.merge(
        counts,
        on=[STATION_COL, DISTRICT_COL],
        how="left",
    )

    latest = latest.sort_values(STATION_COL)

    result = []

    for _, row in latest.iterrows():
        result.append({
            "station": row[STATION_COL],
            "district": row[DISTRICT_COL],
            "river": row[RIVER_COL],
            "latitude": (
                float(row[LAT_COL]) if pd.notna(row[LAT_COL]) else None
            ),
            "longitude": (
                float(row[LON_COL]) if pd.notna(row[LON_COL]) else None
            ),
            "latest_discharge": (
                float(row[DISCHARGE_COL])
                if pd.notna(row[DISCHARGE_COL]) else None
            ),
            "latest_observation": row[TIME_COL].isoformat(),
            "record_count": int(row["record_count"]),
        })

    return result


@app.get("/api/discharge/recent")
def get_recent_discharge(
    limit: int = Query(default=20, ge=1, le=100)
):
    df = load_river_data()

    recent = (
        df.dropna(subset=[TIME_COL])
        .sort_values(TIME_COL, ascending=False)
        .head(limit)
    )

    return [
        {
            "station": row[STATION_COL],
            "district": row[DISTRICT_COL],
            "river": row[RIVER_COL],
            "discharge": (
                float(row[DISCHARGE_COL])
                if pd.notna(row[DISCHARGE_COL]) else None
            ),
            "observation_time": row[TIME_COL].isoformat(),
        }
        for _, row in recent.iterrows()
    ]


@app.get("/api/stations/{station_name}")
def get_station_history(station_name: str):
    df = load_river_data()

    station_data = df[
        df[STATION_COL].str.casefold() == station_name.strip().casefold()
    ].dropna(subset=[TIME_COL])

    if station_data.empty:
        raise HTTPException(status_code=404, detail="Station not found")

    station_data = station_data.sort_values(TIME_COL)

    return [
        {
            "observation_time": row[TIME_COL].isoformat(),
            "discharge": (
                float(row[DISCHARGE_COL])
                if pd.notna(row[DISCHARGE_COL]) else None
            ),
        }
        for _, row in station_data.iterrows()
    ]
