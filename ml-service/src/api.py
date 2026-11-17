
from functools import lru_cache
from pathlib import Path

import pandas as pd
import xarray as xr
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = PROJECT_ROOT / "datasets" / "raw" / "maharashtra_river_discharge.csv"
RAINFALL_FILE = (
    PROJECT_ROOT
    / "datasets"
    / "raw"
    / "RFone_imd_rf_1x1_2024.nc"
)

# Preliminary rectangular region, not an exact state boundary.
RAINFALL_LAT_MIN = 15.5
RAINFALL_LAT_MAX = 22.5
RAINFALL_LON_MIN = 72.5
RAINFALL_LON_MAX = 80.5

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


@lru_cache(maxsize=1)
def load_rainfall_data():
    if not RAINFALL_FILE.exists():
        raise FileNotFoundError(
            f"Rainfall dataset not found: {RAINFALL_FILE}"
        )

    dataset = xr.open_dataset(RAINFALL_FILE)
    if "RAINFALL" not in dataset:
        raise ValueError("RAINFALL variable not found in NetCDF dataset")

    rainfall = dataset["RAINFALL"]
    required_coords = ["TIME", "LATITUDE", "LONGITUDE"]
    missing_coords = [
        coord for coord in required_coords if coord not in rainfall.coords
    ]
    if missing_coords:
        raise ValueError(
            f"Missing rainfall coordinates: {missing_coords}"
        )

    return rainfall.sel(
        LATITUDE=slice(RAINFALL_LAT_MIN, RAINFALL_LAT_MAX),
        LONGITUDE=slice(RAINFALL_LON_MIN, RAINFALL_LON_MAX),
    )


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


@app.get("/api/rainfall/summary")
def get_rainfall_summary():
    rainfall = load_rainfall_data()

    valid_count = int(rainfall.count().item())
    total_count = int(rainfall.size)
    missing_count = total_count - valid_count
    minimum = rainfall.min(skipna=True).item()
    maximum = rainfall.max(skipna=True).item()
    average = rainfall.mean(skipna=True).item()

    return {
        "data_source": "IMD RFone rainfall dataset",
        "data_type": "Historical daily rainfall observations",
        "year": 2024,
        "unit": rainfall.attrs.get("units", "mm"),
        "grid_dimensions": {
            "days": int(rainfall.sizes["TIME"]),
            "latitude_points": int(rainfall.sizes["LATITUDE"]),
            "longitude_points": int(rainfall.sizes["LONGITUDE"]),
        },
        "geographic_selection": {
            "latitude_min": RAINFALL_LAT_MIN,
            "latitude_max": RAINFALL_LAT_MAX,
            "longitude_min": RAINFALL_LON_MIN,
            "longitude_max": RAINFALL_LON_MAX,
            "description": (
                "Preliminary rectangular Maharashtra-region selection"
            ),
        },
        "valid_observations": valid_count,
        "missing_observations": missing_count,
        "missing_percentage": (
            round((missing_count / total_count) * 100, 2)
            if total_count
            else 0
        ),
        "minimum_rainfall_mm": (
            float(minimum) if pd.notna(minimum) else None
        ),
        "maximum_rainfall_mm": (
            float(maximum) if pd.notna(maximum) else None
        ),
        "average_rainfall_mm": (
            round(float(average), 4) if pd.notna(average) else None
        ),
    }


@app.get("/api/rainfall/daily")
def get_daily_rainfall():
    rainfall = load_rainfall_data()
    daily_average = rainfall.mean(
        dim=["LATITUDE", "LONGITUDE"],
        skipna=True,
    )
    daily_maximum = rainfall.max(
        dim=["LATITUDE", "LONGITUDE"],
        skipna=True,
    )
    daily_valid = rainfall.count(dim=["LATITUDE", "LONGITUDE"])
    total_grid_cells = (
        rainfall.sizes["LATITUDE"] * rainfall.sizes["LONGITUDE"]
    )

    result = []
    for timestamp in rainfall.TIME.values:
        average = daily_average.sel(TIME=timestamp).item()
        maximum = daily_maximum.sel(TIME=timestamp).item()
        valid = int(daily_valid.sel(TIME=timestamp).item())
        missing = total_grid_cells - valid

        result.append({
            "date": pd.Timestamp(timestamp).strftime("%Y-%m-%d"),
            "average_rainfall_mm": (
                round(float(average), 3) if pd.notna(average) else None
            ),
            "maximum_rainfall_mm": (
                round(float(maximum), 3) if pd.notna(maximum) else None
            ),
            "valid_grid_cells": valid,
            "missing_grid_cells": missing,
            "missing_percentage": (
                round((missing / total_grid_cells) * 100, 2)
                if total_grid_cells
                else 0
            ),
        })

    return result


@app.get("/api/rainfall/monthly")
def get_monthly_rainfall():
    rainfall = load_rainfall_data()
    daily_average = rainfall.mean(
        dim=["LATITUDE", "LONGITUDE"],
        skipna=True,
    )
    monthly_average = daily_average.resample(TIME="MS").mean(skipna=True)
    monthly_peak = daily_average.resample(TIME="MS").max(skipna=True)

    result = []
    for timestamp in monthly_average.TIME.values:
        average = monthly_average.sel(TIME=timestamp).item()
        peak = monthly_peak.sel(TIME=timestamp).item()
        result.append({
            "month": pd.Timestamp(timestamp).strftime("%Y-%m"),
            "average_daily_rainfall_mm": (
                round(float(average), 3) if pd.notna(average) else None
            ),
            "peak_daily_average_rainfall_mm": (
                round(float(peak), 3) if pd.notna(peak) else None
            ),
        })

    return result
