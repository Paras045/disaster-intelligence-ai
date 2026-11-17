# Phase 1 Presentation Outline (12 Slides)

Use this as a short presentation guide. Do not present this prototype as an
operational warning or prediction system.

1. **Title** — Disaster Intelligence AI; Phase 1; presenter, department, and
   project guide.
2. **Problem context** — Why historical environmental observations and
   monitoring-station information can be useful for exploration.
3. **Project objectives** — Bring river discharge and gridded rainfall data
   together in a transparent dashboard.
4. **System architecture** — React/Vite browser, FastAPI JSON endpoints,
   Pandas/Xarray processing, and local CSV/NetCDF files.
5. **River dataset** — 332,345 records, 93 stations, 29 districts, 13 rivers;
   units and historical time coverage.
6. **Rainfall dataset** — IMD RFone 2024, 366 daily values, 1° grid, mm units,
   and the preliminary 8 × 9 rectangle.
7. **Rainfall analysis** — Monthly average daily rainfall, daily average and
   grid-cell maximum, valid/missing observation counts.
8. **River monitoring** — Recent recorded observations and selectable
   station-history chart with station information.
9. **Monitoring map** — Station markers, clustering, search, filters, sorting,
   and map focus; locations only, no risk score.
10. **Application navigation** — Overview, Risk Map, Rainfall Analysis, River
    Monitoring, simulated Alerts, and project Settings.
11. **Limitations and responsible interpretation** — Historical/stale values,
    coarse grid, preliminary region, simulated alerts, no prediction model.
12. **Conclusion and next steps** — Phase 1 deliverable; boundary mask,
    domain validation, stronger testing, and carefully scoped Phase 2.
