
import pandas as pd
import xarray as xr
from pathlib import Path

DATA_DIR = Path("../datasets/raw")

# Load datasets
df = pd.read_csv(DATA_DIR / "maharashtra_river_discharge.csv")

date_col = "Data Acquisition Time"
discharge_col = "Manual Daily River Water Discharge (m3/sec)"

df[date_col] = pd.to_datetime(
    df[date_col],
    dayfirst=True,
    errors="coerce"
)

df["Date"] = df[date_col].dt.date


# ======================================
# 1. INVESTIGATE DUPLICATE STATION-DATES
# ======================================

print("\n========== DUPLICATE STATION-DATE ANALYSIS ==========")

duplicates = df[
    df.duplicated(
        subset=["Station", "Date"],
        keep=False
    )
].sort_values(["Station", "Date", date_col])

print("Total rows involved:", len(duplicates))

print(
    duplicates[
        [
            "Station",
            "District",
            "River",
            date_col,
            discharge_col
        ]
    ].head(30).to_string(index=False)
)


# ======================================
# 2. INVESTIGATE EXTREME VALUES
# ======================================

print("\n========== EXTREME VALUE ANALYSIS ==========")

extreme = df.nlargest(10, discharge_col)

print(
    extreme[
        [
            "Station",
            "District",
            "River",
            "Latitude",
            "Longitude",
            date_col,
            discharge_col
        ]
    ].to_string(index=False)
)


# ======================================
# 3. INVESTIGATE SELECTED STATIONS
# ======================================

print("\n========== SELECTED STATION DETAILS ==========")

selected_stations = [
    "KURUNDWAD",
    "Arjunwad (Seasonal)",
    "Samdoli (Seasonal)"
]

selected = df[df["Station"].isin(selected_stations)]

station_details = selected.groupby(
    ["Station", "District", "River", "Latitude", "Longitude"]
).agg(
    records=(discharge_col, "count"),
    average=(discharge_col, "mean"),
    maximum=(discharge_col, "max"),
    first_date=(date_col, "min"),
    last_date=(date_col, "max")
).reset_index()

print(station_details.to_string(index=False))


# ======================================
# 4. RAINFALL MISSING GRID INVESTIGATION
# ======================================

print("\n========== MISSING RAINFALL GRID ANALYSIS ==========")

ds = xr.open_dataset(
    DATA_DIR / "RFone_imd_rf_1x1_2024.nc"
)

rain = ds["RAINFALL"].sel(
    LATITUDE=slice(15.5, 22.0),
    LONGITUDE=slice(72.0, 81.5)
)

# Count missing values for every geographical grid cell
missing_by_location = rain.isnull().sum(dim="TIME")

print("\nMissing values by location:")

print(
    missing_by_location.to_dataframe(
        name="missing_days"
    ).reset_index().to_string(index=False)
)

# Check whether missing values are permanent
total_days = rain.sizes["TIME"]

print("\nTotal days:", total_days)

print(
    "\nGrid cells with missing values every day:",
    int((missing_by_location == total_days).sum().values)
)

print(
    "\nGrid cells with no missing values:",
    int((missing_by_location == 0).sum().values)
)

ds.close()

print("\n========== INVESTIGATION COMPLETED ==========")
