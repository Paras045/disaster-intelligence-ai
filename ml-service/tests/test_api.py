import unittest
from urllib.parse import quote

from fastapi.testclient import TestClient

from src.api import app


class ApiEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_reports_service(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "running")

    def test_river_summary_has_expected_dataset_counts(self):
        response = self.client.get("/api/summary")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total_records"], 332345)
        self.assertEqual(response.json()["total_stations"], 93)

    def test_station_list_includes_coordinates_and_discharge_metadata(self):
        response = self.client.get("/api/stations")

        self.assertEqual(response.status_code, 200)
        stations = response.json()
        self.assertEqual(len(stations), 93)
        self.assertIn("latitude", stations[0])
        self.assertIn("latest_discharge", stations[0])
        self.assertIn("record_count", stations[0])

    def test_recent_discharge_respects_limit(self):
        response = self.client.get("/api/discharge/recent?limit=5")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 5)

    def test_station_history_is_available(self):
        station = self.client.get("/api/stations").json()[0]["station"]
        response = self.client.get(
            f"/api/stations/{quote(station, safe='')}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.json()), 0)
        self.assertIn("observation_time", response.json()[0])

    def test_rainfall_summary_reports_preliminary_grid_and_missing_data(self):
        response = self.client.get("/api/rainfall/summary")

        self.assertEqual(response.status_code, 200)
        summary = response.json()
        self.assertEqual(summary["unit"], "mm")
        self.assertEqual(
            summary["grid_dimensions"],
            {
                "days": 366,
                "latitude_points": 8,
                "longitude_points": 9,
            },
        )
        self.assertEqual(summary["valid_observations"], 25254)
        self.assertEqual(summary["missing_observations"], 1098)
        self.assertIn("Preliminary", summary["geographic_selection"]["description"])

    def test_daily_rainfall_contains_one_record_per_day(self):
        response = self.client.get("/api/rainfall/daily")

        self.assertEqual(response.status_code, 200)
        daily = response.json()
        self.assertEqual(len(daily), 366)
        self.assertEqual(daily[0]["date"], "2024-01-01")
        self.assertIn("maximum_rainfall_mm", daily[0])
        self.assertIn("missing_grid_cells", daily[0])

    def test_monthly_rainfall_contains_twelve_months(self):
        response = self.client.get("/api/rainfall/monthly")

        self.assertEqual(response.status_code, 200)
        monthly = response.json()
        self.assertEqual(len(monthly), 12)
        self.assertEqual(monthly[0]["month"], "2024-01")
        self.assertIn("average_daily_rainfall_mm", monthly[0])
        self.assertIn("peak_daily_average_rainfall_mm", monthly[0])


if __name__ == "__main__":
    unittest.main()
