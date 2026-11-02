
import pandas as pd
import xarray as xr
import numpy as np
from pathlib import Path

DATA_DIR = Path("../datasets/raw")

# Load river dataset
df = pd.read_csv(DATA_DIR / "maharashtra_river_discharge.csv")

date_col = "Data Acquisition Time"
discharge_col = "Manual Daily River Water Discharge (m3/sec)"

df[date_col] = pd.to_datetime(
    df[date_col],
    dayfirst=True,
    errors="coerce"
)

df["Date"] = df[date_col].dt.date


# ==================================
# 1. STATION ANALYSIS
# ==================================

print("\n========== STATION ANALYSIS ==========")

station_summary = df.groupby(
    ["District", "Station"]
).agg(
    records=(discharge_col, "count"),
    first_date=(date_col, "min"),
    last_date=(date_col, "max"),
    average_discharge=(discharge_col, "mean"),
    maximum_discharge=(discharge_col, "max")
).reset_index()

print("\nSangli and Kolhapur stations:")

print(
    station_summary[
        station_summary["District"].isin(
            ["Sangli", "Kolhapur"]
        )
    ].to_string(index=False)
)


# ==================================
# 2. EXTREME VALUE INVESTIGATION
# ==================================

print("\n========== EXTREME VALUES ==========")

print("\nDischarge quantiles:")

print(
    df[discharge_col].quantile(
        [0, 0.25, 0.50, 0.75, 0.90, 0.95, 0.99, 0.999, 1]
    )
)

print("\nObservations above 100,000 m3/sec:")

extreme = df[df[discharge_col] > 100000]

print("Total extreme observations:", len(extreme))

print(
    extreme[
        [
            "Station",
            "District",
            "River",
            date_col,
            discharge_col
        ]
    ].to_string(index=False)
)


# ==================================
# 3. DAILY OBSERVATION CHECK
# ==================================

print("\n========== DAILY OBSERVATION CHECK ==========")

daily_counts = df.groupby(
    ["Station", "Date"]
).size()

print("\nObservations per station-date:")

print(daily_counts.describe())

print(
    "\nStation-date combinations with multiple observations:",
    (daily_counts > 1).sum()
)


# ==================================
# 4. RAINFALL MISSING VALUE CHECK
# ==================================

print("\n========== RAINFALL QUALITY ==========")

ds = xr.open_dataset(
    DATA_DIR / "RFone_imd_rf_1x1_2024.nc"
)

rain = ds["RAINFALL"].sel(
    LATITUDE=slice(15.5, 22.0),
    LONGITUDE=slice(72.0, 81.5)
)

total = rain.size
missing = int(rain.isnull().sum().values)

print("Total observations:", total)
print("Missing observations:", missing)
print("Missing percentage:", round(missing / total * 100, 2))

print("\nRainfall variable attributes:")
print(rain.attrs)

# Missing values per day
missing_per_day = rain.isnull().sum(
    dim=["LATITUDE", "LONGITUDE"]
)

print("\nDays with highest missing grid observations:")

print(
    missing_per_day.to_series()
    .sort_values(ascending=False)
    .head(10)
)

ds.close()

print("\n========== QUALITY CHECK COMPLETED ==========")
