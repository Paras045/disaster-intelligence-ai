
import pandas as pd
import xarray as xr

from pathlib import Path

# Project dataset directory
DATA_DIR = Path("../datasets/raw")

csv_path = DATA_DIR / "maharashtra_river_discharge.csv"
nc_path = DATA_DIR / "RFone_imd_rf_1x1_2024.nc"


# --------------------------------
# 1. Inspect River Discharge CSV
# --------------------------------

print("\n========== RIVER DISCHARGE DATA ==========")

df = pd.read_csv(csv_path)

print("\nFirst 5 records:")
print(df.head())

print("\nColumn names:")
print(df.columns.tolist())

print("\nDataset information:")
df.info()

print("\nMissing values:")
print(df.isnull().sum())

print("\nStatistical summary:")
print(df.describe(include="all"))


# --------------------------------
# 2. Inspect IMD Rainfall NetCDF
# --------------------------------

print("\n========== IMD RAINFALL DATA ==========")

ds = xr.open_dataset(nc_path)

print("\nDataset information:")
print(ds)

print("\nDimensions:")
print(ds.dims)

print("\nCoordinates:")
print(ds.coords)

print("\nData variables:")
print(ds.data_vars)

ds.close()
