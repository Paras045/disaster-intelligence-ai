
import pandas as pd
import xarray as xr
import numpy as np
from pathlib import Path

# Dataset paths
DATA_DIR = Path("../datasets/raw")

csv_path = DATA_DIR / "maharashtra_river_discharge.csv"
nc_path = DATA_DIR / "RFone_imd_rf_1x1_2024.nc"


# ==========================================
# 1. RIVER DATA ANALYSIS
# ==========================================

print("\n========== RIVER DATA ANALYSIS ==========")

df = pd.read_csv(csv_path)

# Convert string dates into datetime
df["Data Acquisition Time"] = pd.to_datetime(
    df["Data Acquisition Time"],
    dayfirst=True,
    errors="coerce"
)

# Date range
print("\n1. Date Range:")
print("Start:", df["Data Acquisition Time"].min())
print("End:", df["Data Acquisition Time"].max())

# Unique stations
print("\n2. Total Monitoring Stations:")
print(df["Station"].nunique())

print("\n3. Top 15 Stations:")
print(df["Station"].value_counts().head(15))

# District information
print("\n4. Available Districts:")
print(df["District"].nunique())
print(sorted(df["District"].dropna().unique()))

# Sangli and Kolhapur availability
print("\n5. Sangli and Kolhapur Records:")

selected = df[
    df["District"].str.contains(
        "Sangli|Kolhapur",
        case=False,
        na=False
    )
]

print(selected.groupby("District").agg(
    records=("Station", "size"),
    stations=("Station", "nunique")
))

# River information
print("\n6. Top 15 Rivers:")
print(df["River"].value_counts().head(15))

# Duplicate records
print("\n7. Duplicate Rows:")
print(df.duplicated().sum())

# Extreme discharge values
discharge_col = (
    "Manual Daily River Water Discharge (m3/sec)"
)

print("\n8. Highest Discharge Observations:")

print(
    df.nlargest(10, discharge_col)[
        ["Station", "District", "River",
         "Data Acquisition Time", discharge_col]
    ].to_string(index=False)
)

# Discharge statistics
print("\n9. Discharge Statistics:")
print(df[discharge_col].describe())


# ==========================================
# 2. RAINFALL DATA ANALYSIS
# ==========================================

print("\n========== RAINFALL DATA ANALYSIS ==========")

ds = xr.open_dataset(nc_path)

rain = ds["RAINFALL"]

# Approximate Maharashtra geographical boundaries
maharashtra = rain.sel(
    LATITUDE=slice(15.5, 22.0),
    LONGITUDE=slice(72.0, 81.5)
)

print("\n1. Maharashtra Grid Shape:")
print(maharashtra.shape)

# Basic statistics
values = maharashtra.values
valid = values[np.isfinite(values)]

print("\n2. Rainfall Statistics (mm):")

print("Valid observations:", len(valid))
print("Minimum:", np.min(valid))
print("Maximum:", np.max(valid))
print("Mean:", np.mean(valid))
print("Median:", np.median(valid))

# Missing observations
print("\n3. Missing Rainfall Values:")
print(np.isnan(values).sum())

# Average daily rainfall across the selected grid
daily_average = maharashtra.mean(
    dim=["LATITUDE", "LONGITUDE"]
)

print("\n4. Highest Average Rainfall Days:")

print(
    daily_average.to_series()
    .sort_values(ascending=False)
    .head(10)
)

ds.close()

print("\n========== ANALYSIS COMPLETED ==========")
